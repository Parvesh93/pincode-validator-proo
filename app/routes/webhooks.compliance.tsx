import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const loader = async () => {
  return Response.json(
    {
      message:
        "Method not allowed. This endpoint accepts Shopify webhook POST requests only.",
    },
    {
      status: 405,
      headers: {
        Allow: "POST",
      },
    },
  );
};

export const action = async ({
  request,
}: ActionFunctionArgs) => {
  try {
    /*
     * authenticate.webhook verifies the Shopify HMAC before
     * returning the webhook topic and shop.
     *
     * Do not read request.json() or request.text() before this.
     */
    const { topic, shop } =
      await authenticate.webhook(request);

    console.log(
      `Received ${topic} compliance webhook for ${shop}`,
    );

    switch (topic) {
      case "CUSTOMERS_DATA_REQUEST": {
        /*
         * The app currently does not store customer-specific
         * personal data, so there is nothing to return.
         */
        break;
      }

      case "CUSTOMERS_REDACT": {
        /*
         * The app currently does not store customer-specific
         * personal data, so there is nothing to remove.
         */
        break;
      }

      case "SHOP_REDACT": {
        /*
         * Delete the sessions and Shop record.
         *
         * Related AppSetting, Pincode and ValidationLog records
         * should be removed through Prisma cascade relationships.
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

        console.log(
          `Deleted stored data for ${shop}`,
        );

        break;
      }

      default: {
        console.warn(
          `Unhandled compliance webhook topic: ${topic}`,
        );
      }
    }

    return new Response(null, {
      status: 200,
    });
  } catch (error) {
    /*
     * Invalid HMAC requests are rejected by
     * authenticate.webhook() using an HTTP Response, normally 401.
     *
     * Return that Response unchanged so Shopify receives the
     * expected Unauthorized status during its automated check.
     */
    if (error instanceof Response) {
      return error;
    }

    console.error(
      "Compliance webhook processing failed:",
      error,
    );

    return new Response(null, {
      status: 500,
    });
  }
};