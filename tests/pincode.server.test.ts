import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const prismaMock = vi.hoisted(() => ({
  shop: {
    upsert: vi.fn(),
    findUnique: vi.fn(),
  },

  pincode: {
    count: vi.fn(),
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    upsert: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
    updateMany: vi.fn(),
  },

  $transaction: vi.fn(),
}));

vi.mock("../app/db.server", () => ({
  default: prismaMock,
}));

import {
  bulkDeletePincodes,
  bulkUpdatePincodeStatus,
  deletePincode,
  getPaginatedPincodes,
  getPincodeById,
  updatePincode,
} from "../app/lib/pincode.server";

describe("pincode.server", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getPaginatedPincodes", () => {
    it("returns the first page with the configured page size", async () => {
      const records = Array.from(
        {
          length: 25,
        },
        (_, index) => ({
          id: `pincode-${index + 1}`,
          shopId: "shop-1",
          pincode: String(110001 + index),
        }),
      );

      prismaMock.pincode.count.mockResolvedValue(60);
      prismaMock.pincode.findMany.mockResolvedValue(records);

      const result = await getPaginatedPincodes({
        shopId: "shop-1",
        page: 1,
        pageSize: 25,
      });

      expect(result).toEqual({
        pincodes: records,
        totalCount: 60,
        totalPages: 3,
        currentPage: 1,
        pageSize: 25,
      });

      expect(
        prismaMock.pincode.count,
      ).toHaveBeenCalledWith({
        where: {
          shopId: "shop-1",
        },
      });

      expect(
        prismaMock.pincode.findMany,
      ).toHaveBeenCalledWith({
        where: {
          shopId: "shop-1",
        },
        orderBy: {
          pincode: "asc",
        },
        skip: 0,
        take: 25,
      });
    });

    it("uses the correct skip value for later pages", async () => {
      prismaMock.pincode.count.mockResolvedValue(100);
      prismaMock.pincode.findMany.mockResolvedValue([]);

      await getPaginatedPincodes({
        shopId: "shop-1",
        page: 3,
        pageSize: 25,
      });

      expect(
        prismaMock.pincode.findMany,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 50,
          take: 25,
        }),
      );
    });

    it("searches pincode, city and state", async () => {
      prismaMock.pincode.count.mockResolvedValue(1);
      prismaMock.pincode.findMany.mockResolvedValue([
        {
          id: "pincode-1",
          shopId: "shop-1",
          pincode: "110001",
          city: "Delhi",
          state: "Delhi",
        },
      ]);

      await getPaginatedPincodes({
        shopId: "shop-1",
        search: " Delhi ",
        page: 1,
        pageSize: 25,
      });

      const expectedWhere = {
        shopId: "shop-1",
        OR: [
          {
            pincode: {
              contains: "Delhi",
              mode: "insensitive",
            },
          },
          {
            city: {
              contains: "Delhi",
              mode: "insensitive",
            },
          },
          {
            state: {
              contains: "Delhi",
              mode: "insensitive",
            },
          },
        ],
      };

      expect(
        prismaMock.pincode.count,
      ).toHaveBeenCalledWith({
        where: expectedWhere,
      });

      expect(
        prismaMock.pincode.findMany,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expectedWhere,
        }),
      );
    });

    it("uses page 1 when the page number is invalid", async () => {
      prismaMock.pincode.count.mockResolvedValue(50);
      prismaMock.pincode.findMany.mockResolvedValue([]);

      const result = await getPaginatedPincodes({
        shopId: "shop-1",
        page: -5,
        pageSize: 25,
      });

      expect(result.currentPage).toBe(1);

      expect(
        prismaMock.pincode.findMany,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
        }),
      );
    });

    it("uses page 1 when the page number is not an integer", async () => {
      prismaMock.pincode.count.mockResolvedValue(50);
      prismaMock.pincode.findMany.mockResolvedValue([]);

      const result = await getPaginatedPincodes({
        shopId: "shop-1",
        page: 2.5,
        pageSize: 25,
      });

      expect(result.currentPage).toBe(1);
    });

    it("limits the page size to 100 records", async () => {
      prismaMock.pincode.count.mockResolvedValue(250);
      prismaMock.pincode.findMany.mockResolvedValue([]);

      const result = await getPaginatedPincodes({
        shopId: "shop-1",
        page: 1,
        pageSize: 500,
      });

      expect(result.pageSize).toBe(100);

      expect(
        prismaMock.pincode.findMany,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 100,
        }),
      );
    });

    it("uses a minimum page size of 1", async () => {
      prismaMock.pincode.count.mockResolvedValue(10);
      prismaMock.pincode.findMany.mockResolvedValue([]);

      const result = await getPaginatedPincodes({
        shopId: "shop-1",
        page: 1,
        pageSize: 0,
      });

      expect(result.pageSize).toBe(1);

      expect(
        prismaMock.pincode.findMany,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 1,
        }),
      );
    });

    it("moves an out-of-range page to the final available page", async () => {
      prismaMock.pincode.count.mockResolvedValue(60);
      prismaMock.pincode.findMany.mockResolvedValue([]);

      const result = await getPaginatedPincodes({
        shopId: "shop-1",
        page: 100,
        pageSize: 25,
      });

      expect(result.currentPage).toBe(3);
      expect(result.totalPages).toBe(3);

      expect(
        prismaMock.pincode.findMany,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 50,
        }),
      );
    });

    it("returns page 1 when there are no records", async () => {
      prismaMock.pincode.count.mockResolvedValue(0);
      prismaMock.pincode.findMany.mockResolvedValue([]);

      const result = await getPaginatedPincodes({
        shopId: "shop-1",
        page: 4,
        pageSize: 25,
      });

      expect(result).toEqual({
        pincodes: [],
        totalCount: 0,
        totalPages: 1,
        currentPage: 1,
        pageSize: 25,
      });
    });

    it("never queries records belonging to another shop", async () => {
      prismaMock.pincode.count.mockResolvedValue(0);
      prismaMock.pincode.findMany.mockResolvedValue([]);

      await getPaginatedPincodes({
        shopId: "shop-secure",
        search: "Mumbai",
        page: 1,
        pageSize: 25,
      });

      expect(
        prismaMock.pincode.count,
      ).toHaveBeenCalledWith({
        where: expect.objectContaining({
          shopId: "shop-secure",
        }),
      });

      expect(
        prismaMock.pincode.findMany,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            shopId: "shop-secure",
          }),
        }),
      );
    });
  });

  describe("getPincodeById", () => {
    it("looks up a pincode using both record ID and shop ID", async () => {
      prismaMock.pincode.findFirst.mockResolvedValue({
        id: "pincode-1",
        shopId: "shop-1",
        pincode: "110001",
      });

      await getPincodeById(
        "pincode-1",
        "shop-1",
      );

      expect(
        prismaMock.pincode.findFirst,
      ).toHaveBeenCalledWith({
        where: {
          id: "pincode-1",
          shopId: "shop-1",
        },
      });
    });

    it("returns null when the record belongs to another shop", async () => {
      prismaMock.pincode.findFirst.mockResolvedValue(null);

      const result = await getPincodeById(
        "pincode-1",
        "wrong-shop",
      );

      expect(result).toBeNull();

      expect(
        prismaMock.pincode.findFirst,
      ).toHaveBeenCalledWith({
        where: {
          id: "pincode-1",
          shopId: "wrong-shop",
        },
      });
    });
  });

  describe("bulkUpdatePincodeStatus", () => {
    it("activates only selected records belonging to the current shop", async () => {
      prismaMock.pincode.updateMany.mockResolvedValue({
        count: 2,
      });

      const result =
        await bulkUpdatePincodeStatus(
          [
            "pincode-1",
            "pincode-2",
          ],
          "shop-1",
          true,
        );

      expect(result).toEqual({
        count: 2,
      });

      expect(
        prismaMock.pincode.updateMany,
      ).toHaveBeenCalledWith({
        where: {
          shopId: "shop-1",
          id: {
            in: [
              "pincode-1",
              "pincode-2",
            ],
          },
        },
        data: {
          isActive: true,
        },
      });
    });

    it("deactivates only selected records belonging to the current shop", async () => {
      prismaMock.pincode.updateMany.mockResolvedValue({
        count: 3,
      });

      const result =
        await bulkUpdatePincodeStatus(
          [
            "pincode-1",
            "pincode-2",
            "pincode-3",
          ],
          "shop-2",
          false,
        );

      expect(result).toEqual({
        count: 3,
      });

      expect(
        prismaMock.pincode.updateMany,
      ).toHaveBeenCalledWith({
        where: {
          shopId: "shop-2",
          id: {
            in: [
              "pincode-1",
              "pincode-2",
              "pincode-3",
            ],
          },
        },
        data: {
          isActive: false,
        },
      });
    });

    it("does not query the database when no IDs are selected", async () => {
      const result =
        await bulkUpdatePincodeStatus(
          [],
          "shop-1",
          true,
        );

      expect(result).toEqual({
        count: 0,
      });

      expect(
        prismaMock.pincode.updateMany,
      ).not.toHaveBeenCalled();
    });
  });

  describe("bulkDeletePincodes", () => {
    it("deletes only selected records belonging to the current shop", async () => {
      prismaMock.pincode.deleteMany.mockResolvedValue({
        count: 2,
      });

      const result =
        await bulkDeletePincodes(
          [
            "pincode-1",
            "pincode-2",
          ],
          "shop-1",
        );

      expect(result).toEqual({
        count: 2,
      });

      expect(
        prismaMock.pincode.deleteMany,
      ).toHaveBeenCalledWith({
        where: {
          shopId: "shop-1",
          id: {
            in: [
              "pincode-1",
              "pincode-2",
            ],
          },
        },
      });
    });

    it("does not query the database when no IDs are selected", async () => {
      const result =
        await bulkDeletePincodes(
          [],
          "shop-1",
        );

      expect(result).toEqual({
        count: 0,
      });

      expect(
        prismaMock.pincode.deleteMany,
      ).not.toHaveBeenCalled();
    });
  });

  describe("updatePincode", () => {
    it("checks shop ownership before updating a record", async () => {
      prismaMock.pincode.findFirst.mockResolvedValue({
        id: "pincode-1",
        shopId: "shop-1",
        pincode: "110001",
        source: "manual",
      });

      prismaMock.pincode.update.mockResolvedValue({
        id: "pincode-1",
        shopId: "shop-1",
        pincode: "110002",
      });

      await updatePincode(
        "pincode-1",
        "shop-1",
        {
          pincode: "110002",
          city: "New Delhi",
          state: "Delhi",
          country: "India",
          codAvailable: true,
          prepaidAvailable: true,
          estDeliveryDays: 2,
          isActive: true,
          source: "manual",
        },
      );

      expect(
        prismaMock.pincode.findFirst,
      ).toHaveBeenCalledWith({
        where: {
          id: "pincode-1",
          shopId: "shop-1",
        },
      });

      expect(
        prismaMock.pincode.update,
      ).toHaveBeenCalledWith({
        where: {
          id: "pincode-1",
        },
        data: {
          pincode: "110002",
          city: "New Delhi",
          state: "Delhi",
          country: "India",
          codAvailable: true,
          prepaidAvailable: true,
          estDeliveryDays: 2,
          isActive: true,
          source: "manual",
        },
      });
    });

    it("throws before updating when the record does not belong to the shop", async () => {
      prismaMock.pincode.findFirst.mockResolvedValue(null);

      await expect(
        updatePincode(
          "pincode-1",
          "wrong-shop",
          {
            pincode: "110002",
            city: "New Delhi",
            state: "Delhi",
            country: "India",
            codAvailable: true,
            prepaidAvailable: true,
            estDeliveryDays: 2,
            isActive: true,
            source: "manual",
          },
        ),
      ).rejects.toThrow(
        "Pincode not found",
      );

      expect(
        prismaMock.pincode.update,
      ).not.toHaveBeenCalled();
    });
  });

  describe("deletePincode", () => {
    it("checks shop ownership before deleting a record", async () => {
      prismaMock.pincode.findFirst.mockResolvedValue({
        id: "pincode-1",
        shopId: "shop-1",
        pincode: "110001",
      });

      prismaMock.pincode.delete.mockResolvedValue({
        id: "pincode-1",
      });

      await deletePincode(
        "pincode-1",
        "shop-1",
      );

      expect(
        prismaMock.pincode.findFirst,
      ).toHaveBeenCalledWith({
        where: {
          id: "pincode-1",
          shopId: "shop-1",
        },
      });

      expect(
        prismaMock.pincode.delete,
      ).toHaveBeenCalledWith({
        where: {
          id: "pincode-1",
        },
      });
    });

    it("throws before deletion when the record belongs to another shop", async () => {
      prismaMock.pincode.findFirst.mockResolvedValue(null);

      await expect(
        deletePincode(
          "pincode-1",
          "wrong-shop",
        ),
      ).rejects.toThrow(
        "Pincode not found",
      );

      expect(
        prismaMock.pincode.delete,
      ).not.toHaveBeenCalled();
    });
  });
});