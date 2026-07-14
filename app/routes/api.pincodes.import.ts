
import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { parsePincodeCsv } from "../lib/csv.server";
import { getOrCreateShopByDomain } from "../lib/pincode.server";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_CSV_ROWS = 50000;
const MAX_INVALID_ROWS_IN_RESPONSE = 100;

export async function action({ request }: ActionFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const shop = await getOrCreateShopByDomain(session.shop);

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const mode = String(formData.get("mode") || "append");

    if (!(file instanceof File)) {
      return Response.json(
        {
          error: "Please select a CSV file to import.",
        },
        {
          status: 400,
        },
      );
    }

    if (!["append", "replace"].includes(mode)) {
      return Response.json(
        {
          error: "Invalid import mode.",
        },
        {
          status: 400,
        },
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return Response.json(
        {
          error: "The CSV file cannot be larger than 5 MB.",
        },
        {
          status: 400,
        },
      );
    }

    const text = await file.text();

    if (!text.trim()) {
      return Response.json(
        {
          error: "The uploaded CSV file is empty.",
        },
        {
          status: 400,
        },
      );
    }

    const { validRows, invalidRows } = parsePincodeCsv(text);
    const totalRows = validRows.length + invalidRows.length;

    if (totalRows > MAX_CSV_ROWS) {
      return Response.json(
        {
          error: `The CSV file contains more than ${MAX_CSV_ROWS.toLocaleString()} rows.`,
        },
        {
          status: 400,
        },
      );
    }

    /*
     * Never delete existing pincodes when the replacement file
     * does not contain any valid rows.
     */
    if (mode === "replace" && validRows.length === 0) {
      return Response.json(
        {
          error:
            "No valid pincodes were found. Your existing pincodes have not been changed.",
          summary: {
            mode,
            totalRows,
            validRows: 0,
            invalidRows: invalidRows.length,
            insertedOrUpdated: 0,
            deletedBeforeImport: 0,
          },
          invalidRows: invalidRows.slice(0, MAX_INVALID_ROWS_IN_RESPONSE),
        },
        {
          status: 400,
        },
      );
    }

    /*
     * For append mode, return a helpful response when there is
     * nothing valid to import.
     */
    if (mode === "append" && validRows.length === 0) {
      return Response.json(
        {
          error: "No valid pincodes were found in the uploaded CSV file.",
          summary: {
            mode,
            totalRows,
            validRows: 0,
            invalidRows: invalidRows.length,
            insertedOrUpdated: 0,
            deletedBeforeImport: 0,
          },
          invalidRows: invalidRows.slice(0, MAX_INVALID_ROWS_IN_RESPONSE),
        },
        {
          status: 400,
        },
      );
    }

    /*
     * The deletion and all pincode upserts happen inside one transaction.
     *
     * If any operation fails, Prisma rolls back the entire transaction,
     * including the deletion performed in replace mode.
     */
    const importResult = await prisma.$transaction(
  async (transaction) => {
    let deletedBeforeImport = 0;

    if (mode === "replace") {
      const deleteResult =
        await transaction.pincode.deleteMany({
          where: {
            shopId: shop.id,
          },
        });

      deletedBeforeImport = deleteResult.count;
    }

    /*
     * Process rows in smaller batches rather than issuing
     * every database query as one long uninterrupted loop.
     */
    const batchSize = 100;

    for (
      let startIndex = 0;
      startIndex < validRows.length;
      startIndex += batchSize
    ) {
      const batch = validRows.slice(
        startIndex,
        startIndex + batchSize,
      );

      await Promise.all(
        batch.map((row) =>
          transaction.pincode.upsert({
            where: {
              shopId_pincode: {
                shopId: shop.id,
                pincode: row.pincode,
              },
            },
            update: {
              city: row.city ?? null,
              state: row.state ?? null,
              country: row.country ?? null,
              codAvailable:
                row.codAvailable,
              prepaidAvailable:
                row.prepaidAvailable,
              estDeliveryDays:
                row.estDeliveryDays ?? null,
              isActive: row.isActive,
              source: row.source,
            },
            create: {
              shopId: shop.id,
              pincode: row.pincode,
              city: row.city ?? null,
              state: row.state ?? null,
              country: row.country ?? null,
              codAvailable:
                row.codAvailable,
              prepaidAvailable:
                row.prepaidAvailable,
              estDeliveryDays:
                row.estDeliveryDays ?? null,
              isActive: row.isActive,
              source: row.source,
            },
          }),
        ),
      );
    }

    return {
      insertedOrUpdated:
        validRows.length,
      deletedBeforeImport,
    };
  },
  {
    maxWait: 10_000,
    timeout: 120_000,
  },
);

    return Response.json({
      success: true,
      message:
        mode === "replace"
          ? "Existing pincodes were safely replaced."
          : "Pincodes were imported successfully.",
      summary: {
        mode,
        totalRows,
        validRows: validRows.length,
        invalidRows: invalidRows.length,
        insertedOrUpdated: importResult.insertedOrUpdated,
        deletedBeforeImport: importResult.deletedBeforeImport,
      },

      /*
       * Avoid sending thousands of invalid rows back to the browser.
       */
      invalidRows: invalidRows.slice(0, MAX_INVALID_ROWS_IN_RESPONSE),
      invalidRowsTruncated:
        invalidRows.length > MAX_INVALID_ROWS_IN_RESPONSE,
    });
  } catch (error: unknown) {
  console.error("Pincode CSV import failed", {
    error,
    message:
      error instanceof Error
        ? error.message
        : "Unknown error",
    stack:
      error instanceof Error
        ? error.stack
        : undefined,
  });

    return Response.json(
      {
        error:
          "The CSV could not be imported. Your existing pincodes have not been changed.",
      },
      {
        status: 500,
      },
    );
  }
}
