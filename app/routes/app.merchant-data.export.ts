import type { LoaderFunctionArgs } from "react-router";
import prisma from "../db.server";
import { authenticate } from "../shopify.server";
import { getOrCreateShopByDomain } from "../lib/pincode.server";

const columns = [
  "id", "pincode", "result", "available", "city", "state", "country",
  "product_id", "product_handle", "product_title", "cod_available",
  "prepaid_available", "estimated_delivery_days", "source",
  "user_agent", "created_at",
];

function csvCell(value: unknown): string {
  if (value == null) return "";
  let text = value instanceof Date ? value.toISOString() : String(value);
  // Guard against spreadsheet formula injection, including after leading whitespace.
  if (/^\s*[=+@\-]/.test(text)) text = "'" + text;
  return /[",\r\n]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
}

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const shop = await getOrCreateShopByDomain(session.shop);

  // The authenticated session determines the tenant. Never accept shopId
  // from query parameters; no plan check is used for this basic export.
  const records = await prisma.validationLog.findMany({
    where: { shopId: shop.id },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    select: {
      id: true, pincode: true, result: true, isAvailable: true,
      city: true, state: true, country: true, productId: true,
      productHandle: true, productTitle: true, codAvailable: true,
      prepaidAvailable: true, estDeliveryDays: true, source: true,
      userAgent: true, createdAt: true,
    },
  });

  const rows = records.map((row) => [
    row.id, row.pincode, row.result, row.isAvailable, row.city,
    row.state, row.country, row.productId, row.productHandle,
    row.productTitle, row.codAvailable, row.prepaidAvailable,
    row.estDeliveryDays, row.source, row.userAgent, row.createdAt,
  ]);
  const csv = "\uFEFF" + [columns, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="merchant-validation-data.csv"',
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
