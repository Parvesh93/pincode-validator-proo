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
  saveSelectedPlan,
} from "../lib/billing.server";

export const loader = async ({
  request,
}: LoaderFunctionArgs) => {
  const {
    billing,
    redirect,
    session,
  } =
    await authenticate.admin(
      request,
    );

  const shop =
    await getOrCreateShopByDomain(
      session.shop,
    );

  const requestUrl =
    new URL(request.url);

  const selectedPlanHandle =
    requestUrl.searchParams.get(
      "plan_handle",
    );

  /*
   * Shopify adds plan_handle after the merchant
   * chooses a plan and returns through the Welcome link.
   */
  if (selectedPlanHandle) {
    await saveSelectedPlan({
      shopId: shop.id,
      planHandle:
        selectedPlanHandle,
    });
  }

  const billingStatus =
    await getBillingStatus(
      billing,
      shop.id,
    );

  const appHandle =
    process.env
      .SHOPIFY_APP_HANDLE ||
    "pincode-validator-proo";

  const storeHandle =
    session.shop.replace(
      /\.myshopify\.com$/i,
      "",
    );

  const pricingUrl =
    `https://admin.shopify.com/store/` +
    `${encodeURIComponent(
      storeHandle,
    )}/charges/` +
    `${encodeURIComponent(
      appHandle,
    )}/pricing_plans`;

  /*
   * First installation:
   * no plan has been selected yet, so send the
   * merchant to Shopify's hosted pricing page.
   */
  if (
    !billingStatus.hasSelectedPlan
  ) {
    return redirect(
      pricingUrl,
      {
        target: "_top",
      },
    );
  }

  return {
    apiKey:
      process.env
        .SHOPIFY_API_KEY || "",

    pricingUrl,

    billing: {
      plan:
        billingStatus.plan,

      isPro:
        billingStatus.isPro,

      hasSelectedPlan:
        billingStatus.hasSelectedPlan,

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
  } =
    useLoaderData<
      typeof loader
    >();

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

        {billing.isPro && (
          <Link to="/app/import">
            Import CSV
          </Link>
        )}

        {billing.isPro && (
          <a href="/app/pincodes/export">
            Export CSV
          </a>
        )}

        {billing.isPro && (
          <Link to="/app/analytics">
            Analytics
          </Link>
        )}

        {billing.isPro && (
          <Link to="/app/logs">
            Validation Logs
          </Link>
        )}

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