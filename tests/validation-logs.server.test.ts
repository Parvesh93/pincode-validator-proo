import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const dbMock = vi.hoisted(() => ({
  validationLog: {
    count: vi.fn(),
    findMany: vi.fn(),
    deleteMany: vi.fn(),
  },
}));

vi.mock("../app/db.server", () => ({
  default: dbMock,
}));

import {
  clearValidationLogs,
  deleteValidationLogsByIds,
  getValidationLogs,
  getValidationLogsForExport,
  getValidationLogSummary,
  VALIDATION_LOG_EXPORT_LIMIT,
} from "../app/lib/validation-logs.server";

describe(
  "validation-logs.server",
  () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("returns paginated logs for the current shop", async () => {
      dbMock.validationLog.count.mockResolvedValue(
        60,
      );

      dbMock.validationLog.findMany.mockResolvedValue(
        [
          {
            id: "log-1",
            shopId: "shop-1",
            pincode:
              "110001",
          },
        ],
      );

      const result =
        await getValidationLogs({
          shopId: "shop-1",
          page: 2,
          pageSize: 25,
        });

      expect(
        result.pagination,
      ).toEqual({
        currentPage: 2,
        pageSize: 25,
        totalCount: 60,
        totalPages: 3,
        hasPreviousPage: true,
        hasNextPage: true,
      });

      expect(
        dbMock.validationLog.findMany,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            shopId:
              "shop-1",
          },

          skip: 25,
          take: 25,

          orderBy: {
            createdAt:
              "desc",
          },
        }),
      );
    });

    it("searches pincode, location, product and result fields", async () => {
      dbMock.validationLog.count.mockResolvedValue(
        0,
      );

      dbMock.validationLog.findMany.mockResolvedValue(
        [],
      );

      await getValidationLogs({
        shopId:
          "secure-shop",
        search:
          " Delhi ",
      });

      expect(
        dbMock.validationLog.count,
      ).toHaveBeenCalledWith({
        where: {
          shopId:
            "secure-shop",

          OR: expect.arrayContaining([
            {
              pincode: {
                contains:
                  "Delhi",
                mode:
                  "insensitive",
              },
            },

            {
              city: {
                contains:
                  "Delhi",
                mode:
                  "insensitive",
              },
            },

            {
              productTitle: {
                contains:
                  "Delhi",
                mode:
                  "insensitive",
              },
            },

            {
              result: {
                contains:
                  "Delhi",
                mode:
                  "insensitive",
              },
            },
          ]),
        },
      });
    });

    it("applies result, availability and payment filters", async () => {
      dbMock.validationLog.count.mockResolvedValue(
        0,
      );

      dbMock.validationLog.findMany.mockResolvedValue(
        [],
      );

      await getValidationLogs({
        shopId: "shop-1",
        result:
          "available",
        availability:
          "available",
        cod: "yes",
        prepaid: "no",
      });

      expect(
        dbMock.validationLog.count,
      ).toHaveBeenCalledWith({
        where:
          expect.objectContaining({
            shopId:
              "shop-1",
            result:
              "available",
            isAvailable:
              true,
            codAvailable:
              true,
            prepaidAvailable:
              false,
          }),
      });
    });

    it("applies UTC start and end dates", async () => {
      dbMock.validationLog.count.mockResolvedValue(
        0,
      );

      dbMock.validationLog.findMany.mockResolvedValue(
        [],
      );

      await getValidationLogs({
        shopId: "shop-1",
        startDate:
          "2026-07-01",
        endDate:
          "2026-07-15",
      });

      expect(
        dbMock.validationLog.count,
      ).toHaveBeenCalledWith({
        where:
          expect.objectContaining({
            createdAt: {
              gte: new Date(
                "2026-07-01T00:00:00.000Z",
              ),

              lte: new Date(
                "2026-07-15T23:59:59.999Z",
              ),
            },
          }),
      });
    });

    it("uses the final page when the requested page is out of range", async () => {
      dbMock.validationLog.count.mockResolvedValue(
        60,
      );

      dbMock.validationLog.findMany.mockResolvedValue(
        [],
      );

      const result =
        await getValidationLogs({
          shopId: "shop-1",
          page: 100,
          pageSize: 25,
        });

      expect(
        result.pagination.currentPage,
      ).toBe(3);

      expect(
        dbMock.validationLog.findMany,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 50,
        }),
      );
    });

    it("supports oldest-first sorting", async () => {
      dbMock.validationLog.count.mockResolvedValue(
        0,
      );

      dbMock.validationLog.findMany.mockResolvedValue(
        [],
      );

      await getValidationLogs({
        shopId: "shop-1",
        sort: "oldest",
      });

      expect(
        dbMock.validationLog.findMany,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: {
            createdAt: "asc",
          },
        }),
      );
    });

    it("returns a filtered summary", async () => {
      dbMock.validationLog.count
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(70)
        .mockResolvedValueOnce(50)
        .mockResolvedValueOnce(65);

      const result =
        await getValidationLogSummary({
          shopId: "shop-1",
          result: "available",
        });

      expect(result).toEqual({
        total: 100,
        available: 70,
        unavailable: 30,
        codAvailable: 50,
        prepaidAvailable: 65,
      });
    });

    it("limits exported logs", async () => {
      dbMock.validationLog.findMany.mockResolvedValue(
        [],
      );

      await getValidationLogsForExport({
        shopId: "shop-1",
      });

      expect(
        dbMock.validationLog.findMany,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            shopId:
              "shop-1",
          },

          take:
            VALIDATION_LOG_EXPORT_LIMIT,
        }),
      );
    });

    it("clears only the current shop logs", async () => {
      dbMock.validationLog.deleteMany.mockResolvedValue(
        {
          count: 25,
        },
      );

      await clearValidationLogs(
        "shop-1",
      );

      expect(
        dbMock.validationLog.deleteMany,
      ).toHaveBeenCalledWith({
        where: {
          shopId:
            "shop-1",
        },
      });
    });

    it("deletes selected logs only for the current shop", async () => {
      dbMock.validationLog.deleteMany.mockResolvedValue(
        {
          count: 2,
        },
      );

      await deleteValidationLogsByIds({
        shopId: "shop-1",
        ids: [
          "log-1",
          "log-2",
          "log-1",
        ],
      });

      expect(
        dbMock.validationLog.deleteMany,
      ).toHaveBeenCalledWith({
        where: {
          shopId:
            "shop-1",

          id: {
            in: [
              "log-1",
              "log-2",
            ],
          },
        },
      });
    });

    it("does not query deletion when no IDs are supplied", async () => {
      const result =
        await deleteValidationLogsByIds({
          shopId: "shop-1",
          ids: [],
        });

      expect(result).toEqual({
        count: 0,
      });

      expect(
        dbMock.validationLog.deleteMany,
      ).not.toHaveBeenCalled();
    });
  },
);