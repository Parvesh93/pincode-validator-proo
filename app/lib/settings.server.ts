import prisma from "../db.server";

export type PopupTrigger =
  | "immediate"
  | "delay"
  | "before_add_to_cart";

export type PopupTheme =
  | "light"
  | "dark";

export type AppSettingsInput = {
  shopId: string;

  // General validation settings
  restrictAddToCart: boolean;
  restrictBuyNow: boolean;
  enableEmbed: boolean;
  enableBlock: boolean;
  requireValidation: boolean;

  successMessage: string;
  failureMessage: string;
  defaultCountry?: string | null;
  rememberPincodeDays: number;

  // Popup settings
  popupEnabled: boolean;
  popupTitle: string;
  popupDescription: string;
  popupButtonText: string;
  popupLocationText: string;

  popupTrigger: PopupTrigger;
  popupDelaySeconds: number;

  popupRemember: boolean;
  popupRememberDays: number;

  popupShowClose: boolean;
  popupCloseOnOverlay: boolean;

  popupTheme: PopupTheme;
  popupWidth: number;

  popupShowHome: boolean;
  popupShowProduct: boolean;
  popupShowCollection: boolean;
  popupShowCart: boolean;
  popupShowPages: boolean;

  popupAutoClose: boolean;
  popupAutoCloseDelay: number;

  locationDetectionEnabled: boolean;
};

function getSettingsData(
  input: AppSettingsInput,
) {
  return {
    restrictAddToCart:
      input.restrictAddToCart,

    restrictBuyNow:
      input.restrictBuyNow,

    enableEmbed:
      input.enableEmbed,

    enableBlock:
      input.enableBlock,

    requireValidation:
      input.requireValidation,

    successMessage:
      input.successMessage,

    failureMessage:
      input.failureMessage,

    defaultCountry:
      input.defaultCountry ?? null,

    rememberPincodeDays:
      input.rememberPincodeDays,

    popupEnabled:
      input.popupEnabled,

    popupTitle:
      input.popupTitle,

    popupDescription:
      input.popupDescription,

    popupButtonText:
      input.popupButtonText,

    popupLocationText:
      input.popupLocationText,

    popupTrigger:
      input.popupTrigger,

    popupDelaySeconds:
      input.popupDelaySeconds,

    popupRemember:
      input.popupRemember,

    popupRememberDays:
      input.popupRememberDays,

    popupShowClose:
      input.popupShowClose,

    popupCloseOnOverlay:
      input.popupCloseOnOverlay,

    popupTheme:
      input.popupTheme,

    popupWidth:
      input.popupWidth,

    popupShowHome:
      input.popupShowHome,

    popupShowProduct:
      input.popupShowProduct,

    popupShowCollection:
      input.popupShowCollection,

    popupShowCart:
      input.popupShowCart,

    popupShowPages:
      input.popupShowPages,

    popupAutoClose:
      input.popupAutoClose,

    popupAutoCloseDelay:
      input.popupAutoCloseDelay,

    locationDetectionEnabled:
      input.locationDetectionEnabled,
  };
}

export async function getSettingsByShopId(
  shopId: string,
) {
  return prisma.appSetting.findUnique({
    where: {
      shopId,
    },
  });
}

export async function upsertSettings(
  input: AppSettingsInput,
) {
  const settingsData =
    getSettingsData(input);

  return prisma.appSetting.upsert({
    where: {
      shopId: input.shopId,
    },

    update: settingsData,

    create: {
      shopId: input.shopId,
      ...settingsData,
    },
  });
}