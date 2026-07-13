
import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import {
  Link,
  Outlet,
  useLoaderData,
  useRouteError,
} from "react-router";

import { boundary } from "@shopify/shopify-app-react-router/server";
import { AppProvider } from "@shopify/shopify-app-react-router/react";

import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);

  return {
    apiKey: process.env.SHOPIFY_API_KEY || "",
  };
};

export default function App() {
  const { apiKey } = useLoaderData<typeof loader>();

  return (
    <AppProvider embedded apiKey={apiKey}>
      <nav
        style={{
          display: "flex",
          gap: "1rem",
          padding: "1rem 1.5rem",
          borderBottom: "1px solid #e1e3e5",
          background: "#ffffff",
        }}
      >
        <Link to="/app">
          Dashboard
        </Link>

        <Link to="/app/pincodes">
          Manage Pincodes
        </Link>

        <Link to="/app/import">
          Import CSV
        </Link>

        <Link to="/app/settings">
          Settings
        </Link>
      </nav>

      <Outlet />
    </AppProvider>
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};

