import type {
  AdminContext,
} from "@shopify/shopify-app-react-router/server";

import prisma from "../db.server";

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

  /*
   * Adjust these values to match the exact plan handles
   * Shopify sends back to your Welcome link.
   */
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

  /*
   * Temporary fallback:
   * any handle containing "pro" is Pro;
   * any handle containing "free" is Free.
   */
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

export async function getBillingStatus(
  billing: AdminContext["billing"],
  shopId?: string,
): Promise<BillingStatus> {
  const storedPlan =
    shopId
      ? await getStoredPlan(
          shopId,
        )
      : null;

  try {
    const result =
      await billing.check();

    const activeSubscription =
      result.appSubscriptions?.[0] ??
      null;

    const hasActivePayment =
      result.hasActivePayment ===
      true;

    /*
     * A verified paid subscription always wins.
     * Otherwise, use the selected Free plan stored locally.
     */
    const plan: AppPlan =
      hasActivePayment
        ? "pro"
        : storedPlan ?? "free";

    return {
      plan,

      isPro:
        plan === "pro",

      hasSelectedPlan:
        storedPlan !== null ||
        hasActivePayment,

      hasActivePayment,

      subscriptionName:
        activeSubscription?.name ??
        null,

      subscriptionId:
        activeSubscription?.id ??
        null,

      isTest:
        activeSubscription?.test ===
        true,
    };
  } catch (error) {
    console.error(
      "Could not check Shopify billing status:",
      error,
    );

    return {
      plan:
        storedPlan ?? "free",

      isPro:
        storedPlan === "pro",

      hasSelectedPlan:
        storedPlan !== null,

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