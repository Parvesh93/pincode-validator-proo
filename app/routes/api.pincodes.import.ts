
// import type { ActionFunctionArgs } from "react-router";
// import { authenticate } from "../shopify.server";
// import prisma from "../db.server";
// import { parsePincodeCsv } from "../lib/csv.server";
// import { getOrCreateShopByDomain } from "../lib/pincode.server";

// const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
// const MAX_CSV_ROWS = 50000;
// const MAX_INVALID_ROWS_IN_RESPONSE = 100;

// export async function action({ request }: ActionFunctionArgs) {
//   const { session } = await authenticate.admin(request);
//   const shop = await getOrCreateShopByDomain(session.shop);

//   try {
//     const formData = await request.formData();
//     const file = formData.get("file");
//     const mode = String(formData.get("mode") || "append");

//     if (!(file instanceof File)) {
//       return Response.json(
//         {
//           error: "Please select a CSV file to import.",
//         },
//         {
//           status: 400,
//         },
//       );
//     }

//     if (!["append", "replace"].includes(mode)) {
//       return Response.json(
//         {
//           error: "Invalid import mode.",
//         },
//         {
//           status: 400,
//         },
//       );
//     }

//     if (file.size > MAX_FILE_SIZE_BYTES) {
//       return Response.json(
//         {
//           error: "The CSV file cannot be larger than 5 MB.",
//         },
//         {
//           status: 400,
//         },
//       );
//     }

//     const text = await file.text();

//     if (!text.trim()) {
//       return Response.json(
//         {
//           error: "The uploaded CSV file is empty.",
//         },
//         {
//           status: 400,
//         },
//       );
//     }

//     const { validRows, invalidRows } = parsePincodeCsv(text);
//     const totalRows = validRows.length + invalidRows.length;

//     if (totalRows > MAX_CSV_ROWS) {
//       return Response.json(
//         {
//           error: `The CSV file contains more than ${MAX_CSV_ROWS.toLocaleString()} rows.`,
//         },
//         {
//           status: 400,
//         },
//       );
//     }

//     /*
//      * Never delete existing pincodes when the replacement file
//      * does not contain any valid rows.
//      */
//     if (mode === "replace" && validRows.length === 0) {
//       return Response.json(
//         {
//           error:
//             "No valid pincodes were found. Your existing pincodes have not been changed.",
//           summary: {
//             mode,
//             totalRows,
//             validRows: 0,
//             invalidRows: invalidRows.length,
//             insertedOrUpdated: 0,
//             deletedBeforeImport: 0,
//           },
//           invalidRows: invalidRows.slice(0, MAX_INVALID_ROWS_IN_RESPONSE),
//         },
//         {
//           status: 400,
//         },
//       );
//     }

//     /*
//      * For append mode, return a helpful response when there is
//      * nothing valid to import.
//      */
//     if (mode === "append" && validRows.length === 0) {
//       return Response.json(
//         {
//           error: "No valid pincodes were found in the uploaded CSV file.",
//           summary: {
//             mode,
//             totalRows,
//             validRows: 0,
//             invalidRows: invalidRows.length,
//             insertedOrUpdated: 0,
//             deletedBeforeImport: 0,
//           },
//           invalidRows: invalidRows.slice(0, MAX_INVALID_ROWS_IN_RESPONSE),
//         },
//         {
//           status: 400,
//         },
//       );
//     }

//     /*
//      * The deletion and all pincode upserts happen inside one transaction.
//      *
//      * If any operation fails, Prisma rolls back the entire transaction,
//      * including the deletion performed in replace mode.
//      */
//     const importResult = await prisma.$transaction(
//   async (transaction) => {
//     let deletedBeforeImport = 0;

//     if (mode === "replace") {
//       const deleteResult =
//         await transaction.pincode.deleteMany({
//           where: {
//             shopId: shop.id,
//           },
//         });

//       deletedBeforeImport = deleteResult.count;
//     }

//     /*
//      * Process rows in smaller batches rather than issuing
//      * every database query as one long uninterrupted loop.
//      */
//     const batchSize = 100;

//     for (
//       let startIndex = 0;
//       startIndex < validRows.length;
//       startIndex += batchSize
//     ) {
//       const batch = validRows.slice(
//         startIndex,
//         startIndex + batchSize,
//       );

//       await Promise.all(
//         batch.map((row) =>
//           transaction.pincode.upsert({
//             where: {
//               shopId_pincode: {
//                 shopId: shop.id,
//                 pincode: row.pincode,
//               },
//             },
//             update: {
//               city: row.city ?? null,
//               state: row.state ?? null,
//               country: row.country ?? null,
//               codAvailable:
//                 row.codAvailable,
//               prepaidAvailable:
//                 row.prepaidAvailable,
//               estDeliveryDays:
//                 row.estDeliveryDays ?? null,
//               isActive: row.isActive,
//               source: row.source,
//             },
//             create: {
//               shopId: shop.id,
//               pincode: row.pincode,
//               city: row.city ?? null,
//               state: row.state ?? null,
//               country: row.country ?? null,
//               codAvailable:
//                 row.codAvailable,
//               prepaidAvailable:
//                 row.prepaidAvailable,
//               estDeliveryDays:
//                 row.estDeliveryDays ?? null,
//               isActive: row.isActive,
//               source: row.source,
//             },
//           }),
//         ),
//       );
//     }

//     return {
//       insertedOrUpdated:
//         validRows.length,
//       deletedBeforeImport,
//     };
//   },
//   {
//     maxWait: 10_000,
//     timeout: 120_000,
//   },
// );

//     return Response.json({
//       success: true,
//       message:
//         mode === "replace"
//           ? "Existing pincodes were safely replaced."
//           : "Pincodes were imported successfully.",
//       summary: {
//         mode,
//         totalRows,
//         validRows: validRows.length,
//         invalidRows: invalidRows.length,
//         insertedOrUpdated: importResult.insertedOrUpdated,
//         deletedBeforeImport: importResult.deletedBeforeImport,
//       },

//       /*
//        * Avoid sending thousands of invalid rows back to the browser.
//        */
//       invalidRows: invalidRows.slice(0, MAX_INVALID_ROWS_IN_RESPONSE),
//       invalidRowsTruncated:
//         invalidRows.length > MAX_INVALID_ROWS_IN_RESPONSE,
//     });
//   } catch (error: unknown) {
//   console.error("Pincode CSV import failed", {
//     error,
//     message:
//       error instanceof Error
//         ? error.message
//         : "Unknown error",
//     stack:
//       error instanceof Error
//         ? error.stack
//         : undefined,
//   });

//     return Response.json(
//       {
//         error:
//           "The CSV could not be imported. Your existing pincodes have not been changed.",
//       },
//       {
//         status: 500,
//       },
//     );
//   }
// }



import type { ActionFunctionArgs } from "react-router";

import { authenticate } from "../shopify.server";
import prisma from "../db.server";

import { parsePincodeCsv } from "../lib/csv.server";

import {
  enforcePincodePlanLimit,
  getOrCreateShopByDomain,
} from "../lib/pincode.server";

import { getBillingStatus } from "../lib/billing.server";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_CSV_ROWS = 50_000;
const MAX_INVALID_ROWS_IN_RESPONSE = 100;
const IMPORT_BATCH_SIZE = 100;

export async function action({
  request,
}: ActionFunctionArgs) {
  const {
    billing,
    session,
  } = await authenticate.admin(request);

  const shop =
    await getOrCreateShopByDomain(
      session.shop,
    );

  try {
    /*
     * CSV import is a Pro-only feature.
     *
     * This server-side check prevents Free-plan merchants
     * from bypassing the UI and calling the API directly.
     */
    const billingStatus =
      await getBillingStatus(
        billing,
        shop.id,
      );

    if (!billingStatus.isPro) {
      return Response.json(
        {
          error:
            "CSV import is available on the Pro plan. Upgrade to Pro to import or replace pincodes in bulk.",
          code: "PRO_REQUIRED",
        },
        {
          status: 403,
        },
      );
    }

    /*
     * Ensure any records previously disabled by the Free
     * plan are restored after the merchant upgrades.
     */
    await enforcePincodePlanLimit({
      shopId: shop.id,
      isPro: true,
    });

    const formData =
      await request.formData();

    const file =
      formData.get("file");

    const mode =
      String(
        formData.get("mode") ||
          "append",
      )
        .trim()
        .toLowerCase();

    if (!(file instanceof File)) {
      return Response.json(
        {
          error:
            "Please select a CSV file to import.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      mode !== "append" &&
      mode !== "replace"
    ) {
      return Response.json(
        {
          error:
            "Invalid import mode.",
        },
        {
          status: 400,
        },
      );
    }

    const fileName =
      file.name.toLowerCase();

    if (
      !fileName.endsWith(".csv")
    ) {
      return Response.json(
        {
          error:
            "Only CSV files are supported.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      file.size >
      MAX_FILE_SIZE_BYTES
    ) {
      return Response.json(
        {
          error:
            "The CSV file cannot be larger than 5 MB.",
        },
        {
          status: 400,
        },
      );
    }

    const text =
      await file.text();

    if (!text.trim()) {
      return Response.json(
        {
          error:
            "The uploaded CSV file is empty.",
        },
        {
          status: 400,
        },
      );
    }

    const {
      validRows,
      invalidRows,
    } = parsePincodeCsv(text);

    const totalRows =
      validRows.length +
      invalidRows.length;

    if (
      totalRows >
      MAX_CSV_ROWS
    ) {
      return Response.json(
        {
          error:
            `The CSV file contains more than ${MAX_CSV_ROWS.toLocaleString()} rows.`,
        },
        {
          status: 400,
        },
      );
    }

    /*
     * Never delete existing pincodes when the replacement
     * file contains no valid records.
     */
    if (
      mode === "replace" &&
      validRows.length === 0
    ) {
      return Response.json(
        {
          error:
            "No valid pincodes were found. Your existing pincodes have not been changed.",

          summary: {
            mode,
            totalRows,
            validRows: 0,
            invalidRows:
              invalidRows.length,
            insertedOrUpdated: 0,
            deletedBeforeImport: 0,
          },

          invalidRows:
            invalidRows.slice(
              0,
              MAX_INVALID_ROWS_IN_RESPONSE,
            ),

          invalidRowsTruncated:
            invalidRows.length >
            MAX_INVALID_ROWS_IN_RESPONSE,
        },
        {
          status: 400,
        },
      );
    }

    /*
     * Return a helpful response for append imports where
     * there is nothing valid to save.
     */
    if (
      mode === "append" &&
      validRows.length === 0
    ) {
      return Response.json(
        {
          error:
            "No valid pincodes were found in the uploaded CSV file.",

          summary: {
            mode,
            totalRows,
            validRows: 0,
            invalidRows:
              invalidRows.length,
            insertedOrUpdated: 0,
            deletedBeforeImport: 0,
          },

          invalidRows:
            invalidRows.slice(
              0,
              MAX_INVALID_ROWS_IN_RESPONSE,
            ),

          invalidRowsTruncated:
            invalidRows.length >
            MAX_INVALID_ROWS_IN_RESPONSE,
        },
        {
          status: 400,
        },
      );
    }

    /*
     * Replace deletion and all upserts happen in one
     * transaction.
     *
     * If any operation fails, Prisma rolls back the entire
     * import, including the replace-mode deletion.
     */
    const importResult =
      await prisma.$transaction(
        async (transaction) => {
          let deletedBeforeImport =
            0;

          if (
            mode === "replace"
          ) {
            const deleteResult =
              await transaction.pincode.deleteMany(
                {
                  where: {
                    shopId:
                      shop.id,
                  },
                },
              );

            deletedBeforeImport =
              deleteResult.count;
          }

          /*
           * Process records in batches to avoid starting
           * every database operation at once.
           */
          for (
            let startIndex = 0;
            startIndex <
            validRows.length;
            startIndex +=
              IMPORT_BATCH_SIZE
          ) {
            const batch =
              validRows.slice(
                startIndex,
                startIndex +
                  IMPORT_BATCH_SIZE,
              );

            await Promise.all(
              batch.map((row) =>
                transaction.pincode.upsert(
                  {
                    where: {
                      shopId_pincode:
                        {
                          shopId:
                            shop.id,

                          pincode:
                            row.pincode,
                        },
                    },

                    update: {
                      city:
                        row.city ??
                        null,

                      state:
                        row.state ??
                        null,

                      country:
                        row.country ??
                        null,

                      codAvailable:
                        row.codAvailable,

                      prepaidAvailable:
                        row.prepaidAvailable,

                      estDeliveryDays:
                        row.estDeliveryDays ??
                        null,

                      isActive:
                        row.isActive,

                      /*
                       * CSV import is available only on Pro,
                       * so imported records cannot remain
                       * restricted by the Free plan.
                       */
                      disabledByPlan:
                        false,

                      source:
                        row.source,
                    },

                    create: {
                      shopId:
                        shop.id,

                      pincode:
                        row.pincode,

                      city:
                        row.city ??
                        null,

                      state:
                        row.state ??
                        null,

                      country:
                        row.country ??
                        null,

                      codAvailable:
                        row.codAvailable,

                      prepaidAvailable:
                        row.prepaidAvailable,

                      estDeliveryDays:
                        row.estDeliveryDays ??
                        null,

                      isActive:
                        row.isActive,

                      disabledByPlan:
                        false,

                      source:
                        row.source,
                    },
                  },
                ),
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

    /*
     * Keep plan state consistent after the transaction.
     * On Pro, this also restores any old plan-disabled rows
     * that may not have been present in the CSV.
     */
    await enforcePincodePlanLimit({
      shopId: shop.id,
      isPro: true,
    });

    return Response.json({
      success: true,

      message:
        mode === "replace"
          ? "Existing pincodes were safely replaced."
          : "Pincodes were imported successfully.",

      summary: {
        mode,
        totalRows,

        validRows:
          validRows.length,

        invalidRows:
          invalidRows.length,

        insertedOrUpdated:
          importResult.insertedOrUpdated,

        deletedBeforeImport:
          importResult.deletedBeforeImport,
      },

      /*
       * Avoid sending thousands of invalid rows back to
       * the browser.
       */
      invalidRows:
        invalidRows.slice(
          0,
          MAX_INVALID_ROWS_IN_RESPONSE,
        ),

      invalidRowsTruncated:
        invalidRows.length >
        MAX_INVALID_ROWS_IN_RESPONSE,
    });
  } catch (error: unknown) {
    console.error(
      "Pincode CSV import failed",
      {
        error,

        message:
          error instanceof Error
            ? error.message
            : "Unknown error",

        stack:
          error instanceof Error
            ? error.stack
            : undefined,

        shopDomain:
          session.shop,

        shopId:
          shop.id,
      },
    );

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