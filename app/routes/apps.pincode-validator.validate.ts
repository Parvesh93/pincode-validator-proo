// import type { ActionFunctionArgs } from "react-router";
// import { authenticate } from "../shopify.server";
// import db from "../db.server";

// export async function action({ request }: ActionFunctionArgs) {
//   try {
//     const { session } = await authenticate.public.appProxy(request);
//     const body = await request.json();
//     const pincode = String(body?.pincode || "").trim();

//     if (!session?.shop) {
//       return Response.json({ valid: false, message: "Shop not found" }, { status: 400 });
//     }

//     if (!pincode) {
//       return Response.json({ valid: false, message: "Pincode is required" }, { status: 400 });
//     }

//     const shopRecord = await db.shop.findUnique({
//       where: { shopDomain: session.shop },
//       include: { settings: true },
//     });

//     if (!shopRecord) {
//       return Response.json({ valid: false, message: "Shop record not found" }, { status: 404 });
//     }

//     const record = await db.pincode.findUnique({
//       where: {
//         shopId_pincode: {
//           shopId: shopRecord.id,
//           pincode,
//         },
//       },
//     });

//     if (!record || !record.isActive) {
//       return Response.json({
//         valid: false,
//         message: shopRecord.settings?.failureMessage || "Delivery not available for this pincode",
//       });
//     }

//     return Response.json({
//       valid: true,
//       message: shopRecord.settings?.successMessage || "Delivery available",
//       pincode: record.pincode,
//       codAvailable: record.codAvailable,
//       prepaidAvailable: record.prepaidAvailable,
//       estDeliveryDays: record.estDeliveryDays,
//     });
//   } catch (error: unknown) {
//     const errorMessage = error instanceof Error ? error.message : "Validation failed";
//     return Response.json(
//       { valid: false, message: errorMessage },
//       { status: 500 },
//     );
//   }
// }



import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export async function action({ request }: ActionFunctionArgs) {
  try {
    const { session } = await authenticate.public.appProxy(request);
    const body = await request.json();
    const pincode = String(body?.pincode || "").trim();

    if (!session?.shop) {
      return Response.json(
        {
          valid: false,
          message: "Shop not found",
          settings: null,
        },
        { status: 400 },
      );
    }

    const shopRecord = await db.shop.findUnique({
      where: { shopDomain: session.shop },
      include: { settings: true },
    });

    if (!shopRecord) {
      return Response.json(
        {
          valid: false,
          message: "Shop record not found",
          settings: null,
        },
        { status: 404 },
      );
    }

    const settings = {
      restrictAddToCart: shopRecord.settings?.restrictAddToCart ?? true,
      restrictBuyNow: shopRecord.settings?.restrictBuyNow ?? true,
      requireValidation: shopRecord.settings?.requireValidation ?? true,
      enableEmbed: shopRecord.settings?.enableEmbed ?? true,
      enableBlock: shopRecord.settings?.enableBlock ?? true,
      rememberPincodeDays: shopRecord.settings?.rememberPincodeDays ?? 7,
      successMessage:
        shopRecord.settings?.successMessage ||
        "Delivery available for this pincode.",
      failureMessage:
        shopRecord.settings?.failureMessage ||
        "Sorry, delivery is not available for this pincode.",
      defaultCountry: shopRecord.settings?.defaultCountry || "India",
    };

    if (!pincode) {
      return Response.json(
        {
          valid: false,
          available: false,
          pincode: "",
          message: "Pincode is required",
          codAvailable: false,
          prepaidAvailable: false,
          estDeliveryDays: null,
          city: null,
          state: null,
          country: settings.defaultCountry,
          settings,
        },
        { status: 400 },
      );
    }

    if (!/^[0-9]{6}$/.test(pincode)) {
      return Response.json(
        {
          valid: false,
          available: false,
          pincode,
          message: "Please enter a valid 6-digit pincode",
          codAvailable: false,
          prepaidAvailable: false,
          estDeliveryDays: null,
          city: null,
          state: null,
          country: settings.defaultCountry,
          settings,
        },
        { status: 400 },
      );
    }

    const record = await db.pincode.findUnique({
      where: {
        shopId_pincode: {
          shopId: shopRecord.id,
          pincode,
        },
      },
    });

    if (!record || !record.isActive || !record.prepaidAvailable) {
      return Response.json({
        valid: false,
        available: false,
        pincode,
        message: settings.failureMessage,
        codAvailable: false,
        prepaidAvailable: false,
        estDeliveryDays: null,
        city: record?.city ?? null,
        state: record?.state ?? null,
        country: record?.country ?? settings.defaultCountry,
        settings,
      });
    }

    return Response.json({
      valid: true,
      available: true,
      pincode: record.pincode,
      message: settings.successMessage,
      codAvailable: record.codAvailable,
      prepaidAvailable: record.prepaidAvailable,
      estDeliveryDays: record.estDeliveryDays,
      city: record.city,
      state: record.state,
      country: record.country ?? settings.defaultCountry,
      settings,
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Validation failed";

    return Response.json(
      {
        valid: false,
        available: false,
        message: errorMessage,
        settings: null,
      },
      { status: 500 },
    );
  }
}