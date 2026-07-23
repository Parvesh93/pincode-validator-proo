import type {
  LoaderFunctionArgs,
} from "react-router";

import {
  authenticate,
} from "../shopify.server";

export async function loader({
  request,
}: LoaderFunctionArgs) {
  const {
    redirect,
    session,
  } = await authenticate.admin(request);

  const appHandle =
    process.env.SHOPIFY_APP_HANDLE;

  if (!appHandle) {
    console.error(
      "SHOPIFY_APP_HANDLE is not configured.",
    );

    throw new Response(
      "App pricing configuration is unavailable.",
      {
        status: 500,
      },
    );
  }

  const storeHandle =
    session.shop.replace(
      /\.myshopify\.com$/i,
      "",
    );

  const pricingUrl =
    `https://admin.shopify.com/store/` +
    `${encodeURIComponent(storeHandle)}/charges/` +
    `${encodeURIComponent(appHandle)}/pricing_plans`;

  return redirect(pricingUrl);
}