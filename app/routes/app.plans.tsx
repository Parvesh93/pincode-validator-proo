import {
  useOutletContext,
} from "react-router";

import type {
  AppBillingContext,
} from "../types/billing";

type FeatureRowProps = {
  title: string;
  description: string;
  available: boolean;
};

function FeatureRow({
  title,
  description,
  available,
}: FeatureRowProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "12px",
        padding: "14px 0",
        borderBottom:
          "1px solid #ebebeb",
      }}
    >
      <span
        style={{
          flexShrink: 0,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: "24px",
          height: "24px",
          borderRadius: "50%",
          background: available
            ? "#e8f5ee"
            : "#f1f2f3",
          color: available
            ? "#008060"
            : "#6d7175",
          fontSize: "13px",
          fontWeight: 700,
        }}
      >
        {available ? "✓" : "–"}
      </span>

      <div>
        <p
          style={{
            margin: 0,
            color: "#202223",
            fontSize: "14px",
            fontWeight: 650,
          }}
        >
          {title}
        </p>

        <p
          style={{
            margin: "4px 0 0",
            color: "#6d7175",
            fontSize: "13px",
            lineHeight: 1.5,
          }}
        >
          {description}
        </p>
      </div>
    </div>
  );
}

export default function PlansPage() {
  const {
    billing,
    pricingUrl,
  } =
    useOutletContext<AppBillingContext>();

  const openPricingPage = () => {
    if (window.top) {
      window.top.location.href =
        pricingUrl;

      return;
    }

    window.location.href =
      pricingUrl;
  };

  return (
    <s-page heading="Plans & Billing">
      <div
        style={{
          display: "grid",
          gap: "24px",
          paddingBottom: "32px",
        }}
      >
        <section
          style={{
            padding: "26px",
            borderRadius: "18px",
            background:
              "linear-gradient(135deg, #1f2937 0%, #111827 58%, #0f766e 140%)",
            color: "#ffffff",
            boxShadow:
              "0 10px 28px rgba(17, 24, 39, 0.14)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "8px",
              marginBottom: "14px",
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 10px",
                borderRadius: "999px",
                border:
                  "1px solid rgba(255,255,255,0.18)",
                background:
                  "rgba(255,255,255,0.08)",
                fontSize: "12px",
                fontWeight: 700,
              }}
            >
              Current plan
            </span>

            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 10px",
                borderRadius: "999px",
                background: billing.isPro
                  ? "rgba(34,197,94,0.18)"
                  : "rgba(255,255,255,0.10)",
                border: billing.isPro
                  ? "1px solid rgba(74,222,128,0.30)"
                  : "1px solid rgba(255,255,255,0.18)",
                fontSize: "12px",
                fontWeight: 700,
              }}
            >
              {billing.isPro
                ? "👑 Pro plan"
                : "Free plan"}
            </span>
          </div>

          <h1
            style={{
              margin: "0 0 10px",
              fontSize: "28px",
              lineHeight: 1.25,
            }}
          >
            Unlock the complete Pincode Validator
          </h1>

          <p
            style={{
              maxWidth: "640px",
              margin: 0,
              color:
                "rgba(255,255,255,0.78)",
              fontSize: "14px",
              lineHeight: 1.7,
            }}
          >
            Upgrade to Pro to import unlimited
            pincodes, review storefront analytics,
            access validation logs and enable advanced
            storefront restrictions.
          </p>

          <div
            style={{
              marginTop: "22px",
            }}
          >
            <s-button
              onClick={openPricingPage}
              variant="primary"
            >
              {billing.isPro
                ? "Manage billing"
                : "View Pro plan"}
            </s-button>
          </div>
        </section>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "20px",
          }}
        >
          <section
            style={{
              padding: "24px",
              border:
                "1px solid #e3e5e7",
              borderRadius: "16px",
              background: "#ffffff",
              boxShadow:
                "0 4px 18px rgba(20,25,30,0.04)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent:
                  "space-between",
                gap: "12px",
                marginBottom: "8px",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  color: "#202223",
                  fontSize: "20px",
                }}
              >
                Free
              </h2>

              {!billing.isPro && (
                <span
                  style={{
                    padding: "5px 9px",
                    borderRadius:
                      "999px",
                    background:
                      "#f1f2f3",
                    color: "#616161",
                    fontSize: "11px",
                    fontWeight: 700,
                  }}
                >
                  Current plan
                </span>
              )}
            </div>

            <p
              style={{
                margin: "0 0 10px",
                color: "#6d7175",
                fontSize: "14px",
              }}
            >
              Suitable for stores with a small
              serviceability database.
            </p>

            <FeatureRow
              title="Up to 100 pincodes"
              description="Add and manage up to 100 serviceable pincodes."
              available
            />

            <FeatureRow
              title="Manual pincode management"
              description="Add and update pincodes individually."
              available
            />

            <FeatureRow
              title="Basic storefront validation"
              description="Allow customers to check delivery availability."
              available
            />

            <FeatureRow
              title="CSV import"
              description="Bulk upload your serviceable pincodes."
              available={false}
            />

            <FeatureRow
              title="Analytics and logs"
              description="Review validation activity and customer searches."
              available={false}
            />
          </section>

          <section
            style={{
              padding: "24px",
              border:
                "2px solid #4f46e5",
              borderRadius: "16px",
              background: "#ffffff",
              boxShadow:
                "0 8px 24px rgba(79,70,229,0.10)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent:
                  "space-between",
                gap: "12px",
                marginBottom: "8px",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  color: "#202223",
                  fontSize: "20px",
                }}
              >
                👑 Pro
              </h2>

              {billing.isPro && (
                <span
                  style={{
                    padding: "5px 9px",
                    borderRadius:
                      "999px",
                    background:
                      "#e8f5ee",
                    color: "#087a44",
                    fontSize: "11px",
                    fontWeight: 700,
                  }}
                >
                  Current plan
                </span>
              )}
            </div>

            <p
              style={{
                margin: "0 0 10px",
                color: "#6d7175",
                fontSize: "14px",
              }}
            >
              Complete functionality for growing
              stores.
            </p>

            <FeatureRow
              title="Unlimited pincodes"
              description="Manage your complete serviceability database."
              available
            />

            <FeatureRow
              title="CSV import and export"
              description="Bulk upload, replace and export pincode data."
              available
            />

            <FeatureRow
              title="Analytics"
              description="Measure customer validation activity."
              available
            />

            <FeatureRow
              title="Validation logs"
              description="Review successful and failed pincode searches."
              available
            />

            <FeatureRow
              title="Advanced restrictions"
              description="Restrict Add to Cart and Buy Now."
              available
            />

            <FeatureRow
              title="Pincode popup"
              description="Display an advanced storefront validation popup."
              available
            />

            <div
              style={{
                marginTop: "20px",
              }}
            >
              <s-button
                onClick={openPricingPage}
                variant="primary"
              >
                {billing.isPro
                  ? "Manage billing"
                  : "Upgrade to Pro"}
              </s-button>
            </div>
          </section>
        </div>
      </div>
    </s-page>
  );
}