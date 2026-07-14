import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const { shop, topic } = await authenticate.webhook(request);

    console.log(`Webhook received: ${topic} from ${shop}`);

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

    console.log(`Deleted all stored data for ${shop}`);

    return new Response(null, {
      status: 200,
    });
  } catch (error) {
    console.error("App uninstall webhook failed:", error);

    return new Response(null, {
      status: 500,
    });
  }
};