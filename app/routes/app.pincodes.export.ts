import type { LoaderFunctionArgs } from "react-router";

import prisma from "../db.server";
import { getOrCreateShopByDomain } from "../lib/pincode.server";
import { authenticate } from "../shopify.server";
import { getBillingStatus } from "../lib/billing.server";

function protectSpreadsheetValue(value: string) {
  if (/^[=+\-@]/.test(value)) {
    return `'${value}`;
  }

  return value;
}

function escapeCsvValue(
  value: string | number | boolean | null | undefined,
) {
  if (value === null || value === undefined) {
    return "";
  }

  const stringValue = protectSpreadsheetValue(String(value));

  if (
    stringValue.includes(",") ||
    stringValue.includes('"') ||
    stringValue.includes("\n") ||
    stringValue.includes("\r")
  ) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

function formatExportDate() {
  const now = new Date();

  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export async function loader({
  request,
}: LoaderFunctionArgs) {
  const { billing, session } = await authenticate.admin(request);

  const shop = await getOrCreateShopByDomain(session.shop);

  const billingStatus = await getBillingStatus(
    billing,
    shop.id,
  );

  if (!billingStatus.isPro) {
    return new Response(
      "Pincode export is available on the Pro plan.",
      {
        status: 403,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }

  const pincodes = await prisma.pincode.findMany({
    where: {
      shopId: shop.id,
    },
    select: {
      pincode: true,
      city: true,
      state: true,
      country: true,
      codAvailable: true,
      prepaidAvailable: true,
      estDeliveryDays: true,
      isActive: true,
    },
    orderBy: {
      pincode: "asc",
    },
  });

  const headers = [
    "pincode",
    "city",
    "state",
    "country",
    "cod_available",
    "prepaid_available",
    "est_delivery_days",
    "is_active",
  ];

  const rows = pincodes.map((record) =>
    [
      record.pincode,
      record.city ?? "",
      record.state ?? "",
      record.country ?? "",
      record.codAvailable,
      record.prepaidAvailable,
      record.estDeliveryDays ?? "",
      record.isActive,
    ]
      .map(escapeCsvValue)
      .join(","),
  );

  const csv = [
    headers.join(","),
    ...rows,
  ].join("\r\n");

  const filename = `pincodes-${formatExportDate()}.csv`;

  return new Response(`\uFEFF${csv}`, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}