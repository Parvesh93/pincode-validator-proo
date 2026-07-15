import type { ActionFunctionArgs } from "react-router";

import db from "../db.server";
import { authenticate } from "../shopify.server";

type StorefrontSettings = {
  restrictAddToCart: boolean;
  restrictBuyNow: boolean;
  requireValidation: boolean;
  enableEmbed: boolean;
  enableBlock: boolean;
  rememberPincodeDays: number;
  successMessage: string;
  failureMessage: string;
  defaultCountry: string;
};

type ValidationRequestBody = {
  pincode?: unknown;
  productId?: unknown;
  productHandle?: unknown;
  productTitle?: unknown;
  source?: unknown;
};

type ValidationLogInput = {
  shopId: string;
  pincode: string;
  result: string;
  isAvailable: boolean;

  city?: string | null;
  state?: string | null;
  country?: string | null;

  productId?: string | null;
  productHandle?: string | null;
  productTitle?: string | null;

  codAvailable?: boolean;
  prepaidAvailable?: boolean;
  estDeliveryDays?: number | null;

  source?: string | null;
  userAgent?: string | null;
};

function getStorefrontSettings(
  settings:
    | {
        restrictAddToCart?: boolean | null;
        restrictBuyNow?: boolean | null;
        requireValidation?: boolean | null;
        enableEmbed?: boolean | null;
        enableBlock?: boolean | null;
        rememberPincodeDays?: number | null;
        successMessage?: string | null;
        failureMessage?: string | null;
        defaultCountry?: string | null;
      }
    | null
    | undefined,
): StorefrontSettings {
  return {
    restrictAddToCart:
      settings?.restrictAddToCart ?? true,

    restrictBuyNow:
      settings?.restrictBuyNow ?? true,

    requireValidation:
      settings?.requireValidation ?? true,

    enableEmbed:
      settings?.enableEmbed ?? true,

    enableBlock:
      settings?.enableBlock ?? true,

    rememberPincodeDays:
      settings?.rememberPincodeDays ?? 7,

    successMessage:
      settings?.successMessage?.trim() ||
      "Delivery available for this pincode.",

    failureMessage:
      settings?.failureMessage?.trim() ||
      "Sorry, delivery is not available for this pincode.",

    defaultCountry:
      settings?.defaultCountry?.trim() ||
      "India",
  };
}

function unavailableResponse({
  pincode,
  message,
  settings,
  city = null,
  state = null,
  country,
}: {
  pincode: string;
  message: string;
  settings: StorefrontSettings;
  city?: string | null;
  state?: string | null;
  country?: string | null;
}) {
  return {
    valid: false,
    available: false,
    pincode,
    message,
    codAvailable: false,
    prepaidAvailable: false,
    estDeliveryDays: null,
    city,
    state,
    country:
      country ||
      settings.defaultCountry,
    settings,
  };
}

function normalizeOptionalString(
  value: unknown,
  maximumLength = 255,
): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();

  if (!normalized) {
    return null;
  }

  return normalized.slice(
    0,
    maximumLength,
  );
}

function normalizeSource(
  value: unknown,
): string {
  const source = normalizeOptionalString(
    value,
    50,
  );

  if (!source) {
    return "storefront";
  }

  /*
   * Keep the value predictable and suitable
   * for future analytics filtering.
   */
  return source
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-")
    .slice(0, 50);
}

function getUserAgent(
  request: Request,
): string | null {
  const userAgent =
    request.headers.get("user-agent");

  return normalizeOptionalString(
    userAgent,
    500,
  );
}

/**
 * Analytics should never interrupt storefront validation.
 *
 * If logging fails because of a temporary database issue,
 * the customer must still receive the correct validation
 * response.
 */
async function createValidationLog(
  input: ValidationLogInput,
) {
  try {
    await db.validationLog.create({
      data: {
        shopId: input.shopId,
        pincode: input.pincode,

        city: input.city ?? null,
        state: input.state ?? null,
        country: input.country ?? null,

        productId:
          input.productId ?? null,

        productHandle:
          input.productHandle ?? null,

        productTitle:
          input.productTitle ?? null,

        codAvailable:
          input.codAvailable ?? false,

        prepaidAvailable:
          input.prepaidAvailable ?? false,

        estDeliveryDays:
          input.estDeliveryDays ?? null,

        result: input.result,

        isAvailable:
          input.isAvailable,

        source:
          input.source || "storefront",

        userAgent:
          input.userAgent ?? null,
      },
    });
  } catch (error: unknown) {
    console.error(
      "Validation analytics logging failed:",
      error,
    );
  }
}

export async function action({
  request,
}: ActionFunctionArgs) {
  try {
    const { session } =
      await authenticate.public.appProxy(
        request,
      );

    if (!session?.shop) {
      return Response.json(
        {
          valid: false,
          available: false,
          message: "Shop not found",
          settings: null,
        },
        {
          status: 400,
        },
      );
    }

    let body: ValidationRequestBody;

    try {
      body =
        (await request.json()) as ValidationRequestBody;
    } catch {
      return Response.json(
        {
          valid: false,
          available: false,
          message:
            "Invalid request body",
          settings: null,
        },
        {
          status: 400,
        },
      );
    }

    const pincode = String(
      body?.pincode ?? "",
    ).trim();

    const productId =
      normalizeOptionalString(
        body?.productId,
        100,
      );

    const productHandle =
      normalizeOptionalString(
        body?.productHandle,
        255,
      );

    const productTitle =
      normalizeOptionalString(
        body?.productTitle,
        255,
      );

    const source =
      normalizeSource(body?.source);

    const userAgent =
      getUserAgent(request);

    const shopRecord =
      await db.shop.findUnique({
        where: {
          shopDomain:
            session.shop,
        },
        include: {
          settings: true,
        },
      });

    if (!shopRecord) {
      return Response.json(
        {
          valid: false,
          available: false,
          message:
            "Shop record not found",
          settings: null,
        },
        {
          status: 404,
        },
      );
    }

    const settings =
      getStorefrontSettings(
        shopRecord.settings,
      );

    /*
     * The storefront script may send an empty pincode
     * request only to retrieve current settings.
     *
     * Do not record that request as a validation because
     * it would inflate the analytics totals.
     */
    if (!pincode) {
      return Response.json(
        unavailableResponse({
          pincode: "",
          message:
            "Pincode is required",
          settings,
          country:
            settings.defaultCountry,
        }),
        {
          status: 400,
        },
      );
    }

    if (
      !/^[1-9][0-9]{5}$/.test(
        pincode,
      )
    ) {
      await createValidationLog({
        shopId: shopRecord.id,
        pincode,
        result: "invalid",
        isAvailable: false,

        country:
          settings.defaultCountry,

        productId,
        productHandle,
        productTitle,

        codAvailable: false,
        prepaidAvailable: false,
        estDeliveryDays: null,

        source,
        userAgent,
      });

      return Response.json(
        unavailableResponse({
          pincode,
          message:
            "Please enter a valid 6-digit Indian pincode",
          settings,
          country:
            settings.defaultCountry,
        }),
        {
          status: 400,
        },
      );
    }

    const record =
      await db.pincode.findUnique({
        where: {
          shopId_pincode: {
            shopId:
              shopRecord.id,
            pincode,
          },
        },
      });

    if (!record) {
      await createValidationLog({
        shopId: shopRecord.id,
        pincode,
        result: "unavailable",
        isAvailable: false,

        city: null,
        state: null,
        country:
          settings.defaultCountry,

        productId,
        productHandle,
        productTitle,

        codAvailable: false,
        prepaidAvailable: false,
        estDeliveryDays: null,

        source,
        userAgent,
      });

      return Response.json(
        unavailableResponse({
          pincode,
          message:
            settings.failureMessage,
          settings,
          city: null,
          state: null,
          country:
            settings.defaultCountry,
        }),
      );
    }

    if (!record.isActive) {
      await createValidationLog({
        shopId: shopRecord.id,
        pincode,
        result: "inactive",
        isAvailable: false,

        city:
          record.city ?? null,

        state:
          record.state ?? null,

        country:
          record.country ??
          settings.defaultCountry,

        productId,
        productHandle,
        productTitle,

        codAvailable:
          record.codAvailable,

        prepaidAvailable:
          record.prepaidAvailable,

        estDeliveryDays:
          record.estDeliveryDays ?? null,

        source,
        userAgent,
      });

      return Response.json(
        unavailableResponse({
          pincode,
          message:
            settings.failureMessage,
          settings,
          city:
            record.city ?? null,
          state:
            record.state ?? null,
          country:
            record.country ??
            settings.defaultCountry,
        }),
      );
    }

    if (!record.prepaidAvailable) {
      await createValidationLog({
        shopId: shopRecord.id,
        pincode,
        result:
          "prepaid_unavailable",
        isAvailable: false,

        city:
          record.city ?? null,

        state:
          record.state ?? null,

        country:
          record.country ??
          settings.defaultCountry,

        productId,
        productHandle,
        productTitle,

        codAvailable:
          record.codAvailable,

        prepaidAvailable: false,

        estDeliveryDays:
          record.estDeliveryDays ?? null,

        source,
        userAgent,
      });

      return Response.json(
        unavailableResponse({
          pincode,
          message:
            settings.failureMessage,
          settings,
          city:
            record.city ?? null,
          state:
            record.state ?? null,
          country:
            record.country ??
            settings.defaultCountry,
        }),
      );
    }

    await createValidationLog({
      shopId: shopRecord.id,
      pincode,
      result: "available",
      isAvailable: true,

      city:
        record.city ?? null,

      state:
        record.state ?? null,

      country:
        record.country ??
        settings.defaultCountry,

      productId,
      productHandle,
      productTitle,

      codAvailable:
        record.codAvailable,

      prepaidAvailable:
        record.prepaidAvailable,

      estDeliveryDays:
        record.estDeliveryDays ?? null,

      source,
      userAgent,
    });

    return Response.json({
      valid: true,
      available: true,

      pincode:
        record.pincode,

      message:
        settings.successMessage,

      codAvailable:
        record.codAvailable,

      prepaidAvailable:
        record.prepaidAvailable,

      estDeliveryDays:
        record.estDeliveryDays,

      city:
        record.city,

      state:
        record.state,

      country:
        record.country ??
        settings.defaultCountry,

      settings,
    });
  } catch (error: unknown) {
    console.error(
      "Storefront pincode validation failed:",
      error,
    );

    return Response.json(
      {
        valid: false,
        available: false,
        message:
          "Pincode validation could not be completed. Please try again.",
        settings: null,
      },
      {
        status: 500,
      },
    );
  }
}