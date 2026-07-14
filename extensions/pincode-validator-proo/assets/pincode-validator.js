(function () {
  "use strict";

  var WIDGET_SELECTOR = "[data-pincode-validator]";
  var INITIALIZED_ATTRIBUTE = "data-pincode-initialized";
  var STORAGE_KEY = "pv_last_pincode";
  var BUTTON_DISABLED_CLASS = "pv-purchase-restricted";

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
    '[data-add-to-cart]',
    '[data-product-atc]',
    '[data-product-add-to-cart]',
    '[data-add-to-cart-button]',
    '.product-form__submit',
    '.product-form__cart-submit',
    '.product-form__add-button',
    '.add-to-cart',
    '.addtocart',
    '.btn--add-to-cart',
    '.product__add-to-cart',
    '.product-add-to-cart',
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
    '[data-option-selector] input',
    '[data-option-selector] select',
    "variant-selects select",
    "variant-radios input",
  ];

  var instances = [];
  var globalObserver = null;
  var refreshTimer = null;
  var globalEventsAttached = false;

  function queryAll(selectors, root) {
    var searchRoot = root || document;
    var nodes = [];

    selectors.forEach(function (selector) {
      try {
        var matches = searchRoot.querySelectorAll(selector);

        Array.prototype.forEach.call(matches, function (node) {
          if (nodes.indexOf(node) === -1) {
            nodes.push(node);
          }
        });
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
        Number.isFinite(parsedDays) && parsedDays > 0
          ? parsedDays
          : 7;

      var expiresAt =
        Date.now() + days * 24 * 60 * 60 * 1000;

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

    for (var index = 0; index < contextSelectors.length; index += 1) {
      var closestContext = widget.closest(
        contextSelectors[index],
      );

      if (closestContext) {
        return closestContext;
      }
    }

    var section = widget.closest(
      ".shopify-section, [id^='shopify-section-']",
    );

    return section || document;
  }

  function findPurchaseControls(widget) {
    var context = findClosestProductContext(widget);

    var addToCartButtons = queryAll(
      ADD_TO_CART_SELECTORS,
      context,
    );

    var buyNowButtons = queryAll(
      BUY_NOW_BUTTON_SELECTORS,
      context,
    );

    var buyNowContainers = queryAll(
      BUY_NOW_CONTAINER_SELECTORS,
      context,
    );

    if (
      addToCartButtons.length === 0 &&
      context !== document
    ) {
      addToCartButtons = queryAll(
        ADD_TO_CART_SELECTORS,
        document,
      );
    }

    if (
      buyNowButtons.length === 0 &&
      context !== document
    ) {
      buyNowButtons = queryAll(
        BUY_NOW_BUTTON_SELECTORS,
        document,
      );
    }

    if (
      buyNowContainers.length === 0 &&
      context !== document
    ) {
      buyNowContainers = queryAll(
        BUY_NOW_CONTAINER_SELECTORS,
        document,
      );
    }

    return {
      addToCartButtons: addToCartButtons,
      buyNowButtons: buyNowButtons,
      buyNowContainers: buyNowContainers,
    };
  }

  function rememberOriginalButtonState(button) {
    if (
      button.getAttribute("data-pv-original-disabled") ===
      null
    ) {
      button.setAttribute(
        "data-pv-original-disabled",
        button.disabled ? "true" : "false",
      );
    }

    if (
      button.getAttribute("data-pv-original-aria-disabled") ===
      null
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

    rememberOriginalButtonState(button);

    button.disabled = true;
    button.setAttribute("aria-disabled", "true");
    button.classList.add(BUTTON_DISABLED_CLASS);
    button.setAttribute(
      "data-pv-restricted",
      "true",
    );
  }

  function restoreButton(button) {
    if (!button) {
      return;
    }

    var originalDisabled =
      button.getAttribute(
        "data-pv-original-disabled",
      );

    var originalAriaDisabled =
      button.getAttribute(
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

    button.classList.remove(
      BUTTON_DISABLED_CLASS,
    );

    button.removeAttribute(
      "data-pv-restricted",
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
    container.setAttribute(
      "aria-disabled",
      "true",
    );
    container.classList.add(
      BUTTON_DISABLED_CLASS,
    );
  }

  function restoreBuyNowContainer(container) {
    if (!container) {
      return;
    }

    var pointerEvents =
      container.getAttribute(
        "data-pv-original-pointer-events",
      );

    var opacity =
      container.getAttribute(
        "data-pv-original-opacity",
      );

    container.style.pointerEvents =
      pointerEvents || "";

    container.style.opacity =
      opacity || "";

    container.removeAttribute("aria-disabled");

    container.classList.remove(
      BUTTON_DISABLED_CLASS,
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

    var endpoint =
      widget.getAttribute("data-endpoint");

    if (
      !input ||
      !submitButton ||
      !result ||
      !endpoint
    ) {
      console.warn(
        "Pincode Validator: required widget elements are missing.",
      );

      return null;
    }

    var instance = {
      widget: widget,
      input: input,
      submitButton: submitButton,
      buttonText: buttonText,
      spinner: spinner,
      result: result,
      endpoint: endpoint,
      settings: Object.assign(
        {},
        defaultSettings,
      ),
      validated: false,
      validatedPincode: "",
      requestController: null,
      variantValue: "",
      destroyed: false,
    };

    return instance;
  }

  function setLoading(instance, loading) {
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
        ? "Checking..."
        : instance.submitButton.getAttribute(
            "data-original-label",
          ) || "Check";
    }
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
    var message =
      responseData.message || "";

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

  function mergeSettings(instance, settings) {
    if (!settings || typeof settings !== "object") {
      return;
    }

    instance.settings = Object.assign(
      {},
      defaultSettings,
      settings,
    );
  }

  function applyPurchaseState(instance) {
    if (
      instance.destroyed ||
      !document.documentElement.contains(
        instance.widget,
      )
    ) {
      return;
    }

    var controls = findPurchaseControls(
      instance.widget,
    );

    var shouldAllowPurchase =
      !instance.settings.requireValidation ||
      instance.validated;

    controls.addToCartButtons.forEach(
      function (button) {
        if (
          shouldAllowPurchase ||
          !instance.settings.restrictAddToCart
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
          !instance.settings.restrictBuyNow
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
          !instance.settings.restrictBuyNow
        ) {
          restoreBuyNowContainer(container);
        } else {
          restrictBuyNowContainer(container);
        }
      },
    );
  }

  function invalidateInstance(
    instance,
    options,
  ) {
    var config = options || {};

    instance.validated = false;
    instance.validatedPincode = "";

    if (config.clearSavedPincode) {
      clearSavedPincode();
    }

    if (config.clearResult !== false) {
      renderEmpty(instance);
    }

    applyPurchaseState(instance);
  }

  async function requestValidation(
    instance,
    pincode,
  ) {
    if (instance.requestController) {
      instance.requestController.abort();
    }

    instance.requestController =
      typeof AbortController !== "undefined"
        ? new AbortController()
        : null;

    var fetchOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "same-origin",
      body: JSON.stringify({
        pincode: pincode,
      }),
    };

    if (instance.requestController) {
      fetchOptions.signal =
        instance.requestController.signal;
    }

    var response = await fetch(
      instance.endpoint,
      fetchOptions,
    );

    var text = await response.text();
    var parsed = parseJsonSafely(text);

    if (!parsed) {
      throw new Error(
        "The server returned an invalid response.",
      );
    }

    return {
      response: response,
      data: parsed,
    };
  }

  async function validatePincode(
    instance,
    options,
  ) {
    var config = options || {};
    var silent = Boolean(config.silent);
    var pincode = instance.input.value.trim();

    instance.input.value = pincode;

    if (!pincode) {
      invalidateInstance(instance, {
        clearSavedPincode: true,
        clearResult: silent,
      });

      if (!silent) {
        renderError(
          instance,
          "Please enter a pincode.",
        );

        instance.input.focus();
      }

      return;
    }

    if (!isValidPincode(pincode)) {
      invalidateInstance(instance, {
        clearSavedPincode: true,
        clearResult: false,
      });

      if (!silent) {
        renderError(
          instance,
          "Please enter a valid 6-digit Indian pincode.",
        );

        instance.input.focus();
      }

      return;
    }

    if (!silent) {
      renderEmpty(instance);
      setLoading(instance, true);
    }

    try {
      var validationResponse =
        await requestValidation(
          instance,
          pincode,
        );

      var response =
        validationResponse.response;

      var responseData =
        validationResponse.data;

      mergeSettings(
        instance,
        responseData.settings,
      );

      if (!response.ok) {
        instance.validated = false;
        instance.validatedPincode = "";

        if (!silent) {
          renderError(
            instance,
            responseData.message ||
              "Validation failed. Please try again.",
          );
        }

        applyPurchaseState(instance);
        return;
      }

      instance.validated =
        Boolean(responseData.valid);

      instance.validatedPincode =
        instance.validated
          ? pincode
          : "";

      renderResult(
        instance,
        responseData,
      );

      if (instance.validated) {
        savePincode(
          pincode,
          instance.settings.rememberPincodeDays,
        );
      } else {
        clearSavedPincode();
      }

      applyPurchaseState(instance);
    } catch (error) {
      if (
        error &&
        error.name === "AbortError"
      ) {
        return;
      }

      console.error(
        "Pincode Validator: validation request failed.",
        error,
      );

      instance.validated = false;
      instance.validatedPincode = "";

      if (!silent) {
        renderError(
          instance,
          "Could not validate the pincode. Please try again.",
        );
      }

      applyPurchaseState(instance);
    } finally {
      if (!silent) {
        setLoading(instance, false);
      }
    }
  }

  async function loadSettings(instance) {
    try {
      var settingsResponse =
        await requestValidation(
          instance,
          "",
        );

      mergeSettings(
        instance,
        settingsResponse.data.settings,
      );
    } catch (error) {
      if (
        !error ||
        error.name !== "AbortError"
      ) {
        console.warn(
          "Pincode Validator: settings could not be loaded.",
          error,
        );
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

    /*
     * Delivery availability currently depends on the
     * pincode rather than the variant, so a previously
     * validated pincode remains valid. We only reapply
     * restrictions because many themes replace their
     * product buttons after variant changes.
     */
    window.setTimeout(function () {
      applyPurchaseState(instance);
    }, 0);

    window.setTimeout(function () {
      applyPurchaseState(instance);
    }, 250);

    window.setTimeout(function () {
      applyPurchaseState(instance);
    }, 750);
  }

  function attachInstanceEvents(instance) {
    instance.submitButton.setAttribute(
      "data-original-label",
      instance.buttonText
        ? instance.buttonText.textContent.trim()
        : "Check",
    );

    if (instance.spinner) {
      instance.spinner.hidden = true;
    }

    instance.submitButton.addEventListener(
      "click",
      function () {
        validatePincode(instance);
      },
    );

    instance.input.addEventListener(
      "keydown",
      function (event) {
        if (event.key === "Enter") {
          event.preventDefault();
          validatePincode(instance);
        }
      },
    );

    instance.input.addEventListener(
      "input",
      function () {
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

        if (
          instance.validatedPincode &&
          sanitizedValue !==
            instance.validatedPincode
        ) {
          invalidateInstance(instance, {
            clearSavedPincode: true,
            clearResult: true,
          });
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

  async function bootInstance(instance) {
    await loadSettings(instance);

    applyPurchaseState(instance);

    var savedRecord =
      getSavedPincodeRecord();

    if (
      savedRecord &&
      savedRecord.pincode
    ) {
      instance.input.value =
        savedRecord.pincode;

      await validatePincode(instance, {
        silent: true,
      });
    }
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

    var instance =
      createInstance(widget);

    if (!instance) {
      return;
    }

    widget.setAttribute(
      INITIALIZED_ATTRIBUTE,
      "true",
    );

    attachInstanceEvents(instance);
    instances.push(instance);
    bootInstance(instance);
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

          if (
            instance.requestController
          ) {
            instance.requestController.abort();
          }
        }

        return connected;
      },
    );
  }

  function refreshAllInstances() {
    cleanupDisconnectedInstances();
    initializeWidgets(document);

    instances.forEach(function (instance) {
      applyPurchaseState(instance);
      handlePossibleVariantChange(instance);
    });
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

    document.addEventListener(
      "variant:change",
      function () {
        scheduleRefresh(50);
      },
    );

    document.addEventListener(
      "variant:changed",
      function () {
        scheduleRefresh(50);
      },
    );

    document.addEventListener(
      "product:variant-change",
      function () {
        scheduleRefresh(50);
      },
    );

    document.addEventListener(
      "product:variant:change",
      function () {
        scheduleRefresh(50);
      },
    );

    document.addEventListener(
      "quickview:open",
      function () {
        scheduleRefresh(100);
      },
    );

    document.addEventListener(
      "quick-view:open",
      function () {
        scheduleRefresh(100);
      },
    );

    document.addEventListener(
      "quick-add:open",
      function () {
        scheduleRefresh(100);
      },
    );

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
                  node.matches(WIDGET_SELECTOR) ||
                  node.querySelector(
                    WIDGET_SELECTOR,
                  )
                ) {
                  initializeWidgets(node);
                }

                return (
                  node.matches(
                    PRODUCT_FORM_SELECTORS.join(
                      ",",
                    ),
                  ) ||
                  node.querySelector(
                    PRODUCT_FORM_SELECTORS.join(
                      ",",
                    ),
                  ) ||
                  node.matches(
                    ADD_TO_CART_SELECTORS.join(
                      ",",
                    ),
                  ) ||
                  node.querySelector(
                    ADD_TO_CART_SELECTORS.join(
                      ",",
                    ),
                  ) ||
                  node.matches(
                    BUY_NOW_CONTAINER_SELECTORS.join(
                      ",",
                    ),
                  ) ||
                  node.querySelector(
                    BUY_NOW_CONTAINER_SELECTORS.join(
                      ",",
                    ),
                  )
                );
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

  function start() {
    initializeWidgets(document);
    attachGlobalEvents();
    startMutationObserver();
    scheduleRefresh(100);
  }

  if (
    document.readyState === "loading"
  ) {
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