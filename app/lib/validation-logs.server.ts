import type {
  Prisma,
  ValidationLog,
} from "@prisma/client";

import db from "../db.server";

export const VALIDATION_LOG_PAGE_SIZE = 25;
export const VALIDATION_LOG_MAX_PAGE_SIZE = 100;
export const VALIDATION_LOG_EXPORT_LIMIT = 50_000;

export const VALIDATION_RESULT_OPTIONS = [
  "available",
  "unavailable",
  "inactive",
  "invalid",
  "prepaid_unavailable",
] as const;

export type ValidationResultFilter =
  (typeof VALIDATION_RESULT_OPTIONS)[number];

export type AvailabilityFilter =
  | "all"
  | "available"
  | "unavailable";

export type BooleanAvailabilityFilter =
  | "all"
  | "yes"
  | "no";

export type ValidationLogSort =
  | "newest"
  | "oldest";

export type ValidationLogFilters = {
  search?: string;
  result?: string;
  availability?: AvailabilityFilter;
  cod?: BooleanAvailabilityFilter;
  prepaid?: BooleanAvailabilityFilter;
  startDate?: string;
  endDate?: string;
  sort?: ValidationLogSort;
};

export type GetValidationLogsInput =
  ValidationLogFilters & {
    shopId: string;
    page?: number;
    pageSize?: number;
  };

export type ValidationLogsPagination = {
  currentPage: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
};

export type ValidationLogsResult = {
  logs: ValidationLog[];
  pagination: ValidationLogsPagination;
  filters: Required<
    Pick<
      ValidationLogFilters,
      | "search"
      | "result"
      | "availability"
      | "cod"
      | "prepaid"
      | "startDate"
      | "endDate"
      | "sort"
    >
  >;
};

export type ValidationLogSummary = {
  total: number;
  available: number;
  unavailable: number;
  codAvailable: number;
  prepaidAvailable: number;
};

function normalizePositiveInteger(
  value: number | undefined,
  fallback: number,
) {
  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value < 1
  ) {
    return fallback;
  }

  return value;
}

function normalizePageSize(
  pageSize: number | undefined,
) {
  const parsedPageSize =
    normalizePositiveInteger(
      pageSize,
      VALIDATION_LOG_PAGE_SIZE,
    );

  return Math.min(
    parsedPageSize,
    VALIDATION_LOG_MAX_PAGE_SIZE,
  );
}

function normalizeSearch(
  search: string | undefined,
) {
  return String(search ?? "")
    .trim()
    .slice(0, 200);
}

function normalizeResult(
  result: string | undefined,
) {
  const normalized = String(
    result ?? "",
  )
    .trim()
    .toLowerCase();

  if (
    VALIDATION_RESULT_OPTIONS.includes(
      normalized as ValidationResultFilter,
    )
  ) {
    return normalized;
  }

  return "all";
}

function normalizeAvailability(
  value: string | undefined,
): AvailabilityFilter {
  if (
    value === "available" ||
    value === "unavailable"
  ) {
    return value;
  }

  return "all";
}

function normalizeBooleanFilter(
  value: string | undefined,
): BooleanAvailabilityFilter {
  if (
    value === "yes" ||
    value === "no"
  ) {
    return value;
  }

  return "all";
}

function normalizeSort(
  value: string | undefined,
): ValidationLogSort {
  return value === "oldest"
    ? "oldest"
    : "newest";
}

function parseStartDate(
  value: string | undefined,
) {
  if (!value) {
    return null;
  }

  const date = new Date(
    `${value}T00:00:00.000Z`,
  );

  if (
    Number.isNaN(date.getTime())
  ) {
    return null;
  }

  return date;
}

function parseEndDate(
  value: string | undefined,
) {
  if (!value) {
    return null;
  }

  const date = new Date(
    `${value}T23:59:59.999Z`,
  );

  if (
    Number.isNaN(date.getTime())
  ) {
    return null;
  }

  return date;
}

function buildDateFilter({
  startDate,
  endDate,
}: {
  startDate: string;
  endDate: string;
}): Prisma.DateTimeFilter | undefined {
  const parsedStartDate =
    parseStartDate(startDate);

  const parsedEndDate =
    parseEndDate(endDate);

  if (
    !parsedStartDate &&
    !parsedEndDate
  ) {
    return undefined;
  }

  return {
    ...(parsedStartDate
      ? {
          gte: parsedStartDate,
        }
      : {}),

    ...(parsedEndDate
      ? {
          lte: parsedEndDate,
        }
      : {}),
  };
}

function buildValidationLogWhere({
  shopId,
  search,
  result,
  availability,
  cod,
  prepaid,
  startDate,
  endDate,
}: {
  shopId: string;
  search: string;
  result: string;
  availability: AvailabilityFilter;
  cod: BooleanAvailabilityFilter;
  prepaid: BooleanAvailabilityFilter;
  startDate: string;
  endDate: string;
}): Prisma.ValidationLogWhereInput {
  const dateFilter =
    buildDateFilter({
      startDate,
      endDate,
    });

  return {
    shopId,

    ...(search
      ? {
          OR: [
            {
              pincode: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              city: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              state: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              country: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              productTitle: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              productHandle: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              productId: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              result: {
                contains: search,
                mode: "insensitive",
              },
            },
          ],
        }
      : {}),

    ...(result !== "all"
      ? {
          result,
        }
      : {}),

    ...(availability === "available"
      ? {
          isAvailable: true,
        }
      : {}),

    ...(availability ===
    "unavailable"
      ? {
          isAvailable: false,
        }
      : {}),

    ...(cod === "yes"
      ? {
          codAvailable: true,
        }
      : {}),

    ...(cod === "no"
      ? {
          codAvailable: false,
        }
      : {}),

    ...(prepaid === "yes"
      ? {
          prepaidAvailable: true,
        }
      : {}),

    ...(prepaid === "no"
      ? {
          prepaidAvailable: false,
        }
      : {}),

    ...(dateFilter
      ? {
          createdAt: dateFilter,
        }
      : {}),
  };
}

export async function getValidationLogs({
  shopId,
  page,
  pageSize,
  search,
  result,
  availability,
  cod,
  prepaid,
  startDate,
  endDate,
  sort,
}: GetValidationLogsInput): Promise<ValidationLogsResult> {
  const normalizedSearch =
    normalizeSearch(search);

  const normalizedResult =
    normalizeResult(result);

  const normalizedAvailability =
    normalizeAvailability(
      availability,
    );

  const normalizedCod =
    normalizeBooleanFilter(cod);

  const normalizedPrepaid =
    normalizeBooleanFilter(
      prepaid,
    );

  const normalizedStartDate =
    String(startDate ?? "").trim();

  const normalizedEndDate =
    String(endDate ?? "").trim();

  const normalizedSort =
    normalizeSort(sort);

  const normalizedPageSize =
    normalizePageSize(pageSize);

  const requestedPage =
    normalizePositiveInteger(
      page,
      1,
    );

  const where =
    buildValidationLogWhere({
      shopId,
      search:
        normalizedSearch,
      result:
        normalizedResult,
      availability:
        normalizedAvailability,
      cod: normalizedCod,
      prepaid:
        normalizedPrepaid,
      startDate:
        normalizedStartDate,
      endDate:
        normalizedEndDate,
    });

  const totalCount =
    await db.validationLog.count({
      where,
    });

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        totalCount /
          normalizedPageSize,
      ),
    );

  const currentPage =
    Math.min(
      requestedPage,
      totalPages,
    );

  const logs =
    await db.validationLog.findMany({
      where,

      orderBy: {
        createdAt:
          normalizedSort ===
          "oldest"
            ? "asc"
            : "desc",
      },

      skip:
        (currentPage - 1) *
        normalizedPageSize,

      take: normalizedPageSize,
    });

  return {
    logs,

    pagination: {
      currentPage,
      pageSize:
        normalizedPageSize,
      totalCount,
      totalPages,

      hasPreviousPage:
        currentPage > 1,

      hasNextPage:
        currentPage <
        totalPages,
    },

    filters: {
      search:
        normalizedSearch,
      result:
        normalizedResult,
      availability:
        normalizedAvailability,
      cod: normalizedCod,
      prepaid:
        normalizedPrepaid,
      startDate:
        normalizedStartDate,
      endDate:
        normalizedEndDate,
      sort: normalizedSort,
    },
  };
}

export async function getValidationLogSummary({
  shopId,
  search,
  result,
  availability,
  cod,
  prepaid,
  startDate,
  endDate,
}: ValidationLogFilters & {
  shopId: string;
}): Promise<ValidationLogSummary> {
  const where =
    buildValidationLogWhere({
      shopId,

      search:
        normalizeSearch(search),

      result:
        normalizeResult(result),

      availability:
        normalizeAvailability(
          availability,
        ),

      cod:
        normalizeBooleanFilter(
          cod,
        ),

      prepaid:
        normalizeBooleanFilter(
          prepaid,
        ),

      startDate: String(
        startDate ?? "",
      ).trim(),

      endDate: String(
        endDate ?? "",
      ).trim(),
    });

  const [
    total,
    available,
    codAvailable,
    prepaidAvailable,
  ] = await Promise.all([
    db.validationLog.count({
      where,
    }),

    db.validationLog.count({
      where: {
        ...where,
        isAvailable: true,
      },
    }),

    db.validationLog.count({
      where: {
        ...where,
        codAvailable: true,
      },
    }),

    db.validationLog.count({
      where: {
        ...where,
        prepaidAvailable: true,
      },
    }),
  ]);

  return {
    total,
    available,

    unavailable:
      total - available,

    codAvailable,

    prepaidAvailable,
  };
}

export async function getValidationLogsForExport({
  shopId,
  search,
  result,
  availability,
  cod,
  prepaid,
  startDate,
  endDate,
  sort,
}: ValidationLogFilters & {
  shopId: string;
}) {
  const where =
    buildValidationLogWhere({
      shopId,

      search:
        normalizeSearch(search),

      result:
        normalizeResult(result),

      availability:
        normalizeAvailability(
          availability,
        ),

      cod:
        normalizeBooleanFilter(
          cod,
        ),

      prepaid:
        normalizeBooleanFilter(
          prepaid,
        ),

      startDate: String(
        startDate ?? "",
      ).trim(),

      endDate: String(
        endDate ?? "",
      ).trim(),
    });

  return db.validationLog.findMany({
    where,

    orderBy: {
      createdAt:
        normalizeSort(sort) ===
        "oldest"
          ? "asc"
          : "desc",
    },

    take:
      VALIDATION_LOG_EXPORT_LIMIT,
  });
}

export async function clearValidationLogs(
  shopId: string,
) {
  return db.validationLog.deleteMany({
    where: {
      shopId,
    },
  });
}

export async function deleteValidationLogsByIds({
  shopId,
  ids,
}: {
  shopId: string;
  ids: string[];
}) {
  const uniqueIds = Array.from(
    new Set(
      ids
        .map((id) =>
          String(id).trim(),
        )
        .filter(Boolean),
    ),
  ).slice(0, 500);

  if (
    uniqueIds.length === 0
  ) {
    return {
      count: 0,
    };
  }

  return db.validationLog.deleteMany({
    where: {
      shopId,

      id: {
        in: uniqueIds,
      },
    },
  });
}