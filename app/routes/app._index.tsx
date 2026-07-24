// import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
// import { useLoaderData } from "react-router";
// import { boundary } from "@shopify/shopify-app-react-router/server";

// import { authenticate } from "../shopify.server";
// import {
//   getOrCreateShopByDomain,
//   getPincodesByShop,
// } from "../lib/pincode.server";
// import { getSettingsByShopId } from "../lib/settings.server";

// export const loader = async ({ request }: LoaderFunctionArgs) => {
//   const { session } = await authenticate.admin(request);

//   const shop = await getOrCreateShopByDomain(session.shop);
//   const pincodes = await getPincodesByShop(shop.id);
//   const settings = await getSettingsByShopId(shop.id);

//   const totalPincodes = pincodes.length;
//   const activePincodes = pincodes.filter((item) => item.isActive).length;
//   const codEnabledPincodes = pincodes.filter(
//     (item) => item.codAvailable,
//   ).length;
//   const prepaidEnabledPincodes = pincodes.filter(
//     (item) => item.prepaidAvailable,
//   ).length;

//   const inactivePincodes = totalPincodes - activePincodes;

//   const activePercentage =
//     totalPincodes > 0
//       ? Math.round((activePincodes / totalPincodes) * 100)
//       : 0;

//   return {
//     shopDomain: session.shop,
//     totalPincodes,
//     activePincodes,
//     inactivePincodes,
//     codEnabledPincodes,
//     prepaidEnabledPincodes,
//     activePercentage,
//     requireValidation: settings?.requireValidation ?? true,
//     restrictAddToCart: settings?.restrictAddToCart ?? true,
//     restrictBuyNow: settings?.restrictBuyNow ?? true,
//   };
// };

// type StatCardProps = {
//   label: string;
//   value: number | string;
//   description: string;
//   accent: string;
// };

// function StatCard({
//   label,
//   value,
//   description,
//   accent,
// }: StatCardProps) {
//   return (
//     <div
//       style={{
//         position: "relative",
//         overflow: "hidden",
//         minHeight: "150px",
//         padding: "22px",
//         border: "1px solid #e3e5e7",
//         borderRadius: "16px",
//         background: "#ffffff",
//         boxShadow: "0 4px 18px rgba(20, 25, 30, 0.05)",
//       }}
//     >
//       <div
//         style={{
//           position: "absolute",
//           top: 0,
//           left: 0,
//           width: "100%",
//           height: "4px",
//           background: accent,
//         }}
//       />

//       <p
//         style={{
//           margin: 0,
//           color: "#616161",
//           fontSize: "13px",
//           fontWeight: 600,
//           letterSpacing: "0.02em",
//           textTransform: "uppercase",
//         }}
//       >
//         {label}
//       </p>

//       <p
//         style={{
//           margin: "14px 0 6px",
//           color: "#202223",
//           fontSize: "34px",
//           fontWeight: 700,
//           lineHeight: 1,
//         }}
//       >
//         {value}
//       </p>

//       <p
//         style={{
//           margin: 0,
//           color: "#6d7175",
//           fontSize: "14px",
//           lineHeight: 1.5,
//         }}
//       >
//         {description}
//       </p>
//     </div>
//   );
// }

// type StatusRowProps = {
//   label: string;
//   enabled: boolean;
//   description: string;
// };

// function StatusRow({
//   label,
//   enabled,
//   description,
// }: StatusRowProps) {
//   return (
//     <div
//       style={{
//         display: "flex",
//         alignItems: "flex-start",
//         justifyContent: "space-between",
//         gap: "20px",
//         padding: "18px 0",
//         borderBottom: "1px solid #ebebeb",
//       }}
//     >
//       <div>
//         <p
//           style={{
//             margin: 0,
//             color: "#202223",
//             fontSize: "15px",
//             fontWeight: 600,
//           }}
//         >
//           {label}
//         </p>

//         <p
//           style={{
//             margin: "5px 0 0",
//             color: "#6d7175",
//             fontSize: "13px",
//             lineHeight: 1.5,
//           }}
//         >
//           {description}
//         </p>
//       </div>

//       <span
//         style={{
//           flexShrink: 0,
//           display: "inline-flex",
//           alignItems: "center",
//           gap: "7px",
//           padding: "6px 10px",
//           borderRadius: "999px",
//           background: enabled ? "#e8f5ee" : "#f1f2f3",
//           color: enabled ? "#087a44" : "#616161",
//           fontSize: "12px",
//           fontWeight: 700,
//         }}
//       >
//         <span
//           style={{
//             width: "7px",
//             height: "7px",
//             borderRadius: "50%",
//             background: enabled ? "#008060" : "#8c9196",
//           }}
//         />

//         {enabled ? "Enabled" : "Disabled"}
//       </span>
//     </div>
//   );
// }

// type ActionCardProps = {
//   title: string;
//   description: string;
//   href: string;
//   buttonText: string;
// };

// function ActionCard({
//   title,
//   description,
//   href,
//   buttonText,
// }: ActionCardProps) {
//   return (
//     <div
//       style={{
//         display: "flex",
//         flexDirection: "column",
//         justifyContent: "space-between",
//         minHeight: "190px",
//         padding: "22px",
//         border: "1px solid #e3e5e7",
//         borderRadius: "16px",
//         background: "#ffffff",
//         boxShadow: "0 4px 18px rgba(20, 25, 30, 0.04)",
//       }}
//     >
//       <div>
//         <h3
//           style={{
//             margin: 0,
//             color: "#202223",
//             fontSize: "17px",
//             fontWeight: 700,
//           }}
//         >
//           {title}
//         </h3>

//         <p
//           style={{
//             margin: "9px 0 20px",
//             color: "#6d7175",
//             fontSize: "14px",
//             lineHeight: 1.6,
//           }}
//         >
//           {description}
//         </p>
//       </div>

//       <s-link href={href}>{buttonText}</s-link>
//     </div>
//   );
// }

// export default function Index() {
//   const data = useLoaderData<typeof loader>();

//   return (
//     <s-page heading="Pincode Validator">
//       <div
//         style={{
//           display: "grid",
//           gap: "24px",
//           paddingBottom: "32px",
//         }}
//       >
//         <section
//           style={{
//             position: "relative",
//             overflow: "hidden",
//             padding: "30px",
//             borderRadius: "20px",
//             background:
//               "linear-gradient(135deg, #1f2937 0%, #111827 58%, #0f766e 140%)",
//             color: "#ffffff",
//             boxShadow: "0 12px 30px rgba(17, 24, 39, 0.16)",
//           }}
//         >
//           <div
//             style={{
//               position: "relative",
//               zIndex: 2,
//               maxWidth: "720px",
//             }}
//           >
//             <span
//               style={{
//                 display: "inline-flex",
//                 alignItems: "center",
//                 padding: "6px 10px",
//                 border: "1px solid rgba(255,255,255,0.18)",
//                 borderRadius: "999px",
//                 background: "rgba(255,255,255,0.08)",
//                 fontSize: "12px",
//                 fontWeight: 700,
//                 letterSpacing: "0.03em",
//               }}
//             >
//               Store connected
//             </span>

//             <h1
//               style={{
//                 margin: "16px 0 10px",
//                 fontSize: "30px",
//                 fontWeight: 750,
//                 lineHeight: 1.2,
//               }}
//             >
//               Manage delivery availability with confidence
//             </h1>

//             <p
//               style={{
//                 margin: 0,
//                 maxWidth: "620px",
//                 color: "rgba(255,255,255,0.78)",
//                 fontSize: "15px",
//                 lineHeight: 1.7,
//               }}
//             >
//               Control serviceable pincodes, COD availability, prepaid
//               availability and storefront validation for{" "}
//               <strong style={{ color: "#ffffff" }}>
//                 {data.shopDomain}
//               </strong>
//               .
//             </p>

//             <div
//               style={{
//                 display: "flex",
//                 flexWrap: "wrap",
//                 gap: "12px",
//                 marginTop: "24px",
//               }}
//             >
//               <s-button
//                 href="/app/pincodes"
//                 variant="primary"
//               >
//                 Manage pincodes
//               </s-button>

//               <s-button href="/app/import">
//                 Import CSV
//               </s-button>
//             </div>
//           </div>

//           <div
//             style={{
//               position: "absolute",
//               top: "-80px",
//               right: "-60px",
//               width: "260px",
//               height: "260px",
//               borderRadius: "50%",
//               background: "rgba(255,255,255,0.06)",
//             }}
//           />

//           <div
//             style={{
//               position: "absolute",
//               right: "100px",
//               bottom: "-100px",
//               width: "220px",
//               height: "220px",
//               borderRadius: "50%",
//               background: "rgba(13, 148, 136, 0.18)",
//             }}
//           />
//         </section>

//         <section>
//           <div
//             style={{
//               display: "flex",
//               alignItems: "flex-end",
//               justifyContent: "space-between",
//               gap: "16px",
//               marginBottom: "14px",
//             }}
//           >
//             <div>
//               <h2
//                 style={{
//                   margin: 0,
//                   color: "#202223",
//                   fontSize: "20px",
//                   fontWeight: 700,
//                 }}
//               >
//                 Store overview
//               </h2>

//               <p
//                 style={{
//                   margin: "5px 0 0",
//                   color: "#6d7175",
//                   fontSize: "14px",
//                 }}
//               >
//                 A quick summary of your current serviceability data.
//               </p>
//             </div>
//           </div>

//           <div
//             style={{
//               display: "grid",
//               gridTemplateColumns:
//                 "repeat(auto-fit, minmax(210px, 1fr))",
//               gap: "16px",
//             }}
//           >
//             <StatCard
//               label="Total pincodes"
//               value={data.totalPincodes}
//               description="All pincodes currently stored in your account."
//               accent="#4f46e5"
//             />

//             <StatCard
//               label="Active pincodes"
//               value={data.activePincodes}
//               description={`${data.activePercentage}% of your pincode database is active.`}
//               accent="#008060"
//             />

//             <StatCard
//               label="COD enabled"
//               value={data.codEnabledPincodes}
//               description="Pincodes currently accepting cash on delivery."
//               accent="#b98900"
//             />

//             <StatCard
//               label="Prepaid enabled"
//               value={data.prepaidEnabledPincodes}
//               description="Pincodes currently accepting prepaid orders."
//               accent="#006fbb"
//             />
//           </div>
//         </section>

//         <div
//           style={{
//             display: "grid",
//             gridTemplateColumns:
//               "minmax(0, 1.3fr) minmax(300px, 0.7fr)",
//             gap: "20px",
//           }}
//           className="pincode-dashboard-two-column"
//         >
//           <section
//             style={{
//               padding: "24px",
//               border: "1px solid #e3e5e7",
//               borderRadius: "16px",
//               background: "#ffffff",
//               boxShadow: "0 4px 18px rgba(20, 25, 30, 0.04)",
//             }}
//           >
//             <div
//               style={{
//                 display: "flex",
//                 alignItems: "center",
//                 justifyContent: "space-between",
//                 gap: "16px",
//                 marginBottom: "4px",
//               }}
//             >
//               <div>
//                 <h2
//                   style={{
//                     margin: 0,
//                     color: "#202223",
//                     fontSize: "19px",
//                     fontWeight: 700,
//                   }}
//                 >
//                   Validation status
//                 </h2>

//                 <p
//                   style={{
//                     margin: "5px 0 0",
//                     color: "#6d7175",
//                     fontSize: "14px",
//                   }}
//                 >
//                   Review the storefront rules currently active.
//                 </p>
//               </div>

//               <s-link href="/app/settings">
//                 Edit settings
//               </s-link>
//             </div>

//             <StatusRow
//               label="Require pincode validation"
//               enabled={data.requireValidation}
//               description="Customers must validate their delivery pincode before continuing."
//             />

//             <StatusRow
//               label="Restrict Add to Cart"
//               enabled={data.restrictAddToCart}
//               description="The visible Add to Cart button is restricted until successful validation."
//             />

//             <StatusRow
//               label="Restrict Buy Now"
//               enabled={data.restrictBuyNow}
//               description="The visible dynamic checkout button is restricted until successful validation."
//             />
//           </section>

//           <section
//             style={{
//               padding: "24px",
//               border: "1px solid #e3e5e7",
//               borderRadius: "16px",
//               background: "#ffffff",
//               boxShadow: "0 4px 18px rgba(20, 25, 30, 0.04)",
//             }}
//           >
//             <h2
//               style={{
//                 margin: 0,
//                 color: "#202223",
//                 fontSize: "19px",
//                 fontWeight: 700,
//               }}
//             >
//               Database health
//             </h2>

//             <p
//               style={{
//                 margin: "5px 0 20px",
//                 color: "#6d7175",
//                 fontSize: "14px",
//                 lineHeight: 1.5,
//               }}
//             >
//               Current pincode activation summary.
//             </p>

//             <div
//               style={{
//                 marginBottom: "12px",
//                 height: "10px",
//                 overflow: "hidden",
//                 borderRadius: "999px",
//                 background: "#e4e5e7",
//               }}
//             >
//               <div
//                 style={{
//                   width: `${data.activePercentage}%`,
//                   height: "100%",
//                   borderRadius: "999px",
//                   background: "#008060",
//                   transition: "width 0.3s ease",
//                 }}
//               />
//             </div>

//             <div
//               style={{
//                 display: "flex",
//                 justifyContent: "space-between",
//                 gap: "16px",
//                 marginBottom: "22px",
//                 color: "#6d7175",
//                 fontSize: "13px",
//               }}
//             >
//               <span>{data.activePincodes} active</span>
//               <span>{data.inactivePincodes} inactive</span>
//             </div>

//             {data.totalPincodes === 0 ? (
//               <div
//                 style={{
//                   padding: "16px",
//                   borderRadius: "12px",
//                   background: "#fff8e5",
//                   color: "#5c3c00",
//                   fontSize: "13px",
//                   lineHeight: 1.6,
//                 }}
//               >
//                 No pincodes have been added yet. Add one manually or
//                 import a CSV file to activate storefront validation.
//               </div>
//             ) : (
//               <div
//                 style={{
//                   padding: "16px",
//                   borderRadius: "12px",
//                   background: "#e8f5ee",
//                   color: "#075c3c",
//                   fontSize: "13px",
//                   lineHeight: 1.6,
//                 }}
//               >
//                 Your pincode database is active and ready for
//                 storefront validation.
//               </div>
//             )}
//           </section>
//         </div>

//         <section>
//           <div style={{ marginBottom: "14px" }}>
//             <h2
//               style={{
//                 margin: 0,
//                 color: "#202223",
//                 fontSize: "20px",
//                 fontWeight: 700,
//               }}
//             >
//               Quick actions
//             </h2>

//             <p
//               style={{
//                 margin: "5px 0 0",
//                 color: "#6d7175",
//                 fontSize: "14px",
//               }}
//             >
//               Complete the most common tasks from one place.
//             </p>
//           </div>

//           <div
//             style={{
//               display: "grid",
//               gridTemplateColumns:
//                 "repeat(auto-fit, minmax(230px, 1fr))",
//               gap: "16px",
//             }}
//           >
//             <ActionCard
//               title="Manage pincodes"
//               description="Search, add, edit, activate or remove serviceable pincodes."
//               href="/app/pincodes"
//               buttonText="Open pincode manager"
//             />

//             <ActionCard
//               title="Import CSV"
//               description="Upload thousands of pincodes using append or replace mode."
//               href="/app/import"
//               buttonText="Import pincode data"
//             />

//             <ActionCard
//               title="Storefront settings"
//               description="Control messages, restrictions and customer validation behaviour."
//               href="/app/settings"
//               buttonText="Configure validator"
//             />
//           </div>
//         </section>
//       </div>

//       <style>
//         {`
//           @media (max-width: 860px) {
//             .pincode-dashboard-two-column {
//               grid-template-columns: 1fr !important;
//             }
//           }

//           @media (max-width: 600px) {
//             .pincode-dashboard-two-column {
//               gap: 16px !important;
//             }
//           }
//         `}
//       </style>
//     </s-page>
//   );
// }

// export const headers: HeadersFunction = (headersArgs) => {
//   return boundary.headers(headersArgs);
// };

import type { HeadersFunction, LoaderFunctionArgs } from "react-router";

import { useLoaderData, useOutletContext } from "react-router";

import { boundary } from "@shopify/shopify-app-react-router/server";

import { authenticate } from "../shopify.server";

import {
  getOrCreateShopByDomain,
  getPincodesByShop,
} from "../lib/pincode.server";

import { getSettingsByShopId } from "../lib/settings.server";

import type { AppBillingContext } from "../types/billing";

const FREE_PINCODE_LIMIT = 100;

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  const shop = await getOrCreateShopByDomain(session.shop);

  const pincodes = await getPincodesByShop(shop.id);

  const settings = await getSettingsByShopId(shop.id);

  const totalPincodes = pincodes.length;

  const activePincodes = pincodes.filter((item) => item.isActive).length;

  const codEnabledPincodes = pincodes.filter(
    (item) => item.codAvailable,
  ).length;

  const prepaidEnabledPincodes = pincodes.filter(
    (item) => item.prepaidAvailable,
  ).length;

  const inactivePincodes = totalPincodes - activePincodes;

  const activePercentage =
    totalPincodes > 0 ? Math.round((activePincodes / totalPincodes) * 100) : 0;

  return {
    shopDomain: session.shop,

    totalPincodes,
    activePincodes,
    inactivePincodes,

    codEnabledPincodes,
    prepaidEnabledPincodes,

    activePercentage,

    requireValidation: settings?.requireValidation ?? true,

    restrictAddToCart: settings?.restrictAddToCart ?? true,

    restrictBuyNow: settings?.restrictBuyNow ?? true,
  };
};

type StatCardProps = {
  label: string;
  value: number | string;
  description: string;
  accent: string;
};

function StatCard({ label, value, description, accent }: StatCardProps) {
  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        minHeight: "150px",
        padding: "22px",
        border: "1px solid #e3e5e7",
        borderRadius: "16px",
        background: "#ffffff",
        boxShadow: "0 4px 18px rgba(20, 25, 30, 0.05)",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "4px",
          background: accent,
        }}
      />

      <p
        style={{
          margin: 0,
          color: "#616161",
          fontSize: "13px",
          fontWeight: 600,
          letterSpacing: "0.02em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </p>

      <p
        style={{
          margin: "14px 0 6px",
          color: "#202223",
          fontSize: "34px",
          fontWeight: 700,
          lineHeight: 1,
        }}
      >
        {value}
      </p>

      <p
        style={{
          margin: 0,
          color: "#6d7175",
          fontSize: "14px",
          lineHeight: 1.5,
        }}
      >
        {description}
      </p>
    </div>
  );
}

type StatusRowProps = {
  label: string;
  enabled: boolean;
  description: string;
  proRequired?: boolean;
  isPro?: boolean;
};

function StatusRow({
  label,
  enabled,
  description,
  proRequired = false,
  isPro = false,
}: StatusRowProps) {
  const locked = proRequired && !isPro;

  const effectiveEnabled = locked ? false : enabled;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: "20px",
        padding: "18px 0",
        borderBottom: "1px solid #ebebeb",
      }}
    >
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "8px",
          }}
        >
          <p
            style={{
              margin: 0,
              color: "#202223",
              fontSize: "15px",
              fontWeight: 600,
            }}
          >
            {label}
          </p>

          {proRequired && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "3px 8px",
                borderRadius: "999px",
                background: "#fff3cd",
                color: "#7a4f01",
                fontSize: "11px",
                fontWeight: 700,
              }}
            >
              Pro
            </span>
          )}
        </div>

        <p
          style={{
            margin: "5px 0 0",
            color: "#6d7175",
            fontSize: "13px",
            lineHeight: 1.5,
          }}
        >
          {locked
            ? `${description} Upgrade to Pro to use this feature.`
            : description}
        </p>
      </div>

      <span
        style={{
          flexShrink: 0,
          display: "inline-flex",
          alignItems: "center",
          gap: "7px",
          padding: "6px 10px",
          borderRadius: "999px",

          background: locked
            ? "#fff3cd"
            : effectiveEnabled
              ? "#e8f5ee"
              : "#f1f2f3",

          color: locked ? "#7a4f01" : effectiveEnabled ? "#087a44" : "#616161",

          fontSize: "12px",
          fontWeight: 700,
        }}
      >
        <span
          style={{
            width: "7px",
            height: "7px",
            borderRadius: "50%",

            background: locked
              ? "#b98900"
              : effectiveEnabled
                ? "#008060"
                : "#8c9196",
          }}
        />

        {locked ? "Pro required" : effectiveEnabled ? "Enabled" : "Disabled"}
      </span>
    </div>
  );
}

type ActionCardProps = {
  title: string;
  description: string;
  href: string;
  buttonText: string;
  proRequired?: boolean;
  isPro?: boolean;
  onUpgrade?: () => void;
};

function ActionCard({
  title,
  description,
  href,
  buttonText,
  proRequired = false,
  isPro = false,
  onUpgrade,
}: ActionCardProps) {
  const locked = proRequired && !isPro;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        minHeight: "190px",
        padding: "22px",
        border: "1px solid #e3e5e7",
        borderRadius: "16px",
        background: "#ffffff",
        boxShadow: "0 4px 18px rgba(20, 25, 30, 0.04)",
      }}
    >
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "10px",
          }}
        >
          <h3
            style={{
              margin: 0,
              color: "#202223",
              fontSize: "17px",
              fontWeight: 700,
            }}
          >
            {title}
          </h3>

          {proRequired && (
            <span
              style={{
                flexShrink: 0,
                display: "inline-flex",
                padding: "4px 9px",
                borderRadius: "999px",
                background: "#fff3cd",
                color: "#7a4f01",
                fontSize: "11px",
                fontWeight: 700,
              }}
            >
              Pro
            </span>
          )}
        </div>

        <p
          style={{
            margin: "9px 0 20px",
            color: "#6d7175",
            fontSize: "14px",
            lineHeight: 1.6,
          }}
        >
          {description}
        </p>
      </div>

      {locked ? (
        <s-button onClick={onUpgrade} variant="primary">
          Upgrade to Pro        </s-button>
      ) : (
        <s-link href={href}>{buttonText}</s-link>
      )}
    </div>
  );
}

export default function Index() {
  const data = useLoaderData<typeof loader>();

  const { billing, pricingUrl } = useOutletContext<AppBillingContext>();

  const isPro = billing.isPro;

  //   const openPricingPage = () => {
  //   if (window.top) {
  //     window.top.location.href =
  //       pricingUrl;

  //     return;
  //   }

  //   window.location.href =
  //     pricingUrl;
  // };

  const openPricingPage = () => {
    open(pricingUrl, "_top");
  };

  const freeRemaining = Math.max(FREE_PINCODE_LIMIT - data.totalPincodes, 0);

  const freeUsagePercentage = Math.min(
    Math.round((data.totalPincodes / FREE_PINCODE_LIMIT) * 100),
    100,
  );

  return (
    <s-page heading="Pincode Validator">
      <div
        style={{
          display: "grid",
          gap: "24px",
          paddingBottom: "32px",
        }}
      >
        <section
          style={{
            position: "relative",
            overflow: "hidden",
            padding: "30px",
            borderRadius: "20px",

            background:
              "linear-gradient(135deg, #1f2937 0%, #111827 58%, #0f766e 140%)",

            color: "#ffffff",

            boxShadow: "0 12px 30px rgba(17, 24, 39, 0.16)",
          }}
        >
          <div
            style={{
              position: "relative",
              zIndex: 2,
              maxWidth: "760px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "8px",
              }}
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "6px 10px",
                  border: "1px solid rgba(255,255,255,0.18)",
                  borderRadius: "999px",
                  background: "rgba(255,255,255,0.08)",
                  fontSize: "12px",
                  fontWeight: 700,
                  letterSpacing: "0.03em",
                }}
              >
                Store connected
              </span>

              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 10px",
                  borderRadius: "999px",

                  background: isPro
                    ? "rgba(34, 197, 94, 0.18)"
                    : "rgba(255,255,255,0.10)",

                  border: isPro
                    ? "1px solid rgba(74, 222, 128, 0.30)"
                    : "1px solid rgba(255,255,255,0.18)",

                  fontSize: "12px",
                  fontWeight: 700,
                }}
              >
                <span
                  style={{
                    width: "7px",
                    height: "7px",
                    borderRadius: "50%",
                    background: isPro ? "#4ade80" : "#d1d5db",
                  }}
                />

                {isPro ? "Pro plan" : "Free plan"}
              </span>

              {billing.isTest && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "6px 10px",
                    borderRadius: "999px",
                    background: "rgba(245, 158, 11, 0.18)",
                    border: "1px solid rgba(251, 191, 36, 0.30)",
                    color: "#fde68a",
                    fontSize: "12px",
                    fontWeight: 700,
                  }}
                >
                  Test subscription
                </span>
              )}
            </div>

            <h1
              style={{
                margin: "16px 0 10px",
                fontSize: "30px",
                fontWeight: 750,
                lineHeight: 1.2,
              }}
            >
              Manage delivery availability with confidence
            </h1>

            <p
              style={{
                margin: 0,
                maxWidth: "620px",
                color: "rgba(255,255,255,0.78)",
                fontSize: "15px",
                lineHeight: 1.7,
              }}
            >
              Control serviceable pincodes, COD availability, prepaid
              availability and storefront validation for{" "}
              <strong
                style={{
                  color: "#ffffff",
                }}
              >
                {data.shopDomain}
              </strong>
              .
            </p>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "12px",
                marginTop: "24px",
              }}
            >
              <s-button href="/app/pincodes" variant="primary">
                Manage pincodes
              </s-button>

              {isPro ? (
                <s-button href="/app/import">Import CSV</s-button>
              ) : (
                <s-button href="/app/upgrade">Upgrade to Pro</s-button>
              )}
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              top: "-80px",
              right: "-60px",
              width: "260px",
              height: "260px",
              borderRadius: "50%",
              background: "rgba(255,255,255,0.06)",
            }}
          />

          <div
            style={{
              position: "absolute",
              right: "100px",
              bottom: "-100px",
              width: "220px",
              height: "220px",
              borderRadius: "50%",
              background: "rgba(13, 148, 136, 0.18)",
            }}
          />
        </section>

        {!isPro && (
          <section
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) auto",
              alignItems: "center",
              gap: "20px",
              padding: "20px",
              border: "1px solid #c9d8f3",
              borderRadius: "16px",
              background: "#f4f7ff",
            }}
            className="pincode-plan-banner"
          >
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "9px",
                }}
              >
                <h2
                  style={{
                    margin: 0,
                    color: "#202223",
                    fontSize: "17px",
                    fontWeight: 700,
                  }}
                >
                  Free plan usage
                </h2>

                <span
                  style={{
                    display: "inline-flex",
                    padding: "4px 8px",
                    borderRadius: "999px",
                    background: "#e3e8ff",
                    color: "#3730a3",
                    fontSize: "11px",
                    fontWeight: 700,
                  }}
                >
                  {data.totalPincodes}/{FREE_PINCODE_LIMIT} pincodes
                </span>
              </div>

              <p
                style={{
                  margin: "7px 0 12px",
                  color: "#5c5f62",
                  fontSize: "13px",
                  lineHeight: 1.5,
                }}
              >
                {freeRemaining > 0
                  ? `You can add ${freeRemaining} more pincodes on the Free plan.`
                  : "You have reached the Free plan pincode limit."}
              </p>

              <div
                style={{
                  maxWidth: "560px",
                  height: "8px",
                  overflow: "hidden",
                  borderRadius: "999px",
                  background: "#dfe3e8",
                }}
              >
                <div
                  style={{
                    width: `${freeUsagePercentage}%`,
                    height: "100%",
                    borderRadius: "999px",

                    background:
                      freeUsagePercentage >= 100 ? "#b98900" : "#4f46e5",
                  }}
                />
              </div>
            </div>

            <s-button onClick={openPricingPage} variant="primary">
              View Pro plan
            </s-button>
          </section>
        )}

        <section>
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              gap: "16px",
              marginBottom: "14px",
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  color: "#202223",
                  fontSize: "20px",
                  fontWeight: 700,
                }}
              >
                Store overview
              </h2>

              <p
                style={{
                  margin: "5px 0 0",
                  color: "#6d7175",
                  fontSize: "14px",
                }}
              >
                A quick summary of your current serviceability data.
              </p>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
              gap: "16px",
            }}
          >
            <StatCard
              label="Total pincodes"
              value={data.totalPincodes}
              description={
                isPro
                  ? "All pincodes currently stored in your account."
                  : `${data.totalPincodes} of ${FREE_PINCODE_LIMIT} Free plan pincodes used.`
              }
              accent="#4f46e5"
            />

            <StatCard
              label="Active pincodes"
              value={data.activePincodes}
              description={`${data.activePercentage}% of your pincode database is active.`}
              accent="#008060"
            />

            <StatCard
              label="COD enabled"
              value={data.codEnabledPincodes}
              description="Pincodes currently accepting cash on delivery."
              accent="#b98900"
            />

            <StatCard
              label="Prepaid enabled"
              value={data.prepaidEnabledPincodes}
              description="Pincodes currently accepting prepaid orders."
              accent="#006fbb"
            />
          </div>
        </section>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.3fr) minmax(300px, 0.7fr)",
            gap: "20px",
          }}
          className="pincode-dashboard-two-column"
        >
          <section
            style={{
              padding: "24px",
              border: "1px solid #e3e5e7",
              borderRadius: "16px",
              background: "#ffffff",
              boxShadow: "0 4px 18px rgba(20, 25, 30, 0.04)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "16px",
                marginBottom: "4px",
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                    color: "#202223",
                    fontSize: "19px",
                    fontWeight: 700,
                  }}
                >
                  Validation status
                </h2>

                <p
                  style={{
                    margin: "5px 0 0",
                    color: "#6d7175",
                    fontSize: "14px",
                  }}
                >
                  Review the storefront rules currently active.
                </p>
              </div>

              <s-link href="/app/settings">Edit settings</s-link>
            </div>

            <StatusRow
              label="Require pincode validation"
              enabled={data.requireValidation}
              description="Customers must validate their delivery pincode before continuing."
              isPro={isPro}
            />

            <StatusRow
              label="Restrict Add to Cart"
              enabled={data.restrictAddToCart}
              description="The visible Add to Cart button is restricted until successful validation."
              isPro={isPro}
            />

            <StatusRow
              label="Restrict Buy Now"
              enabled={data.restrictBuyNow}
              description="The dynamic checkout button is restricted until successful validation."
              proRequired
              isPro={isPro}
            />
          </section>

          <section
            style={{
              padding: "24px",
              border: "1px solid #e3e5e7",
              borderRadius: "16px",
              background: "#ffffff",
              boxShadow: "0 4px 18px rgba(20, 25, 30, 0.04)",
            }}
          >
            <h2
              style={{
                margin: 0,
                color: "#202223",
                fontSize: "19px",
                fontWeight: 700,
              }}
            >
              Database health
            </h2>

            <p
              style={{
                margin: "5px 0 20px",
                color: "#6d7175",
                fontSize: "14px",
                lineHeight: 1.5,
              }}
            >
              Current pincode activation summary.
            </p>

            <div
              style={{
                marginBottom: "12px",
                height: "10px",
                overflow: "hidden",
                borderRadius: "999px",
                background: "#e4e5e7",
              }}
            >
              <div
                style={{
                  width: `${data.activePercentage}%`,
                  height: "100%",
                  borderRadius: "999px",
                  background: "#008060",
                  transition: "width 0.3s ease",
                }}
              />
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "16px",
                marginBottom: "22px",
                color: "#6d7175",
                fontSize: "13px",
              }}
            >
              <span>{data.activePincodes} active</span>

              <span>{data.inactivePincodes} inactive</span>
            </div>

            {data.totalPincodes === 0 ? (
              <div
                style={{
                  padding: "16px",
                  borderRadius: "12px",
                  background: "#fff8e5",
                  color: "#5c3c00",
                  fontSize: "13px",
                  lineHeight: 1.6,
                }}
              >
                No pincodes have been added yet. Add one manually or import a
                CSV file to activate storefront validation.
              </div>
            ) : (
              <div
                style={{
                  padding: "16px",
                  borderRadius: "12px",
                  background: "#e8f5ee",
                  color: "#075c3c",
                  fontSize: "13px",
                  lineHeight: 1.6,
                }}
              >
                Your pincode database is active and ready for storefront
                validation.
              </div>
            )}
          </section>
        </div>

        <section>
          <div
            style={{
              marginBottom: "14px",
            }}
          >
            <h2
              style={{
                margin: 0,
                color: "#202223",
                fontSize: "20px",
                fontWeight: 700,
              }}
            >
              Quick actions
            </h2>

            <p
              style={{
                margin: "5px 0 0",
                color: "#6d7175",
                fontSize: "14px",
              }}
            >
              Complete the most common tasks from one place.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
              gap: "16px",
            }}
          >
            <ActionCard
              title="Manage pincodes"
              description={
                isPro
                  ? "Search, add, edit, activate or remove serviceable pincodes."
                  : `Manage up to ${FREE_PINCODE_LIMIT} serviceable pincodes on the Free plan.`
              }
              href="/app/pincodes"
              buttonText="Open pincode manager"
              isPro={isPro}
            />

            <ActionCard
              title="Import CSV"
              description="Upload thousands of pincodes using append or replace mode."
              href="/app/import"
              buttonText="Import pincode data"
              proRequired
              isPro={isPro}
              onUpgrade={openPricingPage}
            />

            <ActionCard
              title="Storefront settings"
              description="Control messages, restrictions and customer validation behaviour."
              href="/app/settings"
              buttonText="Configure validator"
              isPro={isPro}
            />
          </div>
        </section>
      </div>

      <style>
        {`
          @media (max-width: 860px) {
            .pincode-dashboard-two-column {
              grid-template-columns: 1fr !important;
            }

            .pincode-plan-banner {
              grid-template-columns: 1fr !important;
            }
          }

          @media (max-width: 600px) {
            .pincode-dashboard-two-column {
              gap: 16px !important;
            }
          }
        `}
      </style>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
