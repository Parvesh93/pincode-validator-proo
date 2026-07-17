(() => {
  "use strict";

  const ROOT_SELECTOR = "[data-pincode-popup-root]";
  const INITIALIZED_ATTRIBUTE = "data-popup-initialized";

  const STORAGE_KEYS = {
    pincode: "pvp_validated_pincode",
    validation: "pvp_validation_result",
    popupDismissed: "pvp_popup_dismissed",
  };

  const DEFAULT_SETTINGS = {
    popupEnabled: false,
    popupTitle: "Check Delivery Availability",
    popupDescription:
      "Enter your pincode to check delivery availability.",
    popupButtonText: "Check Availability",
    popupLocationText: "Use my current location",
    popupTrigger: "delay",
    popupDelaySeconds: 3,
    popupRemember: true,
    popupRememberDays: 7,
    popupShowClose: true,
    popupCloseOnOverlay: true,
    popupTheme: "light",
    popupWidth: 420,
    popupShowHome: true,
    popupShowProduct: true,
    popupShowCollection: true,
    popupShowCart: false,
    popupShowPages: false,
    popupAutoClose: true,
    popupAutoCloseDelay: 1500,
    locationDetectionEnabled: false,
  };

  function safeJsonParse(value, fallback = null) {
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }

  function normalizeString(value, fallback = "") {
    if (typeof value !== "string") {
      return fallback;
    }

    const normalized = value.trim();
    return normalized || fallback;
  }

  function normalizeNumber(value, fallback, min, max) {
    const parsed = Number(value);

    if (!Number.isFinite(parsed)) {
      return fallback;
    }

    return Math.min(Math.max(parsed, min), max);
  }

  function normalizeBoolean(value, fallback = false) {
    return typeof value === "boolean" ? value : fallback;
  }

  function normalizePincode(value) {
    return String(value ?? "")
      .replace(/\D/g, "")
      .slice(0, 6);
  }

  function isValidPincode(value) {
    return /^[1-9][0-9]{5}$/.test(value);
  }

  function getTimestampAfterDays(days) {
    return Date.now() + days * 24 * 60 * 60 * 1000;
  }

  function getStorageItem(key) {
    try {
      const rawValue = window.localStorage.getItem(key);

      if (!rawValue) {
        return null;
      }

      const storedValue = safeJsonParse(rawValue);

      if (!storedValue || typeof storedValue !== "object") {
        window.localStorage.removeItem(key);
        return null;
      }

      if (
        storedValue.expiresAt &&
        Number(storedValue.expiresAt) < Date.now()
      ) {
        window.localStorage.removeItem(key);
        return null;
      }

      return storedValue.value ?? null;
    } catch {
      return null;
    }
  }

  function setStorageItem(key, value, days) {
    try {
      window.localStorage.setItem(
        key,
        JSON.stringify({
          value,
          expiresAt: getTimestampAfterDays(days),
        }),
      );
    } catch {
      // Validation must continue if localStorage is unavailable.
    }
  }

  function removeStorageItem(key) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Ignore storage errors.
    }
  }

  function dispatchStorefrontEvent(name, detail = {}) {
    document.dispatchEvent(
      new CustomEvent(name, {
        detail,
      }),
    );
  }

  function initializePopup(root) {
    if (
      !root ||
      root.getAttribute(INITIALIZED_ATTRIBUTE) === "true"
    ) {
      return;
    }

    root.setAttribute(INITIALIZED_ATTRIBUTE, "true");

    const endpoint =
      root.dataset.validationEndpoint ||
      "/apps/pincode-validator/validate";

    const pageType = normalizeString(
      root.dataset.pageType,
      "unknown",
    ).toLowerCase();

    const productContext = {
      productId: normalizeString(root.dataset.productId),
      productHandle: normalizeString(root.dataset.productHandle),
      productTitle: normalizeString(root.dataset.productTitle),
    };

    const elements = {
      overlay: root.querySelector("[data-pincode-popup-overlay]"),
      dialog: root.querySelector("[data-pincode-popup-dialog]"),
      close: root.querySelector("[data-pincode-popup-close]"),
      title: root.querySelector("[data-pincode-popup-title]"),
      description: root.querySelector(
        "[data-pincode-popup-description]",
      ),
      form: root.querySelector("[data-pincode-popup-form]"),
      input: root.querySelector("[data-pincode-popup-input]"),
      submit: root.querySelector("[data-pincode-popup-submit]"),
      submitText: root.querySelector(
        "[data-pincode-popup-submit-text]",
      ),
      spinner: root.querySelector("[data-pincode-popup-spinner]"),
      location: root.querySelector("[data-pincode-popup-location]"),
      locationText: root.querySelector(
        "[data-pincode-popup-location-text]",
      ),
      message: root.querySelector("[data-pincode-popup-message]"),
      result: root.querySelector("[data-pincode-popup-result]"),
      resultIcon: root.querySelector(
        "[data-pincode-popup-result-icon]",
      ),
      resultTitle: root.querySelector(
        "[data-pincode-popup-result-title]",
      ),
      resultDescription: root.querySelector(
        "[data-pincode-popup-result-description]",
      ),
    };

    if (
      !elements.overlay ||
      !elements.dialog ||
      !elements.form ||
      !elements.input ||
      !elements.submit
    ) {
      return;
    }

    let settings = { ...DEFAULT_SETTINGS };
    let isOpen = false;
    let isLoading = false;
    let openTimer = null;
    let autoCloseTimer = null;
    let previousFocusedElement = null;

    function getSettings(rawSettings) {
      const source =
        rawSettings && typeof rawSettings === "object"
          ? rawSettings
          : {};

      return {
        ...DEFAULT_SETTINGS,

        popupEnabled: normalizeBoolean(
          source.popupEnabled,
          DEFAULT_SETTINGS.popupEnabled,
        ),

        popupTitle: normalizeString(
          source.popupTitle,
          DEFAULT_SETTINGS.popupTitle,
        ),

        popupDescription: normalizeString(
          source.popupDescription,
          DEFAULT_SETTINGS.popupDescription,
        ),

        popupButtonText: normalizeString(
          source.popupButtonText,
          DEFAULT_SETTINGS.popupButtonText,
        ),

        popupLocationText: normalizeString(
          source.popupLocationText,
          DEFAULT_SETTINGS.popupLocationText,
        ),

        popupTrigger: normalizeString(
          source.popupTrigger,
          DEFAULT_SETTINGS.popupTrigger,
        ).toLowerCase(),

        popupDelaySeconds: normalizeNumber(
          source.popupDelaySeconds,
          DEFAULT_SETTINGS.popupDelaySeconds,
          0,
          60,
        ),

        popupRemember: normalizeBoolean(
          source.popupRemember,
          DEFAULT_SETTINGS.popupRemember,
        ),

        popupRememberDays: normalizeNumber(
          source.popupRememberDays,
          DEFAULT_SETTINGS.popupRememberDays,
          1,
          365,
        ),

        popupShowClose: normalizeBoolean(
          source.popupShowClose,
          DEFAULT_SETTINGS.popupShowClose,
        ),

        popupCloseOnOverlay: normalizeBoolean(
          source.popupCloseOnOverlay,
          DEFAULT_SETTINGS.popupCloseOnOverlay,
        ),

        popupTheme:
          source.popupTheme === "dark" ? "dark" : "light",

        popupWidth: normalizeNumber(
          source.popupWidth,
          DEFAULT_SETTINGS.popupWidth,
          320,
          800,
        ),

        popupShowHome: normalizeBoolean(
          source.popupShowHome,
          DEFAULT_SETTINGS.popupShowHome,
        ),

        popupShowProduct: normalizeBoolean(
          source.popupShowProduct,
          DEFAULT_SETTINGS.popupShowProduct,
        ),

        popupShowCollection: normalizeBoolean(
          source.popupShowCollection,
          DEFAULT_SETTINGS.popupShowCollection,
        ),

        popupShowCart: normalizeBoolean(
          source.popupShowCart,
          DEFAULT_SETTINGS.popupShowCart,
        ),

        popupShowPages: normalizeBoolean(
          source.popupShowPages,
          DEFAULT_SETTINGS.popupShowPages,
        ),

        popupAutoClose: normalizeBoolean(
          source.popupAutoClose,
          DEFAULT_SETTINGS.popupAutoClose,
        ),

        popupAutoCloseDelay: normalizeNumber(
          source.popupAutoCloseDelay,
          DEFAULT_SETTINGS.popupAutoCloseDelay,
          0,
          15000,
        ),

        locationDetectionEnabled: normalizeBoolean(
          source.locationDetectionEnabled,
          DEFAULT_SETTINGS.locationDetectionEnabled,
        ),
      };
    }

    function isAllowedOnCurrentPage() {
      switch (pageType) {
        case "index":
        case "home":
          return settings.popupShowHome;

        case "product":
          return settings.popupShowProduct;

        case "collection":
          return settings.popupShowCollection;

        case "cart":
          return settings.popupShowCart;

        case "page":
        case "article":
        case "blog":
        case "search":
          return settings.popupShowPages;

        default:
          return settings.popupShowPages;
      }
    }

    function getRememberedPincode() {
      if (!settings.popupRemember) {
        return null;
      }

      const storedPincode = getStorageItem(STORAGE_KEYS.pincode);
      const normalized = normalizePincode(storedPincode);

      return isValidPincode(normalized) ? normalized : null;
    }

    function hasRememberedPopupDismissal() {
      if (!settings.popupRemember) {
        return false;
      }

      return getStorageItem(STORAGE_KEYS.popupDismissed) === true;
    }

    function rememberPopupDismissal() {
      if (!settings.popupRemember) {
        return;
      }

      setStorageItem(
        STORAGE_KEYS.popupDismissed,
        true,
        settings.popupRememberDays,
      );
    }

    function rememberSuccessfulValidation(pincode, response) {
      if (!settings.popupRemember) {
        return;
      }

      setStorageItem(
        STORAGE_KEYS.pincode,
        pincode,
        settings.popupRememberDays,
      );

      setStorageItem(
        STORAGE_KEYS.validation,
        {
          pincode,
          available: Boolean(response.available),
          valid: Boolean(response.valid),
          message: normalizeString(response.message),
          city: response.city ?? null,
          state: response.state ?? null,
          country: response.country ?? null,
          codAvailable: Boolean(response.codAvailable),
          prepaidAvailable: Boolean(response.prepaidAvailable),
          estDeliveryDays: response.estDeliveryDays ?? null,
        },
        settings.popupRememberDays,
      );
    }

    function applySettings() {
      root.dataset.theme = settings.popupTheme;

      root.style.setProperty(
        "--pvp-popup-width",
        `${settings.popupWidth}px`,
      );

      if (elements.title) {
        elements.title.textContent = settings.popupTitle;
      }

      if (elements.description) {
        elements.description.textContent =
          settings.popupDescription;
      }

      if (elements.submitText) {
        elements.submitText.textContent =
          settings.popupButtonText;
      }

      if (elements.locationText) {
        elements.locationText.textContent =
          settings.popupLocationText;
      }

      if (elements.close) {
        elements.close.hidden = !settings.popupShowClose;
      }

      if (elements.location) {
        elements.location.hidden =
          !settings.locationDetectionEnabled ||
          !("geolocation" in navigator);
      }
    }

    function clearOpenTimer() {
      if (openTimer !== null) {
        window.clearTimeout(openTimer);
        openTimer = null;
      }
    }

    function clearAutoCloseTimer() {
      if (autoCloseTimer !== null) {
        window.clearTimeout(autoCloseTimer);
        autoCloseTimer = null;
      }
    }

    function setMessage(message = "", type = "") {
      if (!elements.message) {
        return;
      }

      elements.message.textContent = message;
      elements.message.classList.remove(
        "is-error",
        "is-success",
        "is-info",
      );

      if (type) {
        elements.message.classList.add(`is-${type}`);
      }
    }

    function hideResult() {
      if (!elements.result) {
        return;
      }

      elements.result.hidden = true;
      elements.result.classList.remove(
        "is-success",
        "is-error",
        "is-info",
      );

      if (elements.resultIcon) {
        elements.resultIcon.textContent = "";
      }

      if (elements.resultTitle) {
        elements.resultTitle.textContent = "";
      }

      if (elements.resultDescription) {
        elements.resultDescription.textContent = "";
      }
    }

    function showResult({
      type,
      icon,
      title,
      description,
    }) {
      if (!elements.result) {
        return;
      }

      elements.result.hidden = false;
      elements.result.classList.remove(
        "is-success",
        "is-error",
        "is-info",
      );
      elements.result.classList.add(`is-${type}`);

      if (elements.resultIcon) {
        elements.resultIcon.textContent = icon;
      }

      if (elements.resultTitle) {
        elements.resultTitle.textContent = title;
      }

      if (elements.resultDescription) {
        elements.resultDescription.textContent =
          description || "";
      }
    }

    function getFocusableElements() {
      return Array.from(
        elements.dialog.querySelectorAll(
          [
            "button:not([disabled]):not([hidden])",
            "input:not([disabled])",
            "select:not([disabled])",
            "textarea:not([disabled])",
            "a[href]",
            '[tabindex]:not([tabindex="-1"])',
          ].join(","),
        ),
      ).filter(
        (element) =>
          element instanceof HTMLElement &&
          element.offsetParent !== null,
      );
    }

    function handleFocusTrap(event) {
      if (!isOpen || event.key !== "Tab") {
        return;
      }

      const focusableElements = getFocusableElements();

      if (focusableElements.length === 0) {
        event.preventDefault();
        elements.dialog.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement =
        focusableElements[focusableElements.length - 1];

      if (
        event.shiftKey &&
        document.activeElement === firstElement
      ) {
        event.preventDefault();
        lastElement.focus();
      } else if (
        !event.shiftKey &&
        document.activeElement === lastElement
      ) {
        event.preventDefault();
        firstElement.focus();
      }
    }

    function openPopup({ force = false } = {}) {
      if (isOpen || isLoading) {
        return;
      }

      if (!force) {
        if (!settings.popupEnabled || !isAllowedOnCurrentPage()) {
          return;
        }

        if (hasRememberedPopupDismissal()) {
          return;
        }

        if (getRememberedPincode()) {
          return;
        }
      }

      clearOpenTimer();
      clearAutoCloseTimer();

      previousFocusedElement =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;

      root.hidden = false;
      isOpen = true;

      document.documentElement.classList.add(
        "pincode-popup-open",
      );
      document.body.classList.add("pincode-popup-open");

      window.requestAnimationFrame(() => {
        elements.overlay.setAttribute("aria-hidden", "false");

        window.setTimeout(() => {
          elements.input.focus();
        }, 80);
      });

      dispatchStorefrontEvent("pincode-validator:popup-opened", {
        pageType,
      });
    }

    function closePopup({
      remember = false,
      restoreFocus = true,
    } = {}) {
      if (!isOpen) {
        return;
      }

      clearAutoCloseTimer();

      isOpen = false;
      elements.overlay.setAttribute("aria-hidden", "true");

      document.documentElement.classList.remove(
        "pincode-popup-open",
      );
      document.body.classList.remove("pincode-popup-open");

      if (remember) {
        rememberPopupDismissal();
      }

      window.setTimeout(() => {
        if (!isOpen) {
          root.hidden = true;
        }
      }, 250);

      if (restoreFocus && previousFocusedElement) {
        previousFocusedElement.focus({
          preventScroll: true,
        });
      }

      dispatchStorefrontEvent("pincode-validator:popup-closed", {
        pageType,
      });
    }

    function setLoading(loading) {
      isLoading = loading;
      root.dataset.loading = String(loading);

      elements.input.disabled = loading;
      elements.submit.disabled = loading;

      if (elements.location) {
        elements.location.disabled = loading;
      }

      if (elements.spinner) {
        elements.spinner.hidden = !loading;
      }

      elements.submit.setAttribute(
        "aria-busy",
        String(loading),
      );
    }

    function buildDeliveryDescription(response) {
      const details = [];

      if (response.city) {
        details.push(response.city);
      }

      if (
        response.state &&
        response.state !== response.city
      ) {
        details.push(response.state);
      }

      if (
        Number.isFinite(Number(response.estDeliveryDays)) &&
        Number(response.estDeliveryDays) > 0
      ) {
        const days = Number(response.estDeliveryDays);

        details.push(
          `Estimated delivery in ${days} ${
            days === 1 ? "day" : "days"
          }`,
        );
      }

      if (response.codAvailable) {
        details.push("Cash on delivery available");
      }

      return details.join(" · ");
    }

    function handleValidationResponse(response, pincode) {
      const available =
        response.valid === true &&
        response.available === true;

      if (available) {
        elements.input.setAttribute("aria-invalid", "false");

        setMessage("", "");

        showResult({
          type: "success",
          icon: "✓",
          title:
            normalizeString(response.message) ||
            "Delivery is available.",
          description: buildDeliveryDescription(response),
        });

        rememberSuccessfulValidation(pincode, response);

        dispatchStorefrontEvent(
          "pincode-validator:validated",
          {
            ...response,
            pincode,
          },
        );

        if (settings.popupAutoClose) {
          clearAutoCloseTimer();

          autoCloseTimer = window.setTimeout(() => {
            closePopup({
              remember: false,
            });
          }, settings.popupAutoCloseDelay);
        }

        return;
      }

      elements.input.setAttribute("aria-invalid", "true");

      showResult({
        type: "error",
        icon: "!",
        title:
          normalizeString(response.message) ||
          "Delivery is not available.",
        description:
          response.city || response.state
            ? [response.city, response.state]
                .filter(Boolean)
                .join(", ")
            : `We currently cannot deliver to ${pincode}.`,
      });

      dispatchStorefrontEvent(
        "pincode-validator:validation-failed",
        {
          ...response,
          pincode,
        },
      );
    }

    async function validatePincode(pincode) {
      setLoading(true);
      setMessage("Checking delivery availability…", "info");
      hideResult();

      try {
        const response = await fetch(endpoint, {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },

          credentials: "same-origin",

          body: JSON.stringify({
            pincode,
            productId: productContext.productId || undefined,
            productHandle:
              productContext.productHandle || undefined,
            productTitle:
              productContext.productTitle || undefined,
            source: "popup",
          }),
        });

        const body = await response.json().catch(() => null);

        if (!body || typeof body !== "object") {
          throw new Error("Invalid validation response");
        }

        if (
          response.status >= 500 ||
          body.settings === null
        ) {
          throw new Error(
            normalizeString(body.message) ||
              "Validation request failed",
          );
        }

        setMessage("", "");
        handleValidationResponse(body, pincode);
      } catch (error) {
        elements.input.setAttribute("aria-invalid", "true");

        setMessage(
          "We could not check this pincode. Please try again.",
          "error",
        );

        showResult({
          type: "error",
          icon: "!",
          title: "Unable to check delivery",
          description:
            "Please check your internet connection and try again.",
        });

        console.error(
          "[Pincode Validator] Validation failed:",
          error,
        );
      } finally {
        setLoading(false);
      }
    }

    async function loadSettings() {
      try {
        const response = await fetch(endpoint, {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },

          credentials: "same-origin",

          body: JSON.stringify({
            pincode: "",
            source: "popup-settings-load",
          }),
        });

        const body = await response.json().catch(() => null);

        if (!body || typeof body !== "object") {
          return false;
        }

        settings = getSettings(body.settings);
        applySettings();

        return true;
      } catch (error) {
        console.error(
          "[Pincode Validator] Settings could not be loaded:",
          error,
        );

        return false;
      }
    }

    function schedulePopup() {
      if (
        !settings.popupEnabled ||
        !isAllowedOnCurrentPage() ||
        hasRememberedPopupDismissal() ||
        getRememberedPincode()
      ) {
        return;
      }

      clearOpenTimer();

      const trigger = settings.popupTrigger;

      if (
        trigger === "immediate" ||
        trigger === "page-load" ||
        trigger === "load"
      ) {
        openPopup();
        return;
      }

      if (trigger === "manual") {
        return;
      }

      openTimer = window.setTimeout(() => {
        openPopup();
      }, settings.popupDelaySeconds * 1000);
    }

    function handleFormSubmit(event) {
      event.preventDefault();

      if (isLoading) {
        return;
      }

      const pincode = normalizePincode(elements.input.value);
      elements.input.value = pincode;

      clearAutoCloseTimer();
      hideResult();

      if (!isValidPincode(pincode)) {
        elements.input.setAttribute("aria-invalid", "true");

        setMessage(
          "Please enter a valid 6-digit Indian pincode.",
          "error",
        );

        elements.input.focus();
        return;
      }

      elements.input.setAttribute("aria-invalid", "false");
      setMessage("", "");

      validatePincode(pincode);
    }

    function handleInput(event) {
      const normalized = normalizePincode(event.target.value);

      if (event.target.value !== normalized) {
        event.target.value = normalized;
      }

      elements.input.setAttribute("aria-invalid", "false");
      setMessage("", "");

      if (!isLoading) {
        hideResult();
      }
    }

    function handleOverlayClick(event) {
      if (
        event.target === elements.overlay &&
        settings.popupCloseOnOverlay
      ) {
        closePopup({
          remember: true,
        });
      }
    }

    function handleDocumentKeydown(event) {
      if (!isOpen) {
        return;
      }

      if (event.key === "Escape" && settings.popupShowClose) {
        event.preventDefault();

        closePopup({
          remember: true,
        });

        return;
      }

      handleFocusTrap(event);
    }

    function handleLocationClick() {
  if (
    isLoading ||
    !settings.locationDetectionEnabled
  ) {
    return;
  }

  if (!("geolocation" in navigator)) {
    setMessage(
      "Location detection is not supported by this browser.",
      "error",
    );
    return;
  }

  setMessage(
    "Detecting your current location…",
    "info",
  );

  hideResult();
  elements.location.disabled = true;

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      setMessage(
        "Location detected. Finding your pincode…",
        "info",
      );

      try {
        const locationEndpoint = endpoint.replace(
          /\/validate\/?$/,
          "/location",
        );

        const response = await fetch(locationEndpoint, {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },

          credentials: "same-origin",

          body: JSON.stringify({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }),
        });

        const body = await response
          .json()
          .catch(() => null);

        if (
          !body ||
          typeof body !== "object"
        ) {
          throw new Error(
            "Invalid location response",
          );
        }

        if (
          !response.ok ||
          body.success !== true
        ) {
          throw new Error(
            normalizeString(
              body.message,
              "Unable to detect your pincode.",
            ),
          );
        }

        const pincode = normalizePincode(
          body.pincode,
        );

        if (!isValidPincode(pincode)) {
          throw new Error(
            "A valid pincode could not be found for your location.",
          );
        }

        elements.input.value = pincode;

        elements.input.setAttribute(
          "aria-invalid",
          "false",
        );

        setMessage("", "");

        dispatchStorefrontEvent(
          "pincode-validator:location-detected",
          {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            pincode,
            city: body.city ?? null,
            state: body.state ?? null,
            country: body.country ?? null,
          },
        );

        await validatePincode(pincode);
      } catch (error) {
        console.error(
          "[Pincode Validator] Reverse geocoding failed:",
          error,
        );

        setMessage(
          error instanceof Error
            ? error.message
            : "Unable to detect your pincode.",
          "error",
        );
      } finally {
        elements.location.disabled = false;
      }
    },

    (error) => {
      let message =
        "We could not access your current location.";

      if (error.code === error.PERMISSION_DENIED) {
        message =
          "Location permission was denied. Please enter your pincode manually.";
      } else if (
        error.code === error.POSITION_UNAVAILABLE
      ) {
        message =
          "Your current location could not be determined.";
      } else if (error.code === error.TIMEOUT) {
        message =
          "Location detection timed out. Please try again.";
      }

      setMessage(message, "error");
      elements.location.disabled = false;
    },

    {
      enableHighAccuracy: false,
      timeout: 10000,
      maximumAge: 300000,
    },
  );
}

    function bindEvents() {
      elements.form.addEventListener(
        "submit",
        handleFormSubmit,
      );

      elements.input.addEventListener("input", handleInput);

      elements.overlay.addEventListener(
        "click",
        handleOverlayClick,
      );

      if (elements.close) {
        elements.close.addEventListener("click", () => {
          closePopup({
            remember: true,
          });
        });
      }

      if (elements.location) {
        elements.location.addEventListener(
          "click",
          handleLocationClick,
        );
      }

      document.addEventListener(
        "keydown",
        handleDocumentKeydown,
      );

      document.addEventListener(
        "pincode-validator:open-popup",
        () => {
          openPopup({
            force: true,
          });
        },
      );

      document.addEventListener(
        "pincode-validator:close-popup",
        () => {
          closePopup({
            remember: false,
          });
        },
      );

      document.addEventListener(
        "pincode-validator:clear-remembered-pincode",
        () => {
          removeStorageItem(STORAGE_KEYS.pincode);
          removeStorageItem(STORAGE_KEYS.validation);
          removeStorageItem(STORAGE_KEYS.popupDismissed);
        },
      );
    }

    async function start() 
    {

      const appEmbedEnabled = document.querySelector(
    "[data-pincode-validator-app-enabled]",
  );

  if (!appEmbedEnabled) {
    return;
  }

      bindEvents();

      const settingsLoaded = await loadSettings();

      if (!settingsLoaded || !settings.popupEnabled) {
        root.hidden = true;
        return;
      }

      const rememberedPincode = getRememberedPincode();

      if (rememberedPincode) {
        elements.input.value = rememberedPincode;
      }

      schedulePopup();
    }

    start();
  }

  function initializeAllPopups(container = document) {
    container
      .querySelectorAll(ROOT_SELECTOR)
      .forEach(initializePopup);
  }

  function boot() {
    initializeAllPopups(document);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, {
      once: true,
    });
  } else {
    boot();
  }

  /*
   * Reinitialize when Shopify reloads theme sections in the
   * theme editor.
   */
  document.addEventListener("shopify:section:load", (event) => {
    initializeAllPopups(event.target);
  });
})();