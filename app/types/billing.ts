export type AppBillingContext = {
  billing: {
    plan:
      | "free"
      | "pro";

    isPro: boolean;

    hasSelectedPlan: boolean;

    hasActivePayment: boolean;

    subscriptionName:
      | string
      | null;

    isTest: boolean;
  };

  pricingUrl: string;
};