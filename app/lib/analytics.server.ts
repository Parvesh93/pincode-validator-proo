import db from "../db.server";

const ANALYTICS_PERIOD_DAYS = 30;
const TOP_RESULT_LIMIT = 10;
const RECENT_RESULT_LIMIT = 20;

export type AnalyticsSummary = {
  totalValidations: number;
  successfulValidations: number;
  failedValidations: number;
  successRate: number;
  todayValidations: number;
  last30DaysValidations: number;
  codAvailableValidations: number;
  prepaidAvailableValidations: number;
  averageDeliveryDays: number | null;
};

export type DailyValidationTrend = {
  date: string;
  label: string;
  total: number;
  successful: number;
  failed: number;
};

export type TopPincode = {
  pincode: string;
  searches: number;
  successful: number;
  failed: number;
};

export type TopCity = {
  city: string;
  searches: number;
};

export type FailedPincode = {
  pincode: string;
  failures: number;
};

export type RecentValidation = {
  id: string;
  pincode: string;
  city: string | null;
  state: string | null;
  country: string | null;
  productId: string | null;
  productHandle: string | null;
  productTitle: string | null;
  codAvailable: boolean;
  prepaidAvailable: boolean;
  estDeliveryDays: number | null;
  result: string;
  isAvailable: boolean;
  source: string;
  createdAt: Date;
};

export type AvailabilityBreakdown = {
  available: number;
  unavailable: number;
};

export type PaymentBreakdown = {
  available: number;
  unavailable: number;
};

export type AnalyticsDashboardData = {
  summary: AnalyticsSummary;
  dailyTrend: DailyValidationTrend[];
  topPincodes: TopPincode[];
  topCities: TopCity[];
  failedPincodes: FailedPincode[];
  recentValidations: RecentValidation[];
  availabilityBreakdown: AvailabilityBreakdown;
  codBreakdown: PaymentBreakdown;
  prepaidBreakdown: PaymentBreakdown;
};

type DailyTrendDatabaseRow = {
  date: Date | string;
  total: bigint | number;
  successful: bigint | number;
  failed: bigint | number;
};

function startOfTodayUtc() {
  const now = new Date();

  return new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
    ),
  );
}

function startOfAnalyticsPeriodUtc() {
  const start = startOfTodayUtc();

  start.setUTCDate(
    start.getUTCDate() -
      (ANALYTICS_PERIOD_DAYS - 1),
  );

  return start;
}

function formatDateKey(date: Date) {
  const year = date.getUTCFullYear();

  const month = String(
    date.getUTCMonth() + 1,
  ).padStart(2, "0");

  const day = String(
    date.getUTCDate(),
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatShortDateLabel(date: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  }).format(date);
}

function toNumber(
  value: bigint | number | null | undefined,
) {
  if (typeof value === "bigint") {
    return Number(value);
  }

  return value ?? 0;
}

function calculatePercentage(
  numerator: number,
  denominator: number,
) {
  if (denominator <= 0) {
    return 0;
  }

  return Number(
    (
      (numerator / denominator) *
      100
    ).toFixed(1),
  );
}

function createEmptyDailyTrend() {
  const startDate =
    startOfAnalyticsPeriodUtc();

  return Array.from(
    {
      length: ANALYTICS_PERIOD_DAYS,
    },
    (_, index): DailyValidationTrend => {
      const date = new Date(startDate);

      date.setUTCDate(
        startDate.getUTCDate() + index,
      );

      return {
        date: formatDateKey(date),
        label:
          formatShortDateLabel(date),
        total: 0,
        successful: 0,
        failed: 0,
      };
    },
  );
}

async function getDailyTrend(
  shopId: string,
): Promise<DailyValidationTrend[]> {
  const periodStart =
    startOfAnalyticsPeriodUtc();

  /*
   * PostgreSQL groups the timestamp by UTC calendar day.
   * Parameters are safely interpolated by Prisma.
   */
  const groupedRows =
    await db.$queryRaw<
      DailyTrendDatabaseRow[]
    >`
      SELECT
        DATE_TRUNC(
          'day',
          "createdAt" AT TIME ZONE 'UTC'
        ) AS "date",
        COUNT(*) AS "total",
        COUNT(*) FILTER (
          WHERE "isAvailable" = true
        ) AS "successful",
        COUNT(*) FILTER (
          WHERE "isAvailable" = false
        ) AS "failed"
      FROM "ValidationLog"
      WHERE
        "shopId" = ${shopId}
        AND "createdAt" >= ${periodStart}
      GROUP BY 1
      ORDER BY 1 ASC
    `;

  const valuesByDate = new Map<
    string,
    {
      total: number;
      successful: number;
      failed: number;
    }
  >();

  groupedRows.forEach((row) => {
    const parsedDate =
      row.date instanceof Date
        ? row.date
        : new Date(row.date);

    const dateKey =
      formatDateKey(parsedDate);

    valuesByDate.set(dateKey, {
      total: toNumber(row.total),
      successful: toNumber(
        row.successful,
      ),
      failed: toNumber(row.failed),
    });
  });

  return createEmptyDailyTrend().map(
    (day) => {
      const values =
        valuesByDate.get(day.date);

      if (!values) {
        return day;
      }

      return {
        ...day,
        ...values,
      };
    },
  );
}

async function getTopPincodes(
  shopId: string,
): Promise<TopPincode[]> {
  const groupedPincodes =
    await db.validationLog.groupBy({
      by: ["pincode"],
      where: {
        shopId,
      },
      _count: {
        _all: true,
      },
      orderBy: {
        _count: {
          pincode: "desc",
        },
      },
      take: TOP_RESULT_LIMIT,
    });

  return Promise.all(
    groupedPincodes.map(
      async (group) => {
        const successful =
          await db.validationLog.count({
            where: {
              shopId,
              pincode:
                group.pincode,
              isAvailable: true,
            },
          });

        const searches =
          group._count._all;

        return {
          pincode:
            group.pincode,
          searches,
          successful,
          failed:
            searches - successful,
        };
      },
    ),
  );
}

async function getTopCities(
  shopId: string,
): Promise<TopCity[]> {
  const groupedCities =
    await db.validationLog.groupBy({
      by: ["city"],
      where: {
        shopId,
        city: {
          not: null,
        },
      },
      _count: {
        _all: true,
      },
      orderBy: {
        _count: {
          city: "desc",
        },
      },
      take: TOP_RESULT_LIMIT,
    });

  return groupedCities
    .filter(
      (
        group,
      ): group is typeof group & {
        city: string;
      } =>
        typeof group.city ===
          "string" &&
        group.city.trim().length >
          0,
    )
    .map((group) => ({
      city: group.city,
      searches:
        group._count._all,
    }));
}

async function getFailedPincodes(
  shopId: string,
): Promise<FailedPincode[]> {
  const groupedFailures =
    await db.validationLog.groupBy({
      by: ["pincode"],
      where: {
        shopId,
        isAvailable: false,
      },
      _count: {
        _all: true,
      },
      orderBy: {
        _count: {
          pincode: "desc",
        },
      },
      take: TOP_RESULT_LIMIT,
    });

  return groupedFailures.map(
    (group) => ({
      pincode: group.pincode,
      failures:
        group._count._all,
    }),
  );
}

export async function getAnalyticsDashboardData(
  shopId: string,
): Promise<AnalyticsDashboardData> {
  const todayStart =
    startOfTodayUtc();

  const periodStart =
    startOfAnalyticsPeriodUtc();

  const [
    totalValidations,
    successfulValidations,
    todayValidations,
    last30DaysValidations,
    codAvailableValidations,
    prepaidAvailableValidations,
    deliveryDaysAggregate,
    dailyTrend,
    topPincodes,
    topCities,
    failedPincodes,
    recentValidations,
  ] = await Promise.all([
    db.validationLog.count({
      where: {
        shopId,
      },
    }),

    db.validationLog.count({
      where: {
        shopId,
        isAvailable: true,
      },
    }),

    db.validationLog.count({
      where: {
        shopId,
        createdAt: {
          gte: todayStart,
        },
      },
    }),

    db.validationLog.count({
      where: {
        shopId,
        createdAt: {
          gte: periodStart,
        },
      },
    }),

    db.validationLog.count({
      where: {
        shopId,
        isAvailable: true,
        codAvailable: true,
      },
    }),

    db.validationLog.count({
      where: {
        shopId,
        isAvailable: true,
        prepaidAvailable: true,
      },
    }),

    db.validationLog.aggregate({
      where: {
        shopId,
        isAvailable: true,
        estDeliveryDays: {
          not: null,
        },
      },
      _avg: {
        estDeliveryDays: true,
      },
    }),

    getDailyTrend(shopId),

    getTopPincodes(shopId),

    getTopCities(shopId),

    getFailedPincodes(shopId),

    db.validationLog.findMany({
      where: {
        shopId,
      },
      select: {
        id: true,
        pincode: true,
        city: true,
        state: true,
        country: true,
        productId: true,
        productHandle: true,
        productTitle: true,
        codAvailable: true,
        prepaidAvailable: true,
        estDeliveryDays: true,
        result: true,
        isAvailable: true,
        source: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: RECENT_RESULT_LIMIT,
    }),
  ]);

  const failedValidations =
    totalValidations -
    successfulValidations;

  const successRate =
    calculatePercentage(
      successfulValidations,
      totalValidations,
    );

  const averageDeliveryDays =
    deliveryDaysAggregate._avg
      .estDeliveryDays;

  return {
    summary: {
      totalValidations,
      successfulValidations,
      failedValidations,
      successRate,
      todayValidations,
      last30DaysValidations,
      codAvailableValidations,
      prepaidAvailableValidations,
      averageDeliveryDays:
        averageDeliveryDays ===
        null
          ? null
          : Number(
              averageDeliveryDays.toFixed(
                1,
              ),
            ),
    },

    dailyTrend,

    topPincodes,

    topCities,

    failedPincodes,

    recentValidations,

    availabilityBreakdown: {
      available:
        successfulValidations,

      unavailable:
        failedValidations,
    },

    codBreakdown: {
      available:
        codAvailableValidations,

      unavailable: Math.max(
        0,
        successfulValidations -
          codAvailableValidations,
      ),
    },

    prepaidBreakdown: {
      available:
        prepaidAvailableValidations,

      unavailable: Math.max(
        0,
        successfulValidations -
          prepaidAvailableValidations,
      ),
    },
  };
}