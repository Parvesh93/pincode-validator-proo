import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { getOrCreateShopByDomain, getPincodesByShop } from "../lib/pincode.server";
import { getSettingsByShopId } from "../lib/settings.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = await getOrCreateShopByDomain(session.shop);
  const pincodes = await getPincodesByShop(shop.id);
  const settings = await getSettingsByShopId(shop.id);

  return {
    shopDomain: session.shop,
    totalPincodes: pincodes.length,
    activePincodes: pincodes.filter((item) => item.isActive).length,
    codEnabledPincodes: pincodes.filter((item) => item.codAvailable).length,
    requireValidation: settings?.requireValidation ?? true,
    restrictAddToCart: settings?.restrictAddToCart ?? true,
    restrictBuyNow: settings?.restrictBuyNow ?? true,
  };
};

export default function Index() {
  const data = useLoaderData<typeof loader>();

  return (
    <s-page heading="Pincode Validator Dashboard">
      <s-section heading="Overview">
        <s-paragraph>
          Shop: <s-text>{data.shopDomain}</s-text>
        </s-paragraph>
        <s-paragraph>
          Use this dashboard to manage delivery serviceability, CSV imports, and storefront validation settings.
        </s-paragraph>
      </s-section>

      <s-section heading="Quick stats">
        <s-stack direction="block" gap="base">
          <s-box padding="base" borderWidth="base" borderRadius="base">
            <s-paragraph>Total pincodes: {String(data.totalPincodes)}</s-paragraph>
            <s-paragraph>Active pincodes: {String(data.activePincodes)}</s-paragraph>
            <s-paragraph>COD-enabled pincodes: {String(data.codEnabledPincodes)}</s-paragraph>
          </s-box>

          <s-box padding="base" borderWidth="base" borderRadius="base">
            <s-paragraph>
              Require validation: {data.requireValidation ? "Yes" : "No"}
            </s-paragraph>
            <s-paragraph>
              Restrict Add to Cart: {data.restrictAddToCart ? "Yes" : "No"}
            </s-paragraph>
            <s-paragraph>
              Restrict Buy Now: {data.restrictBuyNow ? "Yes" : "No"}
            </s-paragraph>
          </s-box>
        </s-stack>
      </s-section>

      <s-section heading="Quick links">
        <s-unordered-list>
          <s-list-item>
            <s-link href="/app/pincodes">Manage Pincodes</s-link>
          </s-list-item>
          <s-list-item>
            <s-link href="/app/import">Import CSV</s-link>
          </s-list-item>
          <s-list-item>
            <s-link href="/app/settings">Settings</s-link>
          </s-list-item>
        </s-unordered-list>
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};