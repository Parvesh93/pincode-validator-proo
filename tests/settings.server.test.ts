import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";


const popupSettings = {
  popupEnabled: false,

  popupTitle:
    "Check Delivery Availability",

  popupDescription:
    "Enter your pincode to check delivery availability.",

  popupButtonText:
    "Check Availability",

  popupLocationText:
    "Use my current location",

  popupTrigger:
    "delay" as const,

  popupDelaySeconds: 3,

  popupRemember: true,
  popupRememberDays: 7,

  popupShowClose: true,
  popupCloseOnOverlay: true,

  popupTheme:
    "light" as const,

  popupWidth: 420,

  popupShowHome: true,
  popupShowProduct: true,
  popupShowCollection: true,
  popupShowCart: false,
  popupShowPages: false,

  popupAutoClose: true,
  popupAutoCloseDelay: 1500,

  locationDetectionEnabled: false,
};

const prismaMock = vi.hoisted(() => ({
  appSetting: {
    findUnique: vi.fn(),
    upsert: vi.fn(),
  },
}));

vi.mock("../app/db.server", () => ({
  default: prismaMock,
}));

import {
  getSettingsByShopId,
  upsertSettings,
} from "../app/lib/settings.server";

describe("settings.server", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getSettingsByShopId", () => {
    it("fetches settings only for the requested shop", async () => {
      const settings = {
        id: "settings-1",
        shopId: "shop-1",
        restrictAddToCart: true,
        restrictBuyNow: true,
        enableEmbed: true,
        enableBlock: true,
        requireValidation: true,
        successMessage:
          "Delivery is available.",
        failureMessage:
          "Delivery is unavailable.",
        defaultCountry: "India",
        rememberPincodeDays: 7,
      };

      prismaMock.appSetting.findUnique.mockResolvedValue(
        settings,
      );

      const result =
        await getSettingsByShopId(
          "shop-1",
        );

      expect(result).toEqual(settings);

      expect(
        prismaMock.appSetting.findUnique,
      ).toHaveBeenCalledTimes(1);

      expect(
        prismaMock.appSetting.findUnique,
      ).toHaveBeenCalledWith({
        where: {
          shopId: "shop-1",
        },
      });
    });

    it("returns null when settings do not exist", async () => {
      prismaMock.appSetting.findUnique.mockResolvedValue(
        null,
      );

      const result =
        await getSettingsByShopId(
          "shop-without-settings",
        );

      expect(result).toBeNull();

      expect(
        prismaMock.appSetting.findUnique,
      ).toHaveBeenCalledWith({
        where: {
          shopId:
            "shop-without-settings",
        },
      });
    });

    it("does not query settings using a different field", async () => {
      prismaMock.appSetting.findUnique.mockResolvedValue(
        null,
      );

      await getSettingsByShopId(
        "secure-shop",
      );

      const call =
        prismaMock.appSetting.findUnique.mock
          .calls[0][0];

      expect(call.where).toEqual({
        shopId: "secure-shop",
      });

      expect(call.where).not.toHaveProperty(
        "id",
      );
    });
  });

  describe("upsertSettings", () => {
    it("creates settings when the shop has no existing record", async () => {
      const input = {
        shopId: "shop-1",
        restrictAddToCart: true,
        restrictBuyNow: false,
        enableEmbed: true,
        enableBlock: true,
        requireValidation: true,
        successMessage:
          "Delivery available.",
        failureMessage:
          "Delivery unavailable.",
        defaultCountry: "India",
        rememberPincodeDays: 14,

         ...popupSettings,
      };

      prismaMock.appSetting.upsert.mockResolvedValue(
        {
          id: "settings-1",
          ...input,
        },
      );

      const result =
        await upsertSettings(input);

      expect(result).toEqual({
        id: "settings-1",
        ...input,
      });

      expect(
  prismaMock.appSetting.upsert,
).toHaveBeenCalledWith({
  where: {
    shopId: "shop-1",
  },

  update: {
    restrictAddToCart: true,
    restrictBuyNow: false,
    enableEmbed: true,
    enableBlock: true,
    requireValidation: true,
    successMessage:
      "Delivery available.",
    failureMessage:
      "Delivery unavailable.",
    defaultCountry: "India",
    rememberPincodeDays: 14,
    ...popupSettings,
  },

  create: {
    shopId: "shop-1",
    restrictAddToCart: true,
    restrictBuyNow: false,
    enableEmbed: true,
    enableBlock: true,
    requireValidation: true,
    successMessage:
      "Delivery available.",
    failureMessage:
      "Delivery unavailable.",
    defaultCountry: "India",
    rememberPincodeDays: 14,
    ...popupSettings,
  },
});
    });

    it("updates settings using the shop ID as the unique key", async () => {
      const input = {
        shopId: "shop-2",
        restrictAddToCart: false,
        restrictBuyNow: false,
        enableEmbed: false,
        enableBlock: true,
        requireValidation: false,
        successMessage:
          "Service is available.",
        failureMessage:
          "Service is not available.",
        defaultCountry: "India",
        rememberPincodeDays: 30,
         ...popupSettings,
      };

      prismaMock.appSetting.upsert.mockResolvedValue(
        {
          id: "settings-2",
          ...input,
        },
      );

      await upsertSettings(input);

      expect(
        prismaMock.appSetting.upsert,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            shopId: "shop-2",
          },
        }),
      );
    });

    it("preserves false checkbox values", async () => {
      const input = {
        shopId: "shop-1",
        restrictAddToCart: false,
        restrictBuyNow: false,
        enableEmbed: false,
        enableBlock: false,
        requireValidation: false,
        successMessage:
          "Delivery available.",
        failureMessage:
          "Delivery unavailable.",
        defaultCountry: "India",
        rememberPincodeDays: 7,
         ...popupSettings,
      };

      prismaMock.appSetting.upsert.mockResolvedValue(
        input,
      );

      await upsertSettings(input);

      const call =
        prismaMock.appSetting.upsert.mock
          .calls[0][0];

      expect(
        call.update.restrictAddToCart,
      ).toBe(false);

      expect(
        call.update.restrictBuyNow,
      ).toBe(false);

      expect(
        call.update.enableEmbed,
      ).toBe(false);

      expect(
        call.update.enableBlock,
      ).toBe(false);

      expect(
        call.update.requireValidation,
      ).toBe(false);

      expect(
        call.create.restrictAddToCart,
      ).toBe(false);

      expect(
        call.create.restrictBuyNow,
      ).toBe(false);

      expect(
        call.create.enableEmbed,
      ).toBe(false);

      expect(
        call.create.enableBlock,
      ).toBe(false);

      expect(
        call.create.requireValidation,
      ).toBe(false);
    });

    it("converts an undefined country to null", async () => {
      const input = {
        shopId: "shop-1",
        restrictAddToCart: true,
        restrictBuyNow: true,
        enableEmbed: true,
        enableBlock: true,
        requireValidation: true,
        successMessage:
          "Delivery available.",
        failureMessage:
          "Delivery unavailable.",
        defaultCountry: undefined,
        rememberPincodeDays: 7,
         ...popupSettings,
      };

      prismaMock.appSetting.upsert.mockResolvedValue(
        {
          ...input,
          defaultCountry: null,
        },
      );

      await upsertSettings(input);

      expect(
        prismaMock.appSetting.upsert,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          update:
            expect.objectContaining({
              defaultCountry: null,
            }),

          create:
            expect.objectContaining({
              defaultCountry: null,
            }),
        }),
      );
    });

    it("converts an explicitly null country to null", async () => {
      const input = {
        shopId: "shop-1",
        restrictAddToCart: true,
        restrictBuyNow: true,
        enableEmbed: true,
        enableBlock: true,
        requireValidation: true,
        successMessage:
          "Delivery available.",
        failureMessage:
          "Delivery unavailable.",
        defaultCountry: null,
        rememberPincodeDays: 7,
        ...popupSettings,
      };

      prismaMock.appSetting.upsert.mockResolvedValue(
        input,
      );

      await upsertSettings(input);

      expect(
        prismaMock.appSetting.upsert,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          update:
            expect.objectContaining({
              defaultCountry: null,
            }),

          create:
            expect.objectContaining({
              defaultCountry: null,
            }),
        }),
      );
    });

    it("keeps the configured remember-pincode duration", async () => {
      const input = {
        shopId: "shop-1",
        restrictAddToCart: true,
        restrictBuyNow: true,
        enableEmbed: true,
        enableBlock: true,
        requireValidation: true,
        successMessage:
          "Delivery available.",
        failureMessage:
          "Delivery unavailable.",
        defaultCountry: "India",
        rememberPincodeDays: 365,
         ...popupSettings,
      };

      prismaMock.appSetting.upsert.mockResolvedValue(
        input,
      );

      await upsertSettings(input);

      const call =
        prismaMock.appSetting.upsert.mock
          .calls[0][0];

      expect(
        call.update.rememberPincodeDays,
      ).toBe(365);

      expect(
        call.create.rememberPincodeDays,
      ).toBe(365);
    });

    it("does not allow one shop to overwrite another shop through the where clause", async () => {
      const input = {
        shopId: "secure-shop",
        restrictAddToCart: true,
        restrictBuyNow: true,
        enableEmbed: true,
        enableBlock: true,
        requireValidation: true,
        successMessage:
          "Delivery available.",
        failureMessage:
          "Delivery unavailable.",
        defaultCountry: "India",
        rememberPincodeDays: 7,
        ...popupSettings,
      };

      prismaMock.appSetting.upsert.mockResolvedValue(
        input,
      );

      await upsertSettings(input);

      const call =
        prismaMock.appSetting.upsert.mock
          .calls[0][0];

      expect(call.where).toEqual({
        shopId: "secure-shop",
      });

      expect(call.create.shopId).toBe(
        "secure-shop",
      );

      expect(call.update).not.toHaveProperty(
        "shopId",
      );
    });
  });
});