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

function parseStrictBoolean(
  value: string | undefined,
  defaultValue: boolean,
): boolean | null {
  if (!value || !value.trim()) {
    return defaultValue;
  }

  const normalized = value.trim().toLowerCase();

  if (["true", "1", "yes", "y"].includes(normalized)) {
    return true;
  }

  if (["false", "0", "no", "n"].includes(normalized)) {
    return false;
  }

  return null;
}

function parseNullableInteger(value: string | undefined): number | null {
  if (!value || !value.trim()) {
    return null;
  }

  const normalized = value.trim();

  if (!/^\d+$/.test(normalized)) {
    return null;
  }

  const parsed = Number(normalized);

  if (!Number.isSafeInteger(parsed)) {
    return null;
  }

  return parsed;
}

function cleanString(value: string | undefined): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();

  return trimmed || null;
}

function isValidIndianPincode(value: string) {
  return /^[1-9][0-9]{5}$/.test(value);
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
        error: "Pincode must be exactly 6 digits and cannot start with 0",
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

    const codAvailable = parseStrictBoolean(row.cod_available, false);

    if (codAvailable === null) {
      invalidRows.push({
        rowNumber,
        row,
        error:
          "Invalid cod_available value. Use true, false, yes, no, 1, or 0",
      });
      return;
    }

    const prepaidAvailable = parseStrictBoolean(
      row.prepaid_available,
      true,
    );

    if (prepaidAvailable === null) {
      invalidRows.push({
        rowNumber,
        row,
        error:
          "Invalid prepaid_available value. Use true, false, yes, no, 1, or 0",
      });
      return;
    }

    const isActive = parseStrictBoolean(row.is_active, true);

    if (isActive === null) {
      invalidRows.push({
        rowNumber,
        row,
        error:
          "Invalid is_active value. Use true, false, yes, no, 1, or 0",
      });
      return;
    }

    const estDeliveryDays = parseNullableInteger(
      row.est_delivery_days,
    );

    if (
      row.est_delivery_days?.trim() &&
      estDeliveryDays === null
    ) {
      invalidRows.push({
        rowNumber,
        row,
        error:
          "est_delivery_days must be a whole number between 0 and 365",
      });
      return;
    }

    if (
      estDeliveryDays !== null &&
      (estDeliveryDays < 0 || estDeliveryDays > 365)
    ) {
      invalidRows.push({
        rowNumber,
        row,
        error:
          "est_delivery_days must be between 0 and 365",
      });
      return;
    }

    validRows.push({
      pincode,
      city: cleanString(row.city),
      state: cleanString(row.state),
      country: cleanString(row.country),
      codAvailable,
      prepaidAvailable,
      estDeliveryDays,
      isActive,
      source: "csv",
    });
  });

  return {
    validRows,
    invalidRows,
  };
}