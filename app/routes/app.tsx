import type {
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";

import {
  Link,
  Outlet,
  useLoaderData,
  useRouteError,
} from "react-router";

import {
  boundary,
} from "@shopify/shopify-app-react-router/server";

import {
  AppProvider,
} from "@shopify/shopify-app-react-router/react";

import {
  NavMenu,
} from "@shopify/app-bridge-react";

import {
  authenticate,
} from "../shopify.server";

import {
  getOrCreateShopByDomain,
} from "../lib/pincode.server";

import {
  getBillingStatus,
} from "../lib/billing.server";

export const loader = async ({
  request,
}: LoaderFunctionArgs) => {
  const {
    billing,
    session,
  } = await authenticate.admin(request);

  // Ensure shop exists in DB
  await getOrCreateShopByDomain(session.shop);

  const billingStatus =
    await getBillingStatus(billing);

  const appHandle =
    process.env.SHOPIFY_APP_HANDLE ||
    "pincode-validator-proo";

  const storeHandle =
    session.shop.replace(
      /\.myshopify\.com$/i,
      "",
    );

  const pricingUrl =
    `https://admin.shopify.com/store/${encodeURIComponent(
      storeHandle,
    )}/charges/${encodeURIComponent(
      appHandle,
    )}/pricing_plans`;

  return {
    apiKey:
      process.env.SHOPIFY_API_KEY || "",

    pricingUrl,

    billing: {
      plan: billingStatus.plan,
      isPro: billingStatus.isPro,
      hasActivePayment:
        billingStatus.hasActivePayment,
      subscriptionName:
        billingStatus.subscriptionName,
      isTest:
        billingStatus.isTest,
    },
  };
};

export default function App() {
  const {
    apiKey,
    billing,
    pricingUrl,
  } = useLoaderData<typeof loader>();

  return (
    <AppProvider
      embedded
      apiKey={apiKey}
    >
      <NavMenu>
        <Link
          to="/app"
          rel="home"
        >
          Dashboard
        </Link>

        <Link to="/app/pincodes">
          Manage Pincodes
        </Link>

        <Link to="/app/import">
          Import CSV
        </Link>

        <a href="/app/pincodes/export">
          Export CSV
        </a>

        <Link to="/app/analytics">
          Analytics
        </Link>

        <Link to="/app/logs">
          Validation Logs
        </Link>

        <Link to="/app/settings">
          Settings
        </Link>
      </NavMenu>

      <Outlet
        context={{
          billing,
          pricingUrl,
        }}
      />
    </AppProvider>
  );
}

export function ErrorBoundary() {
  return boundary.error(
    useRouteError(),
  );
}

export const headers: HeadersFunction = (
  headersArgs,
) => {
  return boundary.headers(
    headersArgs,
  );
};