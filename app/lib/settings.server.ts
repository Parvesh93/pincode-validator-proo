import prisma from "../db.server";

export type AppSettingsInput = {
  shopId: string;
  restrictAddToCart: boolean;
  restrictBuyNow: boolean;
  enableEmbed: boolean;
  enableBlock: boolean;
  requireValidation: boolean;
  successMessage: string;
  failureMessage: string;
  defaultCountry?: string | null;
  rememberPincodeDays: number;
};

export async function getSettingsByShopId(shopId: string) {
  return prisma.appSetting.findUnique({
    where: { shopId },
  });
}

export async function upsertSettings(input: AppSettingsInput) {
  return prisma.appSetting.upsert({
    where: { shopId: input.shopId },
    update: {
      restrictAddToCart: input.restrictAddToCart,
      restrictBuyNow: input.restrictBuyNow,
      enableEmbed: input.enableEmbed,
      enableBlock: input.enableBlock,
      requireValidation: input.requireValidation,
      successMessage: input.successMessage,
      failureMessage: input.failureMessage,
      defaultCountry: input.defaultCountry ?? null,
      rememberPincodeDays: input.rememberPincodeDays,
    },
    create: {
      shopId: input.shopId,
      restrictAddToCart: input.restrictAddToCart,
      restrictBuyNow: input.restrictBuyNow,
      enableEmbed: input.enableEmbed,
      enableBlock: input.enableBlock,
      requireValidation: input.requireValidation,
      successMessage: input.successMessage,
      failureMessage: input.failureMessage,
      defaultCountry: input.defaultCountry ?? null,
      rememberPincodeDays: input.rememberPincodeDays,
    },
  });
}