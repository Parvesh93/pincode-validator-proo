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

    let body: unknown;

    try {
      body = await request.json();
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

    const pincode =
      typeof body === "object" &&
      body !== null &&
      "pincode" in body
        ? String(
            (
              body as {
                pincode?: unknown;
              }
            ).pincode ?? "",
          ).trim()
        : "";

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

    if (
      !record ||
      !record.isActive ||
      !record.prepaidAvailable
    ) {
      return Response.json(
        unavailableResponse({
          pincode,
          message:
            settings.failureMessage,
          settings,
          city:
            record?.city ?? null,
          state:
            record?.state ?? null,
          country:
            record?.country ??
            settings.defaultCountry,
        }),
      );
    }

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
      city: record.city,
      state: record.state,
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