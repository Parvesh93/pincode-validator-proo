import type {
  LoaderFunctionArgs,
} from "react-router";

import {
  authenticate,
} from "../shopify.server";

export const loader = async ({
  request,
}: LoaderFunctionArgs) => {
  const {
    redirect,
    session,
  } = await authenticate.admin(request);

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

  return redirect(pricingUrl, {
    target: "_top",
  });
};

export default function UpgradePage() {
  return null;
}