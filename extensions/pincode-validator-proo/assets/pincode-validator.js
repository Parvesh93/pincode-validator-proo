(function () {
  "use strict";

  var WIDGET_SELECTOR = "[data-pincode-validator]";
  var INITIALIZED_ATTRIBUTE = "data-pincode-initialized";
  var STORAGE_KEY = "pv_last_pincode";
  var BUTTON_DISABLED_CLASS = "pv-purchase-restricted";
  var RESTRICTION_DESCRIPTION_ID =
    "pv-purchase-restriction-description";

  var defaultSettings = {
    restrictAddToCart: true,
    restrictBuyNow: true,
    requireValidation: true,
    rememberPincodeDays: 7,
    successMessage: "Delivery available for this pincode.",
    failureMessage:
      "Sorry, delivery is not available for this pincode.",
  };

  var ADD_TO_CART_SELECTORS = [
    'button[name="add"]',
    'input[name="add"]',
    '[name="add"][type="submit"]',
    "[data-add-to-cart]",
    "[data-product-atc]",
    "[data-product-add-to-cart]",
    "[data-add-to-cart-button]",
    ".product-form__submit",
    ".product-form__cart-submit",
    ".product-form__add-button",
    ".add-to-cart",
    ".addtocart",
    ".btn--add-to-cart",
    ".product__add-to-cart",
    ".product-add-to-cart",
    '.product-form button[type="submit"]',
    'form[action*="/cart/add"] button[type="submit"]',
  ];

  var BUY_NOW_BUTTON_SELECTORS = [
    ".shopify-payment-button__button",
    ".shopify-payment-button button",
    "[data-shopify-buttoncontainer] button",
    "[data-buy-now]",
    "[data-dynamic-checkout-button]",
  ];

  var BUY_NOW_CONTAINER_SELECTORS = [
    ".shopify-payment-button",
    "[data-shopify-buttoncontainer]",
    "[data-dynamic-checkout]",
  ];

  var PRODUCT_FORM_SELECTORS = [
    'form[action*="/cart/add"]',
    "product-form form",
    ".product-form",
    "[data-product-form]",
    ".shopify-product-form",
  ];

  var VARIANT_SELECTORS = [
    'input[name="id"]',
    'select[name="id"]',
    'input[name="options"]',
    'select[name^="options"]',
    'input[name^="options"]',
    "[data-option-selector] input",
    "[data-option-selector] select",
    "variant-selects select",
    "variant-radios input",
  ];

  var instances = [];
  var responseCache = new Map();
  var pendingRequests = new Map();

  var globalObserver = null;
  var refreshTimer = null;
  var globalEventsAttached = false;
  var restoreStarted = false;
  var lastAnnouncement = "";

  var sharedState = {
    pincode: "",
    valid: false,
    responseData: null,
    loading: false,
    settings: Object.assign({}, defaultSettings),
  };

  function queryAll(selectors, root) {
    var searchRoot = root || document;
    var nodes = [];

    selectors.forEach(function (selector) {
      try {
        var matches = searchRoot.querySelectorAll(selector);

        Array.prototype.forEach.call(
          matches,
          function (node) {
            if (nodes.indexOf(node) === -1) {
              nodes.push(node);
            }
          },
        );
      } catch (error) {
        console.warn(
          "Pincode Validator: invalid selector ignored.",
          selector,
        );
      }
    });

    return nodes;
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function parseJsonSafely(text) {
    try {
      return JSON.parse(text);
    } catch (error) {
      return null;
    }
  }

  function isValidPincode(pincode) {
    return /^[1-9][0-9]{5}$/.test(pincode);
  }

  function getActiveInstances() {
    cleanupDisconnectedInstances();

    return instances.filter(function (instance) {
      return (
        !instance.destroyed &&
        document.documentElement.contains(instance.widget)
      );
    });
  }

  function getPrimaryInstance() {
    var activeInstances = getActiveInstances();

    return activeInstances.length
      ? activeInstances[0]
      : null;
  }

  function getPrimaryEndpoint() {
    var primaryInstance = getPrimaryInstance();

    return primaryInstance
      ? primaryInstance.endpoint
      : "";
  }

  function mergeSharedSettings(settings) {
    if (!settings || typeof settings !== "object") {
      return;
    }

    sharedState.settings = Object.assign(
      {},
      defaultSettings,
      sharedState.settings,
      settings,
    );
  }

  function getSavedPincodeRecord() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);

      if (!raw) {
        return null;
      }

      var parsed = JSON.parse(raw);

      if (
        !parsed ||
        typeof parsed !== "object" ||
        !parsed.pincode ||
        !parsed.expiresAt
      ) {
        window.localStorage.removeItem(STORAGE_KEY);
        return null;
      }

      if (Date.now() > Number(parsed.expiresAt)) {
        window.localStorage.removeItem(STORAGE_KEY);
        return null;
      }

      return parsed;
    } catch (error) {
      return null;
    }
  }

  function savePincode(pincode, rememberDays) {
    try {
      var parsedDays = Number(rememberDays);

      var days =
        Number.isFinite(parsedDays) &&
        parsedDays > 0
          ? parsedDays
          : 7;

      var expiresAt =
        Date.now() +
        days * 24 * 60 * 60 * 1000;

      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          pincode: pincode,
          expiresAt: expiresAt,
        }),
      );
    } catch (error) {
      console.warn(
        "Pincode Validator: pincode could not be saved.",
      );
    }
  }

  function clearSavedPincode() {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.warn(
        "Pincode Validator: saved pincode could not be cleared.",
      );
    }
  }

  function ensureRestrictionDescription() {
    var existing = document.getElementById(
      RESTRICTION_DESCRIPTION_ID,
    );

    if (existing) {
      return existing;
    }

    var description = document.createElement("span");

    description.id = RESTRICTION_DESCRIPTION_ID;
    description.className = "pv-visually-hidden";
    description.textContent =
      "Complete delivery pincode validation before purchasing this product.";

    document.body.appendChild(description);

    return description;
  }

  function addDescribedBy(element, descriptionId) {
    if (!element || !descriptionId) {
      return;
    }

    var current = (
      element.getAttribute("aria-describedby") || ""
    )
      .split(/\s+/)
      .filter(Boolean);

    if (current.indexOf(descriptionId) === -1) {
      current.push(descriptionId);
    }

    element.setAttribute(
      "aria-describedby",
      current.join(" "),
    );
  }

  function removeDescribedBy(element, descriptionId) {
    if (!element || !descriptionId) {
      return;
    }

    var current = (
      element.getAttribute("aria-describedby") || ""
    )
      .split(/\s+/)
      .filter(Boolean)
      .filter(function (id) {
        return id !== descriptionId;
      });

    if (current.length) {
      element.setAttribute(
        "aria-describedby",
        current.join(" "),
      );
    } else {
      element.removeAttribute("aria-describedby");
    }
  }

  function findClosestProductContext(widget) {
    var contextSelectors = [
      ".product",
      ".product__info-container",
      ".product-info",
      ".product-details",
      ".product-form-container",
      ".quick-add-modal",
      ".quick-view",
      ".quick-view-modal",
      "product-info",
      "product-modal",
      "[data-product-root]",
      "[data-product-section]",
      "[data-product-id]",
    ];

    for (
      var index = 0;
      index < contextSelectors.length;
      index += 1
    ) {
      var context = widget.closest(
        contextSelectors[index],
      );

      if (context) {
        return context;
      }
    }

    var section = widget.closest(
      ".shopify-section, [id^='shopify-section-']",
    );

    return section || document;
  }

  function getRelevantProductContexts() {
    var contexts = [];

    getActiveInstances().forEach(function (instance) {
      var context = findClosestProductContext(
        instance.widget,
      );

      if (contexts.indexOf(context) === -1) {
        contexts.push(context);
      }
    });

    if (!contexts.length) {
      contexts.push(document);
    }

    return contexts;
  }

  function findPurchaseControls() {
    var contexts = getRelevantProductContexts();

    var addToCartButtons = [];
    var buyNowButtons = [];
    var buyNowContainers = [];

    contexts.forEach(function (context) {
      queryAll(
        ADD_TO_CART_SELECTORS,
        context,
      ).forEach(function (node) {
        if (addToCartButtons.indexOf(node) === -1) {
          addToCartButtons.push(node);
        }
      });

      queryAll(
        BUY_NOW_BUTTON_SELECTORS,
        context,
      ).forEach(function (node) {
        if (buyNowButtons.indexOf(node) === -1) {
          buyNowButtons.push(node);
        }
      });

      queryAll(
        BUY_NOW_CONTAINER_SELECTORS,
        context,
      ).forEach(function (node) {
        if (buyNowContainers.indexOf(node) === -1) {
          buyNowContainers.push(node);
        }
      });
    });

    return {
      addToCartButtons: addToCartButtons,
      buyNowButtons: buyNowButtons,
      buyNowContainers: buyNowContainers,
    };
  }

  function rememberOriginalButtonState(button) {
    if (
      button.getAttribute(
        "data-pv-original-disabled",
      ) === null
    ) {
      button.setAttribute(
        "data-pv-original-disabled",
        button.disabled ? "true" : "false",
      );
    }

    if (
      button.getAttribute(
        "data-pv-original-aria-disabled",
      ) === null
    ) {
      var ariaDisabled =
        button.getAttribute("aria-disabled");

      button.setAttribute(
        "data-pv-original-aria-disabled",
        ariaDisabled === null ? "" : ariaDisabled,
      );
    }
  }

  function restrictButton(button) {
    if (!button) {
      return;
    }

    ensureRestrictionDescription();
    rememberOriginalButtonState(button);

    button.disabled = true;
    button.setAttribute("aria-disabled", "true");
    button.classList.add(BUTTON_DISABLED_CLASS);
    button.setAttribute("data-pv-restricted", "true");

    addDescribedBy(
      button,
      RESTRICTION_DESCRIPTION_ID,
    );
  }

  function restoreButton(button) {
    if (!button) {
      return;
    }

    var originalDisabled = button.getAttribute(
      "data-pv-original-disabled",
    );

    var originalAriaDisabled = button.getAttribute(
      "data-pv-original-aria-disabled",
    );

    if (originalDisabled !== null) {
      button.disabled =
        originalDisabled === "true";
    } else {
      button.disabled = false;
    }

    if (
      originalAriaDisabled === null ||
      originalAriaDisabled === ""
    ) {
      button.removeAttribute("aria-disabled");
    } else {
      button.setAttribute(
        "aria-disabled",
        originalAriaDisabled,
      );
    }

    button.classList.remove(BUTTON_DISABLED_CLASS);
    button.removeAttribute("data-pv-restricted");

    removeDescribedBy(
      button,
      RESTRICTION_DESCRIPTION_ID,
    );
  }

  function restrictBuyNowContainer(container) {
    if (!container) {
      return;
    }

    if (
      container.getAttribute(
        "data-pv-original-pointer-events",
      ) === null
    ) {
      container.setAttribute(
        "data-pv-original-pointer-events",
        container.style.pointerEvents || "",
      );
    }

    if (
      container.getAttribute(
        "data-pv-original-opacity",
      ) === null
    ) {
      container.setAttribute(
        "data-pv-original-opacity",
        container.style.opacity || "",
      );
    }

    container.style.pointerEvents = "none";
    container.style.opacity = "0.55";

    container.setAttribute("aria-disabled", "true");
    container.classList.add(BUTTON_DISABLED_CLASS);

    addDescribedBy(
      container,
      RESTRICTION_DESCRIPTION_ID,
    );
  }

  function restoreBuyNowContainer(container) {
    if (!container) {
      return;
    }

    var pointerEvents = container.getAttribute(
      "data-pv-original-pointer-events",
    );

    var opacity = container.getAttribute(
      "data-pv-original-opacity",
    );

    container.style.pointerEvents =
      pointerEvents || "";

    container.style.opacity = opacity || "";

    container.removeAttribute("aria-disabled");
    container.classList.remove(
      BUTTON_DISABLED_CLASS,
    );

    removeDescribedBy(
      container,
      RESTRICTION_DESCRIPTION_ID,
    );
  }

  function updateRestrictionNotes(shouldRestrict) {
    getActiveInstances().forEach(function (instance) {
      if (!instance.restrictionNote) {
        return;
      }

      instance.restrictionNote.hidden =
        !shouldRestrict;
    });
  }

  function applySharedPurchaseState() {
    var controls = findPurchaseControls();
    var settings = sharedState.settings;

    var shouldAllowPurchase =
      !settings.requireValidation ||
      sharedState.valid;

    controls.addToCartButtons.forEach(
      function (button) {
        if (
          shouldAllowPurchase ||
          !settings.restrictAddToCart
        ) {
          restoreButton(button);
        } else {
          restrictButton(button);
        }
      },
    );

    controls.buyNowButtons.forEach(
      function (button) {
        if (
          shouldAllowPurchase ||
          !settings.restrictBuyNow
        ) {
          restoreButton(button);
        } else {
          restrictButton(button);
        }
      },
    );

    controls.buyNowContainers.forEach(
      function (container) {
        if (
          shouldAllowPurchase ||
          !settings.restrictBuyNow
        ) {
          restoreBuyNowContainer(container);
        } else {
          restrictBuyNowContainer(container);
        }
      },
    );

    updateRestrictionNotes(
      !shouldAllowPurchase &&
        (settings.restrictAddToCart ||
          settings.restrictBuyNow),
    );
  }

  function createInstance(widget) {
    var input = widget.querySelector(
      "[data-pincode-input]",
    );

    var submitButton = widget.querySelector(
      "[data-pincode-submit]",
    );

    var buttonText = widget.querySelector(
      "[data-pincode-button-text]",
    );

    var spinner = widget.querySelector(
      "[data-pincode-spinner]",
    );

    var result = widget.querySelector(
      "[data-pincode-result]",
    );

    var fieldError = widget.querySelector(
      "[data-pincode-field-error]",
    );

    var restrictionNote = widget.querySelector(
      "[data-pincode-restriction-note]",
    );

    var endpoint = widget.getAttribute(
      "data-endpoint",
    );

    if (
      !input ||
      !submitButton ||
      !result ||
      !fieldError ||
      !endpoint
    ) {
      console.warn(
        "Pincode Validator: required widget elements are missing.",
      );

      return null;
    }

    return {
      widget: widget,
      input: input,
      submitButton: submitButton,
      buttonText: buttonText,
      spinner: spinner,
      result: result,
      fieldError: fieldError,
      restrictionNote: restrictionNote,
      endpoint: endpoint,
      originalButtonLabel: buttonText
        ? buttonText.textContent.trim()
        : "Check",
      variantValue: "",
      destroyed: false,
      suppressInputEvent: false,
    };
  }

  function setInstanceLoading(instance, loading) {
    instance.submitButton.disabled = loading;

    instance.submitButton.setAttribute(
      "aria-busy",
      loading ? "true" : "false",
    );

    instance.widget.classList.toggle(
      "pv-widget--loading",
      loading,
    );

    if (instance.spinner) {
      instance.spinner.hidden = !loading;
    }

    if (instance.buttonText) {
      instance.buttonText.textContent = loading
        ? "Checking delivery availability"
        : instance.originalButtonLabel;
    }
  }

  function setAllInstancesLoading(loading) {
    sharedState.loading = loading;

    getActiveInstances().forEach(
      function (instance) {
        setInstanceLoading(instance, loading);
      },
    );
  }

  function clearFieldError(instance) {
    instance.input.setAttribute(
      "aria-invalid",
      "false",
    );

    instance.fieldError.textContent = "";
    instance.fieldError.hidden = true;
  }

  function setFieldError(instance, message) {
    instance.input.setAttribute(
      "aria-invalid",
      "true",
    );

    instance.fieldError.textContent = message;
    instance.fieldError.hidden = false;
  }

  function clearAllFieldErrors() {
    getActiveInstances().forEach(
      clearFieldError,
    );
  }

  function setFieldErrorOnAll(message) {
    getActiveInstances().forEach(
      function (instance) {
        setFieldError(instance, message);
      },
    );
  }

  function renderEmpty(instance) {
    instance.result.innerHTML = "";
    instance.result.className =
      "pv-widget__result";
  }

  function renderError(instance, message) {
    instance.result.textContent =
      message ||
      "Could not validate pincode.";

    instance.result.className =
      "pv-widget__result pv-widget__result--error";
  }

  function renderResult(instance, responseData) {
    var message = responseData.message || "";

    var html = [
      '<div class="pv-widget__message">',
      escapeHtml(message),
      "</div>",
    ];

    if (responseData.valid) {
      var location = [
        responseData.city,
        responseData.state,
        responseData.country,
      ]
        .filter(Boolean)
        .join(", ");

      html.push(
        '<div class="pv-widget__details">',
      );

      if (
        responseData.estDeliveryDays !== null &&
        responseData.estDeliveryDays !== undefined
      ) {
        var deliveryDays = Number(
          responseData.estDeliveryDays,
        );

        html.push(
          '<div class="pv-widget__detail-row">',
          "<span>Estimated delivery</span>",
          "<strong>",
          escapeHtml(deliveryDays),
          deliveryDays === 1
            ? " day"
            : " days",
          "</strong>",
          "</div>",
        );
      }

      html.push(
        '<div class="pv-widget__detail-row">',
        "<span>Cash on delivery</span>",
        "<strong>",
        responseData.codAvailable
          ? "Available"
          : "Not available",
        "</strong>",
        "</div>",
      );

      html.push(
        '<div class="pv-widget__detail-row">',
        "<span>Prepaid delivery</span>",
        "<strong>",
        responseData.prepaidAvailable
          ? "Available"
          : "Not available",
        "</strong>",
        "</div>",
      );

      if (location) {
        html.push(
          '<div class="pv-widget__detail-row">',
          "<span>Location</span>",
          "<strong>",
          escapeHtml(location),
          "</strong>",
          "</div>",
        );
      }

      html.push("</div>");

      instance.result.className =
        "pv-widget__result pv-widget__result--success";
    } else {
      instance.result.className =
        "pv-widget__result pv-widget__result--error";
    }

    instance.result.innerHTML = html.join("");
  }

  function announceOnce(message) {
    if (!message || message === lastAnnouncement) {
      return;
    }

    lastAnnouncement = message;

    var primaryInstance = getPrimaryInstance();

    if (!primaryInstance) {
      return;
    }

    primaryInstance.result.setAttribute(
      "aria-live",
      "assertive",
    );

    window.setTimeout(function () {
      primaryInstance.result.setAttribute(
        "aria-live",
        "polite",
      );
    }, 1000);
  }

  function focusPrimaryResult() {
    var primaryInstance = getPrimaryInstance();

    if (!primaryInstance) {
      return;
    }

    try {
      primaryInstance.result.focus({
        preventScroll: true,
      });
    } catch (error) {
      primaryInstance.result.focus();
    }
  }

  function focusPrimaryInput() {
    var primaryInstance = getPrimaryInstance();

    if (!primaryInstance) {
      return;
    }

    primaryInstance.input.focus();
  }

  function syncInputValues(pincode) {
    getActiveInstances().forEach(
      function (instance) {
        if (instance.input.value === pincode) {
          return;
        }

        instance.suppressInputEvent = true;
        instance.input.value = pincode;
        instance.suppressInputEvent = false;
      },
    );
  }

  function renderSharedState() {
    var activeInstances = getActiveInstances();

    activeInstances.forEach(function (instance) {
      setInstanceLoading(
        instance,
        sharedState.loading,
      );

      if (
        sharedState.pincode &&
        instance.input.value !==
          sharedState.pincode
      ) {
        instance.suppressInputEvent = true;
        instance.input.value =
          sharedState.pincode;
        instance.suppressInputEvent = false;
      }

      if (sharedState.responseData) {
        renderResult(
          instance,
          sharedState.responseData,
        );
      } else {
        renderEmpty(instance);
      }
    });

    applySharedPurchaseState();
  }

  function resetSharedValidation(options) {
    var config = options || {};

    sharedState.pincode = config.keepPincode
      ? sharedState.pincode
      : "";

    sharedState.valid = false;
    sharedState.responseData = null;
    sharedState.loading = false;
    lastAnnouncement = "";

    if (config.clearSavedPincode) {
      clearSavedPincode();
    }

    getActiveInstances().forEach(
      function (instance) {
        setInstanceLoading(instance, false);

        if (config.clearInputs === true) {
          instance.suppressInputEvent = true;
          instance.input.value = "";
          instance.suppressInputEvent = false;
        }

        if (config.clearResults !== false) {
          renderEmpty(instance);
        }
      },
    );

    applySharedPurchaseState();
  }

  function buildSettingsResponse(responseData) {
    if (
      responseData &&
      responseData.settings
    ) {
      mergeSharedSettings(
        responseData.settings,
      );
    }

    return responseData;
  }

  async function makeValidationRequest(pincode) {
    if (responseCache.has(pincode)) {
      return responseCache.get(pincode);
    }

    if (pendingRequests.has(pincode)) {
      return pendingRequests.get(pincode);
    }

    var endpoint = getPrimaryEndpoint();

    if (!endpoint) {
      throw new Error(
        "Validation endpoint is unavailable.",
      );
    }

    var requestPromise = fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "same-origin",
      body: JSON.stringify({
        pincode: pincode,
      }),
    })
      .then(function (response) {
        return response
          .text()
          .then(function (text) {
            var parsed = parseJsonSafely(text);

            if (!parsed) {
              throw new Error(
                "The server returned an invalid response.",
              );
            }

            buildSettingsResponse(parsed);

            if (!response.ok) {
              var requestError = new Error(
                parsed.message ||
                  "Validation failed.",
              );

              requestError.responseData = parsed;

              throw requestError;
            }

            responseCache.set(pincode, parsed);

            return parsed;
          });
      })
      .finally(function () {
        pendingRequests.delete(pincode);
      });

    pendingRequests.set(
      pincode,
      requestPromise,
    );

    return requestPromise;
  }

  async function loadSharedSettings() {
    var endpoint = getPrimaryEndpoint();

    if (!endpoint) {
      return;
    }

    try {
      var response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({
          pincode: "",
        }),
      });

      var text = await response.text();
      var parsed = parseJsonSafely(text);

      if (
        parsed &&
        parsed.settings
      ) {
        mergeSharedSettings(
          parsed.settings,
        );
      }
    } catch (error) {
      console.warn(
        "Pincode Validator: settings could not be loaded.",
        error,
      );
    } finally {
      applySharedPurchaseState();
    }
  }

  function showErrorOnAllWidgets(message) {
    getActiveInstances().forEach(
      function (instance) {
        renderError(instance, message);
      },
    );

    announceOnce(message);
  }

  async function validateSharedPincode(
    pincode,
    options,
  ) {
    var config = options || {};
    var silent = Boolean(config.silent);

    var normalizedPincode = String(
      pincode || "",
    )
      .replace(/\D/g, "")
      .slice(0, 6);

    syncInputValues(normalizedPincode);
    clearAllFieldErrors();

    if (!normalizedPincode) {
      resetSharedValidation({
        clearSavedPincode: true,
        clearInputs: false,
        clearResults: true,
      });

      if (!silent) {
        var requiredMessage =
          "Please enter a pincode.";

        setFieldErrorOnAll(requiredMessage);
        showErrorOnAllWidgets(requiredMessage);
        focusPrimaryInput();
      }

      return;
    }

    if (!isValidPincode(normalizedPincode)) {
      resetSharedValidation({
        clearSavedPincode: true,
        clearInputs: false,
        clearResults: true,
      });

      if (!silent) {
        var invalidMessage =
          "Enter a valid six-digit Indian pincode that does not start with zero.";

        setFieldErrorOnAll(invalidMessage);
        showErrorOnAllWidgets(invalidMessage);
        focusPrimaryInput();
      }

      return;
    }

    sharedState.pincode = normalizedPincode;
    sharedState.valid = false;
    sharedState.responseData = null;

    lastAnnouncement = "";

    setAllInstancesLoading(true);
    applySharedPurchaseState();

    announceOnce(
      "Checking delivery availability.",
    );

    try {
      var responseData =
        await makeValidationRequest(
          normalizedPincode,
        );

      if (
        sharedState.pincode !==
        normalizedPincode
      ) {
        return;
      }

      sharedState.valid = Boolean(
        responseData.valid,
      );

      sharedState.responseData =
        responseData;

      if (sharedState.valid) {
        savePincode(
          normalizedPincode,
          sharedState.settings
            .rememberPincodeDays,
        );
      } else {
        clearSavedPincode();
      }

      renderSharedState();

      announceOnce(
        responseData.message ||
          (sharedState.valid
            ? "Delivery is available."
            : "Delivery is not available."),
      );

      if (!silent) {
        focusPrimaryResult();
      }
    } catch (error) {
      if (
        sharedState.pincode !==
        normalizedPincode
      ) {
        return;
      }

      console.error(
        "Pincode Validator: validation request failed.",
        error,
      );

      let responseData =
        error && error.responseData
          ? error.responseData
          : null;

      sharedState.valid = false;

      if (responseData) {
        sharedState.responseData =
          responseData;

        renderSharedState();

        announceOnce(
          responseData.message ||
            "Delivery validation failed.",
        );
      } else {
        sharedState.responseData = null;

        if (!silent) {
          showErrorOnAllWidgets(
            "Could not validate the pincode. Please try again.",
          );

          focusPrimaryResult();
        }
      }

      clearSavedPincode();
      applySharedPurchaseState();
    } finally {
      if (
        sharedState.pincode ===
        normalizedPincode
      ) {
        setAllInstancesLoading(false);
      }
    }
  }

  function getCurrentVariantValue(instance) {
    var context = findClosestProductContext(
      instance.widget,
    );

    var variantFields = queryAll(
      VARIANT_SELECTORS,
      context,
    );

    var values = variantFields
      .map(function (field) {
        if (
          field.type === "radio" ||
          field.type === "checkbox"
        ) {
          return field.checked
            ? field.value
            : "";
        }

        return field.value || "";
      })
      .filter(Boolean);

    return values.join("|");
  }

  function handlePossibleVariantChange(
    instance,
  ) {
    var currentVariantValue =
      getCurrentVariantValue(instance);

    if (
      currentVariantValue ===
      instance.variantValue
    ) {
      return;
    }

    instance.variantValue =
      currentVariantValue;

    window.setTimeout(
      applySharedPurchaseState,
      0,
    );

    window.setTimeout(
      applySharedPurchaseState,
      250,
    );

    window.setTimeout(
      applySharedPurchaseState,
      750,
    );
  }

  function handleInstanceInput(instance) {
    if (instance.suppressInputEvent) {
      return;
    }

    var sanitizedValue =
      instance.input.value
        .replace(/\D/g, "")
        .slice(0, 6);

    if (
      instance.input.value !==
      sanitizedValue
    ) {
      instance.input.value =
        sanitizedValue;
    }

    clearAllFieldErrors();
    syncInputValues(sanitizedValue);

    if (
      sharedState.pincode &&
      sanitizedValue !==
        sharedState.pincode
    ) {
      sharedState.pincode =
        sanitizedValue;

      sharedState.valid = false;
      sharedState.responseData = null;
      lastAnnouncement = "";

      clearSavedPincode();

      getActiveInstances().forEach(
        function (activeInstance) {
          renderEmpty(activeInstance);
        },
      );

      applySharedPurchaseState();
    }
  }

  function attachInstanceEvents(instance) {
    if (instance.spinner) {
      instance.spinner.hidden = true;
    }

    instance.submitButton.addEventListener(
      "click",
      function () {
        validateSharedPincode(
          instance.input.value,
        );
      },
    );

    instance.input.addEventListener(
      "keydown",
      function (event) {
        if (event.key === "Enter") {
          event.preventDefault();

          validateSharedPincode(
            instance.input.value,
          );
        }
      },
    );

    instance.input.addEventListener(
      "input",
      function () {
        handleInstanceInput(instance);
      },
    );

    instance.input.addEventListener(
      "blur",
      function () {
        var value =
          instance.input.value.trim();

        if (
          value &&
          !isValidPincode(value)
        ) {
          setFieldError(
            instance,
            "Enter a valid six-digit Indian pincode.",
          );
        }
      },
    );

    var context = findClosestProductContext(
      instance.widget,
    );

    context.addEventListener(
      "change",
      function (event) {
        var target = event.target;

        if (
          !(target instanceof Element)
        ) {
          return;
        }

        var isVariantControl =
          VARIANT_SELECTORS.some(
            function (selector) {
              try {
                return target.matches(
                  selector,
                );
              } catch (error) {
                return false;
              }
            },
          );

        if (isVariantControl) {
          handlePossibleVariantChange(
            instance,
          );
        }
      },
    );

    instance.variantValue =
      getCurrentVariantValue(instance);
  }

  function applySharedStateToNewInstance(
    instance,
  ) {
    if (sharedState.pincode) {
      instance.suppressInputEvent = true;
      instance.input.value =
        sharedState.pincode;
      instance.suppressInputEvent = false;
    }

    setInstanceLoading(
      instance,
      sharedState.loading,
    );

    clearFieldError(instance);

    if (sharedState.responseData) {
      renderResult(
        instance,
        sharedState.responseData,
      );
    } else {
      renderEmpty(instance);
    }

    applySharedPurchaseState();
  }

  function initializeWidget(widget) {
    if (
      !widget ||
      widget.getAttribute(
        INITIALIZED_ATTRIBUTE,
      ) === "true"
    ) {
      return;
    }

    var instance = createInstance(widget);

    if (!instance) {
      return;
    }

    widget.setAttribute(
      INITIALIZED_ATTRIBUTE,
      "true",
    );

    attachInstanceEvents(instance);
    instances.push(instance);

    applySharedStateToNewInstance(instance);
  }

  function initializeWidgets(root) {
    var searchRoot = root || document;

    if (
      searchRoot instanceof Element &&
      searchRoot.matches(WIDGET_SELECTOR)
    ) {
      initializeWidget(searchRoot);
    }

    var widgets =
      searchRoot.querySelectorAll
        ? searchRoot.querySelectorAll(
            WIDGET_SELECTOR,
          )
        : [];

    Array.prototype.forEach.call(
      widgets,
      initializeWidget,
    );

    cleanupDisconnectedInstances();
  }

  function cleanupDisconnectedInstances() {
    instances = instances.filter(
      function (instance) {
        var connected =
          document.documentElement.contains(
            instance.widget,
          );

        if (!connected) {
          instance.destroyed = true;
        }

        return connected;
      },
    );
  }

  function refreshAllInstances() {
    cleanupDisconnectedInstances();
    initializeWidgets(document);

    getActiveInstances().forEach(
      function (instance) {
        applySharedStateToNewInstance(
          instance,
        );

        handlePossibleVariantChange(
          instance,
        );
      },
    );

    applySharedPurchaseState();
  }

  function scheduleRefresh(delay) {
    window.clearTimeout(refreshTimer);

    refreshTimer = window.setTimeout(
      refreshAllInstances,
      typeof delay === "number"
        ? delay
        : 100,
    );
  }

  function attachGlobalEvents() {
    if (globalEventsAttached) {
      return;
    }

    globalEventsAttached = true;

    document.addEventListener(
      "shopify:section:load",
      function (event) {
        initializeWidgets(event.target);
        scheduleRefresh(50);
      },
    );

    document.addEventListener(
      "shopify:section:unload",
      function () {
        scheduleRefresh(50);
      },
    );

    document.addEventListener(
      "shopify:section:reorder",
      function () {
        scheduleRefresh(50);
      },
    );

    document.addEventListener(
      "shopify:block:select",
      function (event) {
        initializeWidgets(event.target);
        scheduleRefresh(50);
      },
    );

    document.addEventListener(
      "shopify:block:deselect",
      function () {
        scheduleRefresh(50);
      },
    );

    [
      "variant:change",
      "variant:changed",
      "product:variant-change",
      "product:variant:change",
    ].forEach(function (eventName) {
      document.addEventListener(
        eventName,
        function () {
          scheduleRefresh(50);
        },
      );
    });

    [
      "quickview:open",
      "quick-view:open",
      "quick-add:open",
    ].forEach(function (eventName) {
      document.addEventListener(
        eventName,
        function () {
          scheduleRefresh(100);
        },
      );
    });

    window.addEventListener(
      "pageshow",
      function () {
        scheduleRefresh(50);
      },
    );

    window.addEventListener(
      "popstate",
      function () {
        scheduleRefresh(50);
      },
    );

    window.addEventListener(
      "storage",
      function (event) {
        if (event.key !== STORAGE_KEY) {
          return;
        }

        var savedRecord =
          getSavedPincodeRecord();

        if (
          savedRecord &&
          savedRecord.pincode
        ) {
          validateSharedPincode(
            savedRecord.pincode,
            {
              silent: true,
            },
          );
        } else {
          resetSharedValidation({
            clearSavedPincode: false,
            clearInputs: true,
            clearResults: true,
          });
        }
      },
    );
  }

  function startMutationObserver() {
    if (
      globalObserver ||
      !document.body ||
      typeof MutationObserver ===
        "undefined"
    ) {
      return;
    }

    var relevantSelector = [
      WIDGET_SELECTOR,
      PRODUCT_FORM_SELECTORS.join(","),
      ADD_TO_CART_SELECTORS.join(","),
      BUY_NOW_CONTAINER_SELECTORS.join(","),
    ].join(",");

    globalObserver = new MutationObserver(
      function (mutations) {
        var shouldRefresh = mutations.some(
          function (mutation) {
            if (
              mutation.type !== "childList" ||
              mutation.addedNodes.length === 0
            ) {
              return false;
            }

            return Array.prototype.some.call(
              mutation.addedNodes,
              function (node) {
                if (
                  !(node instanceof Element)
                ) {
                  return false;
                }

                if (
                  node.matches(
                    WIDGET_SELECTOR,
                  ) ||
                  node.querySelector(
                    WIDGET_SELECTOR,
                  )
                ) {
                  initializeWidgets(node);
                }

                try {
                  return (
                    node.matches(
                      relevantSelector,
                    ) ||
                    Boolean(
                      node.querySelector(
                        relevantSelector,
                      ),
                    )
                  );
                } catch (error) {
                  return false;
                }
              },
            );
          },
        );

        if (shouldRefresh) {
          scheduleRefresh(80);
        }
      },
    );

    globalObserver.observe(
      document.body,
      {
        childList: true,
        subtree: true,
      },
    );
  }

  async function restoreRememberedPincode() {
    if (restoreStarted) {
      return;
    }

    restoreStarted = true;

    await loadSharedSettings();

    var savedRecord =
      getSavedPincodeRecord();

    if (
      savedRecord &&
      savedRecord.pincode
    ) {
      await validateSharedPincode(
        savedRecord.pincode,
        {
          silent: true,
        },
      );
    } else {
      applySharedPurchaseState();
    }
  }

  function start() {
    ensureRestrictionDescription();
    initializeWidgets(document);
    attachGlobalEvents();
    startMutationObserver();
    restoreRememberedPincode();
    scheduleRefresh(100);
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      start,
      {
        once: true,
      },
    );
  } else {
    start();
  }
})();