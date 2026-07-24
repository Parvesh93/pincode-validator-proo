import {
  useEffect,
  useRef,
} from "react";

import {
  useOutletContext,
} from "react-router";

import type {
  AppBillingContext,
} from "../types/billing";

export default function BillingRedirectPage() {
  const {
    pricingUrl,
  } =
    useOutletContext<AppBillingContext>();

  const hasOpened =
    useRef(false);

  const openPricingPage = () => {
    /*
     * Shopify App Bridge Navigation API.
     *
     * Do not use:
     * window.top.location.href
     * window.top.location.assign()
     *
     * They can fail because the embedded app iframe and
     * Shopify Admin are on different origins.
     */
    open(
      pricingUrl,
      "_top",
    );
  };

  useEffect(() => {
    if (hasOpened.current) {
      return;
    }

    hasOpened.current = true;

    openPricingPage();
  }, [pricingUrl]);

  return (
    <s-page heading="Plans & Billing">
      <div
        style={{
          maxWidth: "560px",
          margin: "40px auto",
          padding: "28px",
          border: "1px solid #e3e5e7",
          borderRadius: "16px",
          background: "#ffffff",
          textAlign: "center",
          boxShadow:
            "0 6px 22px rgba(20, 25, 30, 0.06)",
        }}
      >
        <div
          style={{
            marginBottom: "10px",
            fontSize: "30px",
          }}
        >
          👑
        </div>

        <h2
          style={{
            margin: "0 0 8px",
            color: "#202223",
            fontSize: "20px",
          }}
        >
          Opening Plans & Billing
        </h2>

        <p
          style={{
            margin: "0 0 20px",
            color: "#6d7175",
            fontSize: "14px",
            lineHeight: 1.6,
          }}
        >
          You are being redirected to Shopify’s secure plan-selection page.
        </p>

        <s-button
          onClick={openPricingPage}
          variant="primary"
        >
          Continue to Plans
        </s-button>
      </div>
    </s-page>
  );
}