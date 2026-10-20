import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { redirect } from "react-router";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  // Shopify initiates installs and launches from its own admin surfaces.
  // Never prompt merchants to enter an arbitrary shop domain.
  if (url.searchParams.has("shop") || url.searchParams.has("host")) {
    throw redirect(`/app?${url.searchParams.toString()}`);
  }
  throw redirect("/");
};

export const action = async (_args: ActionFunctionArgs) => {
  return new Response("Open this app from the Shopify App Store or Shopify admin.", {
    status: 405,
    headers: { Allow: "GET" },
  });
};

export default function AuthLogin() {
  return null;
}
