import type {
  AdminContext,
} from "@shopify/shopify-app-react-router/server";

import prisma from "../db.server";
import { fetchPartnerActiveSubscription } from "./partner-pricing.server";

export type AppPlan =
  | "free"
  | "pro";

export type BillingStatus = {
  plan: AppPlan;
  isPro: boolean;
  hasSelectedPlan: boolean;
  hasActivePayment: boolean;
  subscriptionName: string | null;
  subscriptionId: string | null;
  isTest: boolean;
};

function normalizePlanHandle(
  planHandle: string | null | undefined,
): AppPlan | null {
  if (!planHandle) {
    return null;
  }

  const normalized =
    planHandle
      .trim()
      .toLowerCase()
      .replace(/_/g, "-");

  const proPlanHandles = [
    "pro",
    "pro-plan",
    "pinsure-pro",
    "pincode-validator-pro",
  ];

  const freePlanHandles = [
    "free",
    "free-plan",
    "pinsure-free",
    "pincode-validator-free",
  ];

  if (
    proPlanHandles.includes(
      normalized,
    )
  ) {
    return "pro";
  }

  if (
    freePlanHandles.includes(
      normalized,
    )
  ) {
    return "free";
  }

  if (
    normalized.includes("pro")
  ) {
    return "pro";
  }

  if (
    normalized.includes("free")
  ) {
    return "free";
  }

  return null;
}

export async function saveSelectedPlan({
  shopId,
  planHandle,
}: {
  shopId: string;
  planHandle: string;
}) {
  const plan =
    normalizePlanHandle(
      planHandle,
    );

  if (!plan) {
    console.warn(
      "[Billing] Unknown plan handle:",
      planHandle,
    );

    return null;
  }

  console.log(
    "[Billing] Saving selected plan:",
    {
      shopId,
      planHandle,
      normalizedPlan: plan,
    },
  );

  return prisma.shop.update({
    where: {
      id: shopId,
    },

    data: {
      selectedPlan: plan,
      planSelectedAt:
        new Date(),
    },
  });
}

export async function getStoredPlan(
  shopId: string,
): Promise<AppPlan | null> {
  const shop =
    await prisma.shop.findUnique({
      where: {
        id: shopId,
      },

      select: {
        selectedPlan: true,
      },
    });

  if (
    shop?.selectedPlan === "pro"
  ) {
    return "pro";
  }

  if (
    shop?.selectedPlan === "free"
  ) {
    return "free";
  }

  return null;
}

const partnerStatusCache = new Map<string, { at: number; plan: AppPlan; confirmed: boolean }>();
const PARTNER_STATUS_TTL_MS = 30_000;

async function fetchVerifiedManagedPlan(shopId: string): Promise<{
  plan: AppPlan;
  confirmed: boolean;
}> {
  const cached = partnerStatusCache.get(shopId);
  if (cached && Date.now() - cached.at < PARTNER_STATUS_TTL_MS) {
    return { plan: cached.plan, confirmed: cached.confirmed };
  }

  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    select: { shopDomain: true },
  });
  if (!shop) throw new Error("Merchant shop record missing");

  // Offline app session is scoped to this installed merchant.
  const session = await prisma.session.findFirst({
    where: {
      shop: shop.shopDomain,
      isOnline: false,
    },
    orderBy: { expires: "desc" },
    select: { accessToken: true },
  });
  if (!session?.accessToken) throw new Error("Merchant offline Shopify session missing");

  const adminResponse = await fetch(
    `https://${shop.shopDomain}/admin/api/2026-04/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": session.accessToken,
      },
      body: JSON.stringify({ query: "{ shop { id } }" }),
      signal: AbortSignal.timeout(8000),
    },
  );
  if (!adminResponse.ok) {
    throw new Error(`Shopify shop identity HTTP ${adminResponse.status}`);
  }
  const identity = (await adminResponse.json()) as {
    data?: { shop?: { id?: string } };
    errors?: unknown[];
  };
  const shopGid = identity.data?.shop?.id;
  if (identity.errors?.length || !shopGid) {
    throw new Error("Shopify shop identity lookup failed");
  }

  const subscription = await fetchPartnerActiveSubscription(shopGid);
  if (subscription &&
      (subscription.shop.id !== shopGid ||
       subscription.shop.myshopifyDomain.toLowerCase() !== shop.shopDomain.toLowerCase())) {
    throw new Error("Partner subscription shop identity mismatch");
  }

  const activeHandle = subscription?.items.find(item => item.price?.active !== false)?.handle;
  const plan = normalizePlanHandle(activeHandle) ?? "free";
  const verified = { plan, confirmed: subscription !== null };
  partnerStatusCache.set(shopId, { ...verified, at: Date.now() });
  return verified;
}

export async function getBillingStatus(
  billing: AdminContext["billing"],
  shopId?: string,
): Promise<BillingStatus> {
  const storedPlan = shopId ? await getStoredPlan(shopId) : null;

  // Enable after verifying the Partner API identifiers and token in Railway.
  // Partner API errors fail closed: never grant Pro from stale stored state.
  if (process.env.SHOPIFY_PARTNER_BILLING_ENFORCE === "true") {
    try {
      if (!shopId) throw new Error("Shop ID required for managed pricing verification");
      const verified = await fetchVerifiedManagedPlan(shopId);
      return {
        plan: verified.plan,
        isPro: verified.plan === "pro",
        hasSelectedPlan: verified.confirmed || storedPlan !== null,
        hasActivePayment: verified.confirmed,
        subscriptionName: null,
        subscriptionId: null,
        isTest: false,
      };
    } catch (error) {
      console.error("[Billing] Partner subscription verification unavailable:", error instanceof Error ? error.message : "Unknown error");
      return {
        plan: "free",
        isPro: false,
        hasSelectedPlan: storedPlan !== null,
        hasActivePayment: false,
        subscriptionName: null,
        subscriptionId: null,
        isTest: false,
      };
    }
  }

  // Legacy behavior retained temporarily until managed pricing verification
  // has been exercised successfully with a development store.
  try {
    const result = await billing.check();
    const activeSubscription = result.appSubscriptions?.[0] ?? null;
    const plan: AppPlan = storedPlan ?? "free";
    return {
      plan,
      isPro: plan === "pro",
      hasSelectedPlan: storedPlan !== null,
      hasActivePayment: result.hasActivePayment === true,
      subscriptionName: activeSubscription?.name ?? null,
      subscriptionId: activeSubscription?.id ?? null,
      isTest: activeSubscription?.test === true,
    };
  } catch (error) {
    console.error("[Billing] Admin billing check failed:", error);
    const plan: AppPlan = storedPlan ?? "free";
    return {
      plan,
      isPro: plan === "pro",
      hasSelectedPlan: storedPlan !== null,
      hasActivePayment: false,
      subscriptionName: null,
      subscriptionId: null,
      isTest: false,
    };
  }
}

export function requireProPlan(
  status: BillingStatus,
) {
  if (!status.isPro) {
    throw Response.json(
      {
        error:
          "This feature is available on the Pro plan.",
        upgradeRequired: true,
      },
      {
        status: 403,
      },
    );
  }
}