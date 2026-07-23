import type {
  AppPlan,
} from "../lib/billing.server";

export type AppBillingContext = {
  billing: {
    plan: AppPlan;
    isPro: boolean;
    hasActivePayment: boolean;
    subscriptionName: string | null;
    isTest: boolean;
  };
};