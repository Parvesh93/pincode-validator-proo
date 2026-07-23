import type { AdminContext } from "@shopify/shopify-app-react-router/server";

export type AppPlan = "free" | "pro";

export type BillingStatus = {
  plan: AppPlan;
  isPro: boolean;
  hasActivePayment: boolean;
  subscriptionName: string | null;
  subscriptionId: string | null;
  isTest: boolean;
};

export async function getBillingStatus(
  billing: AdminContext["billing"],
): Promise<BillingStatus> {
  try {
    const result = await billing.check();

    const activeSubscription =
      result.appSubscriptions?.[0] ?? null;

    const hasActivePayment =
      result.hasActivePayment === true;

    return {
      plan: hasActivePayment ? "pro" : "free",
      isPro: hasActivePayment,
      hasActivePayment,

      subscriptionName:
        activeSubscription?.name ?? null,

      subscriptionId:
        activeSubscription?.id ?? null,

      isTest:
        activeSubscription?.test === true,
    };
  } catch (error) {
    console.error(
      "Could not check Shopify billing status:",
      error,
    );

    /*
     * Fail safely as Free rather than accidentally granting
     * paid access when Shopify billing cannot be checked.
     */
    return {
      plan: "free",
      isPro: false,
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