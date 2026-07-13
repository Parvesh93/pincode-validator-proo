// document.addEventListener("DOMContentLoaded", () => {
//   const widget = document.getElementById("pincode-validator-widget");
//   if (!widget) return;

//   const button = document.getElementById("check-pincode-btn");
//   const input = document.getElementById("pincode-input");
//   const result = document.getElementById("pincode-result");
//   const endpoint = widget.dataset.endpoint;

//   const addToCart = document.querySelector('button[name="add"]');
//   const buyNowButton = document.querySelector(".shopify-payment-button button");
//   const buyNowContainer = document.querySelector(".shopify-payment-button");

//   function disablePurchaseButtons() {
//     if (addToCart) addToCart.disabled = true;
//     if (buyNowButton) buyNowButton.disabled = true;
//     if (buyNowContainer) {
//       buyNowContainer.style.pointerEvents = "none";
//       buyNowContainer.style.opacity = "0.6";
//     }
//   }

//   function enablePurchaseButtons() {
//     if (addToCart) addToCart.disabled = false;
//     if (buyNowButton) buyNowButton.disabled = false;
//     if (buyNowContainer) {
//       buyNowContainer.style.pointerEvents = "auto";
//       buyNowContainer.style.opacity = "1";
//     }
//   }

//   disablePurchaseButtons();

//   if (!button || !input || !result || !endpoint) return;

//   button.addEventListener("click", async () => {
//     const pincode = input.value.trim();

//     if (!pincode) {
//       result.textContent = "Please enter a pincode.";
//       result.style.color = "red";
//       disablePurchaseButtons();
//       return;
//     }

//     result.textContent = "Checking...";
//     result.style.color = "";

//     try {
//       const response = await fetch(endpoint, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({ pincode }),
//       });

//       const text = await response.text();
//       console.log("Pincode response:", response.status, text);

//       const data = JSON.parse(text);

//       if (!response.ok) {
//         result.textContent = data.message || data.error || "Validation failed.";
//         result.style.color = "red";
//         disablePurchaseButtons();
//         return;
//       }

//       result.textContent = data.message || "";
//       result.style.color = data.valid ? "green" : "red";

//       if (data.valid) {
//         enablePurchaseButtons();
//       } else {
//         disablePurchaseButtons();
//       }
//     } catch (error) {
//       console.error("Pincode validation error:", error);
//       result.textContent = "Could not validate pincode.";
//       result.style.color = "red";
//       disablePurchaseButtons();
//     }
//   });
// });



document.addEventListener("DOMContentLoaded", () => {
  const widget = document.getElementById("pincode-validator-widget");
  if (!widget) return;

  const button = document.getElementById("check-pincode-btn");
  const input = document.getElementById("pincode-input");
  const result = document.getElementById("pincode-result");
  const endpoint = widget.dataset.endpoint;

  const addToCart = document.querySelector('button[name="add"]');
  const buyNowButton = document.querySelector(".shopify-payment-button button");
  const buyNowContainer = document.querySelector(".shopify-payment-button");

  if (!button || !input || !result || !endpoint) return;

  const STORAGE_KEY = "pv_last_pincode";

  const defaultSettings = {
    restrictAddToCart: true,
    restrictBuyNow: true,
    requireValidation: true,
    rememberPincodeDays: 7,
  };

  let currentSettings = { ...defaultSettings };

  function disableAddToCart() {
    if (addToCart) addToCart.disabled = true;
  }

  function enableAddToCart() {
    if (addToCart) addToCart.disabled = false;
  }

  function disableBuyNow() {
    if (buyNowButton) buyNowButton.disabled = true;
    if (buyNowContainer) {
      buyNowContainer.style.pointerEvents = "none";
      buyNowContainer.style.opacity = "0.6";
    }
  }

  function enableBuyNow() {
    if (buyNowButton) buyNowButton.disabled = false;
    if (buyNowContainer) {
      buyNowContainer.style.pointerEvents = "auto";
      buyNowContainer.style.opacity = "1";
    }
  }

  function applyButtonState(validated) {
    if (!currentSettings.requireValidation) {
      enableAddToCart();
      enableBuyNow();
      return;
    }

    if (validated) {
      enableAddToCart();
      enableBuyNow();
      return;
    }

    if (currentSettings.restrictAddToCart) {
      disableAddToCart();
    } else {
      enableAddToCart();
    }

    if (currentSettings.restrictBuyNow) {
      disableBuyNow();
    } else {
      enableBuyNow();
    }
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function isValidPincode(pincode) {
    return /^[0-9]{6}$/.test(pincode);
  }

  function getSavedPincodeRecord() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;

      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return null;
      if (!parsed.pincode || !parsed.expiresAt) return null;

      if (Date.now() > parsed.expiresAt) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }

      return parsed;
    } catch (error) {
      return null;
    }
  }

  function savePincode(pincode, rememberDays) {
    try {
      const days = Number(rememberDays) > 0 ? Number(rememberDays) : 7;
      const expiresAt = Date.now() + days * 24 * 60 * 60 * 1000;

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          pincode,
          expiresAt,
        }),
      );
    } catch (error) {}
  }

  function clearSavedPincode() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {}
  }

  function renderError(message) {
    result.textContent = message;
    result.style.color = "red";
  }

  function setCheckingState() {
    result.textContent = "Checking...";
    result.style.color = "";
  }

  function renderResult(data) {
    const lines = [];

    lines.push(
      `<div style="font-weight:600; margin-bottom:6px;">${escapeHtml(
        data.message || "",
      )}</div>`,
    );

    if (data.valid) {
      if (data.estDeliveryDays !== null && data.estDeliveryDays !== undefined) {
        lines.push(
          `<div style="margin-bottom:4px;">Estimated delivery: ${escapeHtml(
            String(data.estDeliveryDays),
          )} day(s)</div>`,
        );
      }

      lines.push(
        `<div style="margin-bottom:4px;">COD: <strong>${
          data.codAvailable ? "Available" : "Not Available"
        }</strong></div>`,
      );

      const locationText = [data.city, data.state, data.country]
        .filter(Boolean)
        .join(", ");

      if (locationText) {
        lines.push(
          `<div style="font-size:13px; opacity:0.8;">Location: ${escapeHtml(
            locationText,
          )}</div>`,
        );
      }

      result.style.color = "green";
    } else {
      lines.push(
        `<div style="margin-bottom:4px;">COD: <strong>Not Available</strong></div>`,
      );
      result.style.color = "red";
    }

    result.innerHTML = lines.join("");
  }

  async function fetchSettingsOnly() {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pincode: "" }),
      });

      const text = await response.text();
      const data = JSON.parse(text);

      if (data.settings) {
        currentSettings = {
          ...defaultSettings,
          ...data.settings,
        };
      }
    } catch (error) {
      console.error("Failed to load pincode settings:", error);
    }
  }

  async function validatePincode(options = {}) {
    const silent = Boolean(options.silent);
    const pincode = input.value.trim();

    if (!pincode) {
      if (!silent) {
        renderError("Please enter a pincode.");
      } else {
        result.textContent = "";
      }
      clearSavedPincode();
      applyButtonState(false);
      return;
    }

    if (!isValidPincode(pincode)) {
      if (!silent) {
        renderError("Please enter a valid 6-digit pincode.");
      } else {
        result.textContent = "";
      }
      clearSavedPincode();
      applyButtonState(false);
      return;
    }

    if (!silent) {
      setCheckingState();
    }

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pincode }),
      });

      const text = await response.text();
      const data = JSON.parse(text);

      if (data.settings) {
        currentSettings = {
          ...defaultSettings,
          ...data.settings,
        };
      }

      if (!response.ok) {
        if (!silent) {
          renderError(data.message || data.error || "Validation failed.");
        }
        applyButtonState(false);
        return;
      }

      renderResult(data);

      if (data.valid) {
        savePincode(pincode, currentSettings.rememberPincodeDays);
        applyButtonState(true);
      } else {
        applyButtonState(false);
      }
    } catch (error) {
      console.error("Pincode validation error:", error);
      if (!silent) {
        renderError("Could not validate pincode.");
      }
      applyButtonState(false);
    }
  }

  async function boot() {
    const savedRecord = getSavedPincodeRecord();

    await fetchSettingsOnly();
    applyButtonState(false);

    if (savedRecord?.pincode) {
      input.value = savedRecord.pincode;
      await validatePincode({ silent: true });
    }
  }

  button.addEventListener("click", () => {
    validatePincode();
  });

  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      validatePincode();
    }
  });

  boot();
});