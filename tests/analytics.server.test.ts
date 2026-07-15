import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const dbMock = vi.hoisted(() => ({
  shop: {
    findUnique: vi.fn(),
  },

  pincode: {
    findUnique: vi.fn(),
  },

  validationLog: {
    create: vi.fn(),
  },
}));

const authenticateMock = vi.hoisted(() => ({
  public: {
    appProxy: vi.fn(),
  },
}));

vi.mock("../app/db.server", () => ({
  default: dbMock,
}));

vi.mock("../app/shopify.server", () => ({
  authenticate: authenticateMock,
}));

import { action } from "../app/routes/apps.pincode-validator.validate";

function createRequest(
  body: unknown,
  options?: {
    userAgent?: string;
  },
) {
  return new Request(
    "https://example.myshopify.com/apps/pincode-validator/validate",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent":
          options?.userAgent ??
          "Vitest Browser",
      },
      body: JSON.stringify(body),
    },
  );
}

function createInvalidJsonRequest() {
  return new Request(
    "https://example.myshopify.com/apps/pincode-validator/validate",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Vitest Browser",
      },
      body: "{invalid-json",
    },
  );
}

async function callAction(
  request: Request,
) {
  return action({
    request,
    params: {},
    context: {},
    unstable_pattern:
      "/apps/pincode-validator/validate",
  });
}

const defaultSettings = {
  restrictAddToCart: true,
  restrictBuyNow: true,
  requireValidation: true,
  enableEmbed: true,
  enableBlock: true,
  rememberPincodeDays: 7,
  successMessage:
    "Delivery is available.",
  failureMessage:
    "Delivery is unavailable.",
  defaultCountry: "India",
};

const shopRecord = {
  id: "shop-record-1",
  shopDomain:
    "example.myshopify.com",
  settings: defaultSettings,
};

describe(
  "storefront validation endpoint",
  () => {
    beforeEach(() => {
      vi.clearAllMocks();

      authenticateMock.public.appProxy.mockResolvedValue(
        {
          session: {
            shop:
              "example.myshopify.com",
          },
        },
      );

      dbMock.shop.findUnique.mockResolvedValue(
        shopRecord,
      );

      dbMock.validationLog.create.mockResolvedValue(
        {
          id: "validation-log-1",
        },
      );
    });

    it("authenticates the request through the Shopify app proxy", async () => {
      const request =
        createRequest({
          pincode: "110001",
        });

      dbMock.pincode.findUnique.mockResolvedValue(
        null,
      );

      await callAction(request);

      expect(
        authenticateMock.public
          .appProxy,
      ).toHaveBeenCalledWith(
        request,
      );
    });

    it("returns 400 when the authenticated shop is missing", async () => {
      authenticateMock.public.appProxy.mockResolvedValue(
        {
          session: null,
        },
      );

      const response =
        await callAction(
          createRequest({
            pincode:
              "110001",
          }),
        );

      expect(response.status).toBe(
        400,
      );

      await expect(
        response.json(),
      ).resolves.toEqual({
        valid: false,
        available: false,
        message:
          "Shop not found",
        settings: null,
      });

      expect(
        dbMock.shop.findUnique,
      ).not.toHaveBeenCalled();

      expect(
        dbMock.validationLog.create,
      ).not.toHaveBeenCalled();
    });

    it("returns 400 for invalid JSON", async () => {
      const response =
        await callAction(
          createInvalidJsonRequest(),
        );

      expect(response.status).toBe(
        400,
      );

      await expect(
        response.json(),
      ).resolves.toEqual({
        valid: false,
        available: false,
        message:
          "Invalid request body",
        settings: null,
      });

      expect(
        dbMock.shop.findUnique,
      ).not.toHaveBeenCalled();

      expect(
        dbMock.validationLog.create,
      ).not.toHaveBeenCalled();
    });

    it("looks up the authenticated shop domain", async () => {
      dbMock.pincode.findUnique.mockResolvedValue(
        null,
      );

      await callAction(
        createRequest({
          pincode: "110001",
        }),
      );

      expect(
        dbMock.shop.findUnique,
      ).toHaveBeenCalledWith({
        where: {
          shopDomain:
            "example.myshopify.com",
        },
        include: {
          settings: true,
        },
      });
    });

    it("returns 404 when the shop record does not exist", async () => {
      dbMock.shop.findUnique.mockResolvedValue(
        null,
      );

      const response =
        await callAction(
          createRequest({
            pincode:
              "110001",
          }),
        );

      expect(response.status).toBe(
        404,
      );

      await expect(
        response.json(),
      ).resolves.toEqual({
        valid: false,
        available: false,
        message:
          "Shop record not found",
        settings: null,
      });

      expect(
        dbMock.validationLog.create,
      ).not.toHaveBeenCalled();
    });

    it("returns settings with a missing-pincode response without logging it", async () => {
      const response =
        await callAction(
          createRequest({
            pincode: "",
            source: "settings-load",
          }),
        );

      expect(response.status).toBe(
        400,
      );

      const body =
        await response.json();

      expect(body).toMatchObject({
        valid: false,
        available: false,
        pincode: "",
        message:
          "Pincode is required",
        codAvailable: false,
        prepaidAvailable: false,
        estDeliveryDays: null,
        city: null,
        state: null,
        country: "India",
        settings:
          defaultSettings,
      });

      expect(
        dbMock.pincode.findUnique,
      ).not.toHaveBeenCalled();

      expect(
        dbMock.validationLog.create,
      ).not.toHaveBeenCalled();
    });

    it.each([
      "012345",
      "12345",
      "1234567",
      "abcdef",
      "11000A",
      "12 345",
    ])(
      "rejects invalid pincode %s and logs it",
      async (pincode) => {
        const response =
          await callAction(
            createRequest({
              pincode,
              productId:
                "product-1",
              productHandle:
                "sample-product",
              productTitle:
                "Sample Product",
              source:
                "product-page",
            }),
          );

        expect(
          response.status,
        ).toBe(400);

        const body =
          await response.json();

        expect(body).toMatchObject({
          valid: false,
          available: false,
          pincode,
          message:
            "Please enter a valid 6-digit Indian pincode",
        });

        expect(
          dbMock.pincode
            .findUnique,
        ).not.toHaveBeenCalled();

        expect(
          dbMock.validationLog.create,
        ).toHaveBeenCalledWith({
          data: expect.objectContaining({
            shopId:
              "shop-record-1",
            pincode,
            result: "invalid",
            isAvailable: false,
            country: "India",
            productId:
              "product-1",
            productHandle:
              "sample-product",
            productTitle:
              "Sample Product",
            codAvailable: false,
            prepaidAvailable: false,
            estDeliveryDays: null,
            source:
              "product-page",
            userAgent:
              "Vitest Browser",
          }),
        });
      },
    );

    it("queries a pincode using both shop ID and pincode", async () => {
      dbMock.pincode.findUnique.mockResolvedValue(
        null,
      );

      await callAction(
        createRequest({
          pincode: "110001",
        }),
      );

      expect(
        dbMock.pincode.findUnique,
      ).toHaveBeenCalledWith({
        where: {
          shopId_pincode: {
            shopId:
              "shop-record-1",
            pincode:
              "110001",
          },
        },
      });
    });

    it("returns unavailable and logs when no pincode record exists", async () => {
      dbMock.pincode.findUnique.mockResolvedValue(
        null,
      );

      const response =
        await callAction(
          createRequest({
            pincode:
              "110001",
            productId:
              "product-1",
            productHandle:
              "sample-product",
            productTitle:
              "Sample Product",
            source:
              "product-page",
          }),
        );

      expect(response.status).toBe(
        200,
      );

      const body =
        await response.json();

      expect(body).toMatchObject({
        valid: false,
        available: false,
        pincode: "110001",
        message:
          "Delivery is unavailable.",
        codAvailable: false,
        prepaidAvailable: false,
        estDeliveryDays: null,
        city: null,
        state: null,
        country: "India",
        settings:
          defaultSettings,
      });

      expect(
        dbMock.validationLog.create,
      ).toHaveBeenCalledWith({
        data: expect.objectContaining({
          shopId:
            "shop-record-1",
          pincode:
            "110001",
          result:
            "unavailable",
          isAvailable: false,
          city: null,
          state: null,
          country: "India",
          productId:
            "product-1",
          productHandle:
            "sample-product",
          productTitle:
            "Sample Product",
          codAvailable: false,
          prepaidAvailable: false,
          estDeliveryDays: null,
          source:
            "product-page",
          userAgent:
            "Vitest Browser",
        }),
      });
    });

    it("returns unavailable and logs an inactive pincode", async () => {
      dbMock.pincode.findUnique.mockResolvedValue(
        {
          id: "pincode-1",
          shopId:
            "shop-record-1",
          pincode:
            "110001",
          city: "Delhi",
          state: "Delhi",
          country: "India",
          codAvailable: true,
          prepaidAvailable: true,
          estDeliveryDays: 2,
          isActive: false,
        },
      );

      const response =
        await callAction(
          createRequest({
            pincode:
              "110001",
          }),
        );

      const body =
        await response.json();

      expect(body).toMatchObject({
        valid: false,
        available: false,
        message:
          "Delivery is unavailable.",
        city: "Delhi",
        state: "Delhi",
        country: "India",
      });

      expect(
        dbMock.validationLog.create,
      ).toHaveBeenCalledWith({
        data: expect.objectContaining({
          shopId:
            "shop-record-1",
          pincode:
            "110001",
          result:
            "inactive",
          isAvailable: false,
          city: "Delhi",
          state: "Delhi",
          country: "India",
          codAvailable: true,
          prepaidAvailable: true,
          estDeliveryDays: 2,
          source:
            "storefront",
        }),
      });
    });

    it("returns unavailable and logs when prepaid delivery is disabled", async () => {
      dbMock.pincode.findUnique.mockResolvedValue(
        {
          id: "pincode-1",
          shopId:
            "shop-record-1",
          pincode:
            "110001",
          city: "Delhi",
          state: "Delhi",
          country: "India",
          codAvailable: true,
          prepaidAvailable: false,
          estDeliveryDays: 2,
          isActive: true,
        },
      );

      const response =
        await callAction(
          createRequest({
            pincode:
              "110001",
          }),
        );

      const body =
        await response.json();

      expect(body).toMatchObject({
        valid: false,
        available: false,
        codAvailable: false,
        prepaidAvailable: false,
        estDeliveryDays: null,
      });

      expect(
        dbMock.validationLog.create,
      ).toHaveBeenCalledWith({
        data: expect.objectContaining({
          shopId:
            "shop-record-1",
          pincode:
            "110001",
          result:
            "prepaid_unavailable",
          isAvailable: false,
          city: "Delhi",
          state: "Delhi",
          country: "India",
          codAvailable: true,
          prepaidAvailable: false,
          estDeliveryDays: 2,
          source:
            "storefront",
        }),
      });
    });

    it("returns full availability details and logs a valid active pincode", async () => {
      dbMock.pincode.findUnique.mockResolvedValue(
        {
          id: "pincode-1",
          shopId:
            "shop-record-1",
          pincode:
            "110001",
          city: "Delhi",
          state: "Delhi",
          country: "India",
          codAvailable: true,
          prepaidAvailable: true,
          estDeliveryDays: 2,
          isActive: true,
        },
      );

      const response =
        await callAction(
          createRequest({
            pincode:
              "110001",
            productId:
              "product-1",
            productHandle:
              "sample-product",
            productTitle:
              "Sample Product",
            source:
              "product-page",
          }),
        );

      expect(response.status).toBe(
        200,
      );

      await expect(
        response.json(),
      ).resolves.toEqual({
        valid: true,
        available: true,
        pincode: "110001",
        message:
          "Delivery is available.",
        codAvailable: true,
        prepaidAvailable: true,
        estDeliveryDays: 2,
        city: "Delhi",
        state: "Delhi",
        country: "India",
        settings:
          defaultSettings,
      });

      expect(
        dbMock.validationLog.create,
      ).toHaveBeenCalledWith({
        data: expect.objectContaining({
          shopId:
            "shop-record-1",
          pincode:
            "110001",
          result:
            "available",
          isAvailable: true,
          city: "Delhi",
          state: "Delhi",
          country: "India",
          productId:
            "product-1",
          productHandle:
            "sample-product",
          productTitle:
            "Sample Product",
          codAvailable: true,
          prepaidAvailable: true,
          estDeliveryDays: 2,
          source:
            "product-page",
          userAgent:
            "Vitest Browser",
        }),
      });
    });

    it("uses the default country when the record country is empty", async () => {
      dbMock.pincode.findUnique.mockResolvedValue(
        {
          id: "pincode-1",
          shopId:
            "shop-record-1",
          pincode:
            "110001",
          city: "Delhi",
          state: "Delhi",
          country: null,
          codAvailable: false,
          prepaidAvailable: true,
          estDeliveryDays: 3,
          isActive: true,
        },
      );

      const response =
        await callAction(
          createRequest({
            pincode:
              "110001",
          }),
        );

      const body =
        await response.json();

      expect(body.country).toBe(
        "India",
      );

      expect(
        dbMock.validationLog.create,
      ).toHaveBeenCalledWith({
        data: expect.objectContaining({
          country: "India",
        }),
      });
    });

    it("uses safe defaults when shop settings do not exist", async () => {
      dbMock.shop.findUnique.mockResolvedValue(
        {
          ...shopRecord,
          settings: null,
        },
      );

      dbMock.pincode.findUnique.mockResolvedValue(
        null,
      );

      const response =
        await callAction(
          createRequest({
            pincode:
              "110001",
          }),
        );

      const body =
        await response.json();

      expect(
        body.settings,
      ).toEqual({
        restrictAddToCart: true,
        restrictBuyNow: true,
        requireValidation: true,
        enableEmbed: true,
        enableBlock: true,
        rememberPincodeDays: 7,
        successMessage:
          "Delivery available for this pincode.",
        failureMessage:
          "Sorry, delivery is not available for this pincode.",
        defaultCountry:
          "India",
      });
    });

    it("continues validation when analytics logging fails", async () => {
      dbMock.pincode.findUnique.mockResolvedValue(
        {
          id: "pincode-1",
          shopId:
            "shop-record-1",
          pincode:
            "110001",
          city: "Delhi",
          state: "Delhi",
          country: "India",
          codAvailable: true,
          prepaidAvailable: true,
          estDeliveryDays: 2,
          isActive: true,
        },
      );

      dbMock.validationLog.create.mockRejectedValue(
        new Error(
          "Analytics database failure",
        ),
      );

      const response =
        await callAction(
          createRequest({
            pincode:
              "110001",
          }),
        );

      expect(response.status).toBe(
        200,
      );

      const body =
        await response.json();

      expect(body.valid).toBe(true);
      expect(body.available).toBe(true);
    });

    it("does not expose internal database errors", async () => {
      dbMock.shop.findUnique.mockRejectedValue(
        new Error(
          "postgres password=secret database failure",
        ),
      );

      const response =
        await callAction(
          createRequest({
            pincode:
              "110001",
          }),
        );

      expect(response.status).toBe(
        500,
      );

      const body =
        await response.json();

      expect(body).toEqual({
        valid: false,
        available: false,
        message:
          "Pincode validation could not be completed. Please try again.",
        settings: null,
      });

      expect(
        JSON.stringify(body),
      ).not.toContain(
        "password=secret",
      );
    });

    it("does not return a pincode belonging to a different shop", async () => {
      dbMock.pincode.findUnique.mockResolvedValue(
        null,
      );

      await callAction(
        createRequest({
          pincode: "400001",
        }),
      );

      expect(
        dbMock.pincode.findUnique,
      ).toHaveBeenCalledWith({
        where: {
          shopId_pincode: {
            shopId:
              "shop-record-1",
            pincode:
              "400001",
          },
        },
      });
    });

    it("normalizes and limits analytics request context", async () => {
      dbMock.pincode.findUnique.mockResolvedValue(
        null,
      );

      await callAction(
        createRequest({
          pincode: "110001",
          productId:
            " product-123 ",
          productHandle:
            " sample-handle ",
          productTitle:
            " Sample Product ",
          source:
            "Product Page Custom",
        }),
      );

      expect(
        dbMock.validationLog.create,
      ).toHaveBeenCalledWith({
        data: expect.objectContaining({
          productId:
            "product-123",
          productHandle:
            "sample-handle",
          productTitle:
            "Sample Product",
          source:
            "product-page-custom",
        }),
      });
    });
  },
);