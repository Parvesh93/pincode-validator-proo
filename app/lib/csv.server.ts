// import { parse } from "csv-parse/sync";

// export type ParsedCsvRow = {
//   pincode: string;
//   city?: string | null;
//   state?: string | null;
//   country?: string | null;
//   codAvailable: boolean;
//   prepaidAvailable: boolean;
//   estDeliveryDays?: number | null;
//   isActive: boolean;
//   source: "csv";
// };

// export type CsvValidationError = {
//   rowNumber: number;
//   row: Record<string, string>;
//   error: string;
// };

// export type CsvParseResult = {
//   validRows: ParsedCsvRow[];
//   invalidRows: CsvValidationError[];
// };

// function normalizeHeader(header: string) {
//   return header.trim().toLowerCase().replace(/\s+/g, "_");
// }

// function parseBoolean(value: string | undefined, defaultValue: boolean) {
//   if (!value || !value.trim()) return defaultValue;

//   const normalized = value.trim().toLowerCase();

//   if (["true", "1", "yes", "y"].includes(normalized)) return true;
//   if (["false", "0", "no", "n"].includes(normalized)) return false;

//   return defaultValue;
// }

// function parseNullableInt(value: string | undefined): number | null {
//   if (!value || !value.trim()) return null;

//   const parsed = Number(value.trim());
//   if (Number.isNaN(parsed)) return null;

//   return parsed;
// }

// function cleanString(value: string | undefined): string | null {
//   if (!value) return null;
//   const trimmed = value.trim();
//   return trimmed ? trimmed : null;
// }

// export function parsePincodeCsv(csvText: string): CsvParseResult {
//   const rows = parse(csvText, {
//     columns: (headers: string[]) => headers.map(normalizeHeader),
//     skip_empty_lines: true,
//     trim: true,
//   }) as Record<string, string>[];

//   const validRows: ParsedCsvRow[] = [];
//   const invalidRows: CsvValidationError[] = [];
//   const seen = new Set<string>();

//   rows.forEach((row, index) => {
//     const rowNumber = index + 2;
//     const pincode = row.pincode?.trim();

//     if (!pincode) {
//       invalidRows.push({
//         rowNumber,
//         row,
//         error: "Pincode is required",
//       });
//       return;
//     }

//     if (seen.has(pincode)) {
//       invalidRows.push({
//         rowNumber,
//         row,
//         error: "Duplicate pincode found in file",
//       });
//       return;
//     }

//     seen.add(pincode);

//     const estDeliveryDays = parseNullableInt(row.est_delivery_days);
//     if (row.est_delivery_days && estDeliveryDays === null) {
//       invalidRows.push({
//         rowNumber,
//         row,
//         error: "Invalid est_delivery_days value",
//       });
//       return;
//     }

//     validRows.push({
//       pincode,
//       city: cleanString(row.city),
//       state: cleanString(row.state),
//       country: cleanString(row.country),
//       codAvailable: parseBoolean(row.cod_available, false),
//       prepaidAvailable: parseBoolean(row.prepaid_available, true),
//       estDeliveryDays,
//       isActive: parseBoolean(row.is_active, true),
//       source: "csv",
//     });
//   });

//   return { validRows, invalidRows };
// }


import { parse } from "csv-parse/sync";

export type ParsedCsvRow = {
  pincode: string;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  codAvailable: boolean;
  prepaidAvailable: boolean;
  estDeliveryDays?: number | null;
  isActive: boolean;
  source: "csv";
};

export type CsvValidationError = {
  rowNumber: number;
  row: Record<string, string>;
  error: string;
};

export type CsvParseResult = {
  validRows: ParsedCsvRow[];
  invalidRows: CsvValidationError[];
};

function normalizeHeader(header: string) {
  return header.trim().toLowerCase().replace(/\s+/g, "_");
}

function parseBoolean(value: string | undefined, defaultValue: boolean) {
  if (!value || !value.trim()) return defaultValue;

  const normalized = value.trim().toLowerCase();

  if (["true", "1", "yes", "y"].includes(normalized)) return true;
  if (["false", "0", "no", "n"].includes(normalized)) return false;

  return defaultValue;
}

function parseNullableInt(value: string | undefined): number | null {
  if (!value || !value.trim()) return null;

  const parsed = Number(value.trim());
  if (Number.isNaN(parsed)) return null;

  return parsed;
}

function cleanString(value: string | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function isValidIndianPincode(value: string) {
  return /^[0-9]{6}$/.test(value);
}

export function parsePincodeCsv(csvText: string): CsvParseResult {
  const rows = parse(csvText, {
    columns: (headers: string[]) => headers.map(normalizeHeader),
    skip_empty_lines: true,
    trim: true,
  }) as Record<string, string>[];

  const validRows: ParsedCsvRow[] = [];
  const invalidRows: CsvValidationError[] = [];
  const seen = new Set<string>();

  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    const pincode = row.pincode?.trim();

    if (!pincode) {
      invalidRows.push({
        rowNumber,
        row,
        error: "Pincode is required",
      });
      return;
    }

    if (!isValidIndianPincode(pincode)) {
      invalidRows.push({
        rowNumber,
        row,
        error: "Pincode must be exactly 6 digits",
      });
      return;
    }

    if (seen.has(pincode)) {
      invalidRows.push({
        rowNumber,
        row,
        error: "Duplicate pincode found in file",
      });
      return;
    }

    seen.add(pincode);

    const estDeliveryDays = parseNullableInt(row.est_delivery_days);

    if (row.est_delivery_days && estDeliveryDays === null) {
      invalidRows.push({
        rowNumber,
        row,
        error: "Invalid est_delivery_days value",
      });
      return;
    }

    if (estDeliveryDays !== null && estDeliveryDays < 0) {
      invalidRows.push({
        rowNumber,
        row,
        error: "est_delivery_days cannot be negative",
      });
      return;
    }

    validRows.push({
      pincode,
      city: cleanString(row.city),
      state: cleanString(row.state),
      country: cleanString(row.country),
      codAvailable: parseBoolean(row.cod_available, false),
      prepaidAvailable: parseBoolean(row.prepaid_available, true),
      estDeliveryDays,
      isActive: parseBoolean(row.is_active, true),
      source: "csv",
    });
  });

  return { validRows, invalidRows };
}