export type AppBillingContext = {
  billing: {
    plan: "free" | "pro";
    isPro: boolean;
    hasActivePayment: boolean;
    subscriptionName: string | null;
    isTest: boolean;
  };

  pricingUrl: string;
};