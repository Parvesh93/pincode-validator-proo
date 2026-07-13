import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, session, topic } = await authenticate.webhook(request);

  console.log(`Webhook received: ${topic} from ${shop}`);

  if (session) {
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

    console.log(`Deleted all data for ${shop}`);
  }

  return new Response();
};