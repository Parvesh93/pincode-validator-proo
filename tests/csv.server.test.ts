import {
  describe,
  expect,
  it,
} from "vitest";

import {
  parsePincodeCsv,
} from "../app/lib/csv.server";

describe("parsePincodeCsv", () => {
  it("parses a valid CSV row", () => {
    const csv = [
      "pincode,city,state,country,cod_available,prepaid_available,est_delivery_days,is_active",
      "110001,Delhi,Delhi,India,true,true,2,true",
    ].join("\n");

    const result =
      parsePincodeCsv(csv);

    expect(result.invalidRows).toEqual([]);
    expect(result.validRows).toHaveLength(1);

    expect(result.validRows[0]).toEqual({
      pincode: "110001",
      city: "Delhi",
      state: "Delhi",
      country: "India",
      codAvailable: true,
      prepaidAvailable: true,
      estDeliveryDays: 2,
      isActive: true,
      source: "csv",
    });
  });

  it("normalizes CSV headings", () => {
    const csv = [
      " PINCODE , City , State , COD AVAILABLE , PREPAID AVAILABLE , EST DELIVERY DAYS , IS ACTIVE ",
      "110001,Delhi,Delhi,true,true,3,true",
    ].join("\n");

    const result =
      parsePincodeCsv(csv);

    expect(result.invalidRows).toHaveLength(0);
    expect(result.validRows).toHaveLength(1);

    expect(result.validRows[0].pincode).toBe(
      "110001",
    );

    expect(
      result.validRows[0].codAvailable,
    ).toBe(true);
  });

  it.each([
    "true",
    "TRUE",
    "True",
    "yes",
    "YES",
    "Yes",
    "y",
    "Y",
    "1",
  ])(
    "accepts %s as a true boolean",
    (booleanValue) => {
      const csv = [
        "pincode,cod_available,prepaid_available,is_active",
        `110001,${booleanValue},${booleanValue},${booleanValue}`,
      ].join("\n");

      const result =
        parsePincodeCsv(csv);

      expect(result.invalidRows).toHaveLength(0);
      expect(result.validRows).toHaveLength(1);

      expect(
        result.validRows[0].codAvailable,
      ).toBe(true);

      expect(
        result.validRows[0].prepaidAvailable,
      ).toBe(true);

      expect(
        result.validRows[0].isActive,
      ).toBe(true);
    },
  );

  it.each([
    "false",
    "FALSE",
    "False",
    "no",
    "NO",
    "No",
    "n",
    "N",
    "0",
  ])(
    "accepts %s as a false boolean",
    (booleanValue) => {
      const csv = [
        "pincode,cod_available,prepaid_available,is_active",
        `110001,${booleanValue},${booleanValue},${booleanValue}`,
      ].join("\n");

      const result =
        parsePincodeCsv(csv);

      expect(result.invalidRows).toHaveLength(0);
      expect(result.validRows).toHaveLength(1);

      expect(
        result.validRows[0].codAvailable,
      ).toBe(false);

      expect(
        result.validRows[0].prepaidAvailable,
      ).toBe(false);

      expect(
        result.validRows[0].isActive,
      ).toBe(false);
    },
  );

  it("uses default boolean values when fields are empty", () => {
    const csv = [
      "pincode,cod_available,prepaid_available,is_active",
      "110001,,,",
    ].join("\n");

    const result =
      parsePincodeCsv(csv);

    expect(result.invalidRows).toHaveLength(0);
    expect(result.validRows).toHaveLength(1);

    expect(
      result.validRows[0].codAvailable,
    ).toBe(false);

    expect(
      result.validRows[0].prepaidAvailable,
    ).toBe(true);

    expect(
      result.validRows[0].isActive,
    ).toBe(true);
  });

  it("rejects an unsupported boolean value", () => {
    const csv = [
      "pincode,cod_available,prepaid_available,is_active",
      "110001,maybe,true,true",
    ].join("\n");

    const result =
      parsePincodeCsv(csv);

    expect(result.validRows).toHaveLength(0);
    expect(result.invalidRows).toHaveLength(1);

    expect(
      result.invalidRows[0].error,
    ).toContain(
      "Invalid cod_available value",
    );
  });

  it("rejects a missing pincode", () => {
    const csv = [
      "pincode,city,state",
      ",Delhi,Delhi",
    ].join("\n");

    const result =
      parsePincodeCsv(csv);

    expect(result.validRows).toHaveLength(0);
    expect(result.invalidRows).toHaveLength(1);

    expect(
      result.invalidRows[0],
    ).toMatchObject({
      rowNumber: 2,
      error: "Pincode is required",
    });
  });

  it.each([
    "12345",
    "1234567",
    "012345",
    "abcdef",
    "12 345",
    "11000A",
  ])(
    "rejects invalid Indian pincode %s",
    (pincode) => {
      const csv = [
        "pincode",
        pincode,
      ].join("\n");

      const result =
        parsePincodeCsv(csv);

      expect(result.validRows).toHaveLength(0);
      expect(result.invalidRows).toHaveLength(1);

      expect(
        result.invalidRows[0].error,
      ).toBe(
        "Pincode must be exactly 6 digits and cannot start with 0",
      );
    },
  );

  it("rejects duplicate pincodes in the same file", () => {
    const csv = [
      "pincode,city,state",
      "110001,Delhi,Delhi",
      "110001,New Delhi,Delhi",
    ].join("\n");

    const result =
      parsePincodeCsv(csv);

    expect(result.validRows).toHaveLength(1);
    expect(result.invalidRows).toHaveLength(1);

    expect(
      result.invalidRows[0],
    ).toMatchObject({
      rowNumber: 3,
      error:
        "Duplicate pincode found in file",
    });
  });

  it("accepts zero delivery days", () => {
    const csv = [
      "pincode,est_delivery_days",
      "110001,0",
    ].join("\n");

    const result =
      parsePincodeCsv(csv);

    expect(result.invalidRows).toHaveLength(0);

    expect(
      result.validRows[0].estDeliveryDays,
    ).toBe(0);
  });

  it("accepts delivery days up to 365", () => {
    const csv = [
      "pincode,est_delivery_days",
      "110001,365",
    ].join("\n");

    const result =
      parsePincodeCsv(csv);

    expect(result.invalidRows).toHaveLength(0);

    expect(
      result.validRows[0].estDeliveryDays,
    ).toBe(365);
  });

  it.each([
    "2.5",
    "-1",
    "366",
    "two",
    "1 day",
  ])(
    "rejects invalid delivery days %s",
    (deliveryDays) => {
      const csv = [
        "pincode,est_delivery_days",
        `110001,${deliveryDays}`,
      ].join("\n");

      const result =
        parsePincodeCsv(csv);

      expect(result.validRows).toHaveLength(0);
      expect(result.invalidRows).toHaveLength(1);

      expect(
        result.invalidRows[0].error,
      ).toContain(
        "est_delivery_days",
      );
    },
  );

  it("returns null for an empty delivery-days value", () => {
    const csv = [
      "pincode,est_delivery_days",
      "110001,",
    ].join("\n");

    const result =
      parsePincodeCsv(csv);

    expect(result.invalidRows).toHaveLength(0);

    expect(
      result.validRows[0].estDeliveryDays,
    ).toBeNull();
  });

  it("trims string values", () => {
    const csv = [
      "pincode,city,state,country",
      "110001, Delhi , Delhi , India ",
    ].join("\n");

    const result =
      parsePincodeCsv(csv);

    expect(result.invalidRows).toHaveLength(0);

    expect(result.validRows[0]).toMatchObject({
      city: "Delhi",
      state: "Delhi",
      country: "India",
    });
  });

  it("converts empty optional strings to null", () => {
    const csv = [
      "pincode,city,state,country",
      "110001,,,",
    ].join("\n");

    const result =
      parsePincodeCsv(csv);

    expect(result.invalidRows).toHaveLength(0);

    expect(result.validRows[0]).toMatchObject({
      city: null,
      state: null,
      country: null,
    });
  });

  it("keeps valid and invalid rows separate", () => {
    const csv = [
      "pincode,city,cod_available",
      "110001,Delhi,true",
      "012345,Invalid,true",
      "400001,Mumbai,false",
      "560001,Bengaluru,maybe",
    ].join("\n");

    const result =
      parsePincodeCsv(csv);

    expect(result.validRows).toHaveLength(2);
    expect(result.invalidRows).toHaveLength(2);

    expect(
      result.validRows.map(
        (row) => row.pincode,
      ),
    ).toEqual([
      "110001",
      "400001",
    ]);

    expect(
      result.invalidRows.map(
        (row) => row.rowNumber,
      ),
    ).toEqual([3, 5]);
  });

  it("parses a large valid CSV file", () => {
    const header =
      "pincode,city,state,cod_available,prepaid_available,est_delivery_days,is_active";

    const rows = Array.from(
      {
        length: 1000,
      },
      (_, index) => {
        const pincode = String(
          110001 + index,
        );

        return [
          pincode,
          `City ${index + 1}`,
          "Delhi",
          "true",
          "true",
          "3",
          "true",
        ].join(",");
      },
    );

    const csv = [
      header,
      ...rows,
    ].join("\n");

    const result =
      parsePincodeCsv(csv);

    expect(result.invalidRows).toHaveLength(0);
    expect(result.validRows).toHaveLength(
      1000,
    );
  });
});