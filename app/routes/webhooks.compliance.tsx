import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const loader = async () => {
  return Response.json(
    {
      message: "Method not allowed. This endpoint accepts Shopify webhook POST requests only.",
    },
    {
      status: 405,
      headers: {
        Allow: "POST",
      },
    },
  );
};

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const { topic, shop } = await authenticate.webhook(request);

    console.log(`Received ${topic} compliance webhook for ${shop}`);

    switch (topic) {
      case "CUSTOMERS_DATA_REQUEST": {
        /*
         * This app currently does not store customer-specific personal data.
         *
         * If customer data is stored in the future, retrieve it here and
         * process the merchant's customer data request.
         */
        break;
      }

      case "CUSTOMERS_REDACT": {
        /*
         * This app currently does not store customer-specific personal data.
         *
         * If customer-level records are added later, delete or anonymize them
         * here.
         */
        break;
      }

      case "SHOP_REDACT": {
        /*
         * Delete all data belonging to the store.
         *
         * AppSetting, Pincode and ValidationLog records are automatically
         * deleted because the Prisma relationships use onDelete: Cascade.
         */
        await db.$transaction([
          db.session.deleteMany({
            where: {
              shop,
            },
          }),

          db.shop.deleteMany({
            where: {
              shopDomain: shop,
            },
          }),
        ]);

        console.log(`Deleted stored data for ${shop}`);
        break;
      }

      default: {
        console.warn(`Unhandled compliance webhook topic: ${topic}`);
      }
    }

    return new Response(null, {
      status: 200,
    });
  } catch (error) {
    console.error("Compliance webhook processing failed:", error);

    return new Response(null, {
      status: 500,
    });
  }
};