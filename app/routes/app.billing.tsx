import {
  useEffect,
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

  useEffect(() => {
    window.top?.location.assign(
      pricingUrl,
    );
  }, [pricingUrl]);

  return (
    <s-page heading="Opening Plans & Billing">
      <div
        style={{
          padding: "24px",
        }}
      >
        <p>
          Redirecting you to Shopify’s plan selection page…
        </p>
      </div>
    </s-page>
  );
}