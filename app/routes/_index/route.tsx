import type { LoaderFunctionArgs } from "react-router";
import { redirect } from "react-router";
import styles from "./styles.module.css";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  if (url.searchParams.get("shop") || url.searchParams.get("host")) {
    throw redirect(`/app?${url.searchParams.toString()}`);
  }
  return null;
};

export default function Index() {
  return (
    <main className={styles.index}>
      <div className={styles.content}>
        <h1 className={styles.heading}>Auxeva Pincode Validator Pro</h1>
        <p className={styles.text}>
          Check delivery availability by Indian pincode on your Shopify storefront.
          Manage serviceable pincodes, delivery estimates, COD and prepaid availability.
        </p>
        <p className={styles.text}>
          To install or open the app, use its listing in the Shopify App Store
          or launch it from Apps in your Shopify admin.
        </p>
        <p className={styles.text}>
          Support: <a href="/support">Help centre</a> ·{" "}
          <a href="/privacy">Privacy policy</a> ·{" "}
          <a href="/terms">Terms of service</a>
        </p>
      </div>
    </main>
  );
}
