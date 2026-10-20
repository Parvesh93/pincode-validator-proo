/**
 * Managed Shopify App Pricing status is provided by the Partner API,
 * not the Admin Billing API. Never expose Partner API credentials to the browser.
 */
type PartnerSubscription = {
  shop: { id: string; myshopifyDomain: string };
  items: Array<{ handle: string; price?: { active?: boolean } | null }>;
  cancelAtEndOfCycle: boolean;
};

export async function fetchPartnerActiveSubscription(
  shopGid: string,
): Promise<PartnerSubscription | null> {
  const org = process.env.SHOPIFY_PARTNER_ORG_ID?.trim();
  const appId = process.env.SHOPIFY_PARTNER_APP_ID?.trim();
  const token = process.env.SHOPIFY_PARTNER_API_ACCESS_TOKEN?.trim();

  if (!org || !appId || !token) {
    throw new Error("Missing Partner API configuration");
  }
  if (!/^\d+$/.test(org)) {
    throw new Error("Invalid Partner organization ID");
  }

  const response = await fetch(
    `https://partners.shopify.com/${org}/api/2026-07/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": token,
      },
      body: JSON.stringify({
        query: `query ActiveSubscription($appId: ID!, $shopId: ID!) {
          activeSubscription(appId: $appId, shopId: $shopId) {
            shop { id myshopifyDomain }
            cancelAtEndOfCycle
            items { handle price { active } }
          }
        }`,
        variables: {
          appId: appId.startsWith("gid://") ? appId : `gid://shopify/App/${appId}`,
          shopId: shopGid,
        },
      }),
      signal: AbortSignal.timeout(8000),
    },
  );

  if (!response.ok) {
    throw new Error(`Partner API returned HTTP ${response.status}`);
  }

  const payload = (await response.json()) as {
    data?: { activeSubscription?: PartnerSubscription | null };
    errors?: Array<{ message?: string }>;
  };

  if (payload.errors?.length) {
    throw new Error("Partner API rejected activeSubscription query");
  }
  if (!payload.data || !("activeSubscription" in payload.data)) {
    throw new Error("Partner API response missing activeSubscription");
  }
  return payload.data.activeSubscription ?? null;
}
