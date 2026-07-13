import type { ActionFunctionArgs } from "react-router";
import db from "../db.server";

export async function action({ request }: ActionFunctionArgs) {
  try {
    const body = await request.json();
    const { shop, pincode } = body;

    if (!shop || !pincode) {
      return Response.json(
        { error: "shop and pincode are required" },
        { status: 400 }
      );
    }

    const shopRecord = await db.shop.findUnique({
      where: { shopDomain: shop },
      include: { settings: true },
    });

    if (!shopRecord) {
      return Response.json(
        { valid: false, message: "Shop not found" },
        { status: 404 }
      );
    }

    const record = await db.pincode.findUnique({
      where: {
        shopId_pincode: {
          shopId: shopRecord.id,
          pincode: pincode.trim(),
        },
      },
    });

    if (!record || !record.isActive) {
      return Response.json({
        valid: false,
        message:
          shopRecord.settings?.failureMessage ||
          "Delivery not available for this pincode",
      });
    }

    return Response.json({
      valid: true,
      message:
        shopRecord.settings?.successMessage ||
        "Delivery available",
      pincode: record.pincode,
      codAvailable: record.codAvailable,
      prepaidAvailable: record.prepaidAvailable,
      estDeliveryDays: record.estDeliveryDays,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Validation failed";
    return Response.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}