import type { LoaderFunctionArgs } from "react-router";
import { Link, useLoaderData } from "react-router";
import prisma from "../db.server";
import { authenticate } from "../shopify.server";
import { getOrCreateShopByDomain } from "../lib/pincode.server";

// Minimal raw-data access for all merchants; this route does not expose
// paid log searching, filtering, charts, or analytic summaries.
export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const shop = await getOrCreateShopByDomain(session.shop);
  const count = await prisma.validationLog.count({ where: { shopId: shop.id } });
  return { count };
}

export default function MerchantDataAccess() {
  const { count } = useLoaderData<typeof loader>();
  return (
    <s-page heading="Merchant Data Access">
      <s-section heading="Your store's validation data">
        <s-paragraph>
          Download the raw pincode validation activity collected through your
          storefront. This access is available on Free and Pro plans.
        </s-paragraph>
        <s-paragraph>
          Stored validation records: {count}. The download includes the entered
          pincode, validation result, location fields when available, product
          context, COD and prepaid availability, estimated delivery days,
          source, browser user agent, and time of validation.
        </s-paragraph>
        <s-paragraph>
          This is a basic data-access export, not the Pro Validation Logs
          dashboard or Analytics. The downloaded file may contain data entered
          by shoppers; store it securely and share it only with authorised people.
        </s-paragraph>
        <s-button href="/app/merchant-data/export" target="_self">
          Download raw validation data (CSV)
        </s-button>
      </s-section>
      <s-section heading="Privacy and help">
        <s-paragraph>
          For how data is used, stored, and deleted, see the{" "}
          <a href="/privacy" target="_blank" rel="noreferrer">Privacy Policy</a>.
          If you need additional assistance, visit{" "}
          <a href="/support" target="_blank" rel="noreferrer">Support</a>.
        </s-paragraph>
        <s-paragraph>
          <Link to="/app">Return to Dashboard</Link>
        </s-paragraph>
      </s-section>
    </s-page>
  );
}
