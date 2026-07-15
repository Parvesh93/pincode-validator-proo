import type { LoaderFunctionArgs } from "react-router";

import { authenticate } from "../shopify.server";
import { getOrCreateShopByDomain } from "../lib/pincode.server";

import {
  getValidationLogsForExport,
  type AvailabilityFilter,
  type BooleanAvailabilityFilter,
  type ValidationLogSort,
} from "../lib/validation-logs.server";

function parseAvailabilityFilter(
  value: string | null,
): AvailabilityFilter {
  if (
    value === "available" ||
    value === "unavailable"
  ) {
    return value;
  }

  return "all";
}

function parseBooleanAvailabilityFilter(
  value: string | null,
): BooleanAvailabilityFilter {
  if (
    value === "yes" ||
    value === "no"
  ) {
    return value;
  }

  return "all";
}

function parseValidationSort(
  value: string | null,
): ValidationLogSort {
  return value === "oldest"
    ? "oldest"
    : "newest";
}

function escapeCsvValue(
  value: unknown,
): string {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  let normalizedValue: string;

  if (value instanceof Date) {
    normalizedValue =
      value.toISOString();
  } else if (
    typeof value === "boolean"
  ) {
    normalizedValue = value
      ? "true"
      : "false";
  } else {
    normalizedValue =
      String(value);
  }

  /*
   * Prevent spreadsheet formula injection.
   *
   * Values beginning with =, +, -, or @ can be
   * interpreted as formulas by Excel and similar
   * spreadsheet applications.
   */
  if (
    /^[=+\-@]/.test(
      normalizedValue,
    )
  ) {
    normalizedValue =
      `'${normalizedValue}`;
  }

  if (
    normalizedValue.includes(",") ||
    normalizedValue.includes('"') ||
    normalizedValue.includes("\n") ||
    normalizedValue.includes("\r")
  ) {
    return `"${normalizedValue.replace(
      /"/g,
      '""',
    )}"`;
  }

  return normalizedValue;
}

function getExportFilename() {
  const now = new Date();

  const datePart =
    now
      .toISOString()
      .slice(0, 10);

  return `validation-logs-${datePart}.csv`;
}

export async function loader({
  request,
}: LoaderFunctionArgs) {
  const { session } =
    await authenticate.admin(
      request,
    );

  const shop =
    await getOrCreateShopByDomain(
      session.shop,
    );

  const url = new URL(
    request.url,
  );

  const logs =
    await getValidationLogsForExport({
      shopId: shop.id,

      search:
        url.searchParams.get(
          "search",
        ) || "",

      result:
        url.searchParams.get(
          "result",
        ) || "all",

      availability:
        parseAvailabilityFilter(
          url.searchParams.get(
            "availability",
          ),
        ),

      cod:
        parseBooleanAvailabilityFilter(
          url.searchParams.get(
            "cod",
          ),
        ),

      prepaid:
        parseBooleanAvailabilityFilter(
          url.searchParams.get(
            "prepaid",
          ),
        ),

      startDate:
        url.searchParams.get(
          "startDate",
        ) || "",

      endDate:
        url.searchParams.get(
          "endDate",
        ) || "",

      sort:
        parseValidationSort(
          url.searchParams.get(
            "sort",
          ),
        ),
    });

  const headings = [
    "id",
    "pincode",
    "result",
    "available",
    "city",
    "state",
    "country",
    "product_id",
    "product_handle",
    "product_title",
    "cod_available",
    "prepaid_available",
    "estimated_delivery_days",
    "source",
    "created_at",
  ];

  const rows = logs.map(
    (log) => [
      log.id,
      log.pincode,
      log.result,
      log.isAvailable,
      log.city,
      log.state,
      log.country,
      log.productId,
      log.productHandle,
      log.productTitle,
      log.codAvailable,
      log.prepaidAvailable,
      log.estDeliveryDays,
      log.source,
      log.createdAt,
    ],
  );

  const csvLines = [
    headings.map(
      escapeCsvValue,
    ),

    ...rows.map((row) =>
      row.map(
        escapeCsvValue,
      ),
    ),
  ].map((row) =>
    row.join(","),
  );

  /*
   * UTF-8 BOM improves compatibility with Excel,
   * particularly when exported text contains
   * non-English characters.
   */
  const csvContent =
    `\uFEFF${csvLines.join(
      "\r\n",
    )}`;

  return new Response(
    csvContent,
    {
      status: 200,

      headers: {
        "Content-Type":
          "text/csv; charset=utf-8",

        "Content-Disposition":
          `attachment; filename="${getExportFilename()}"`,

        "Cache-Control":
          "no-store, no-cache, must-revalidate",

        Pragma: "no-cache",

        Expires: "0",

        "X-Content-Type-Options":
          "nosniff",
      },
    },
  );
}