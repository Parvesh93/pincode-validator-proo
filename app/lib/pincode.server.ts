import prisma from "../db.server";

import type {
  ParsedCsvRow,
} from "./csv.server";

import {
  FREE_PINCODE_LIMIT,
} from "./plan.constants";

export type PincodeInput = {
  shopId: string;
  pincode: string;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  codAvailable?: boolean;
  prepaidAvailable?: boolean;
  estDeliveryDays?: number | null;
  isActive?: boolean;
  source?: string | null;
};

type GetPaginatedPincodesInput = {
  shopId: string;
  search?: string;
  page?: number;
  pageSize?: number;
};

function normalizePincode(
  value: string,
) {
  return value.trim();
}

export async function getOrCreateShopByDomain(
  shopDomain: string,
) {
  return prisma.shop.upsert({
    where: {
      shopDomain,
    },

    update: {},

    create: {
      shopDomain,
    },
  });
}

export async function getShopByDomain(
  shopDomain: string,
) {
  return prisma.shop.findUnique({
    where: {
      shopDomain,
    },
  });
}

export async function getPincodesByShop(
  shopId: string,
  search?: string,
) {
  const normalizedSearch =
    search?.trim() || "";

  return prisma.pincode.findMany({
    where: {
      shopId,

      ...(normalizedSearch
        ? {
            OR: [
              {
                pincode: {
                  contains:
                    normalizedSearch,
                  mode:
                    "insensitive" as const,
                },
              },
              {
                city: {
                  contains:
                    normalizedSearch,
                  mode:
                    "insensitive" as const,
                },
              },
              {
                state: {
                  contains:
                    normalizedSearch,
                  mode:
                    "insensitive" as const,
                },
              },
            ],
          }
        : {}),
    },

    /*
     * This order determines which records form the
     * first 100 on the Free plan.
     */
    orderBy: [
      {
        createdAt: "asc",
      },
      {
        id: "asc",
      },
    ],
  });
}

export async function getPaginatedPincodes({
  shopId,
  search = "",
  page = 1,
  pageSize = 25,
}: GetPaginatedPincodesInput) {
  const safePage =
    Number.isInteger(page) &&
    page > 0
      ? page
      : 1;

  const safePageSize =
    Math.min(
      100,
      Math.max(
        1,
        Number.isInteger(pageSize)
          ? pageSize
          : 25,
      ),
    );

  const normalizedSearch =
    search.trim();

  const where = {
    shopId,

    ...(normalizedSearch
      ? {
          OR: [
            {
              pincode: {
                contains:
                  normalizedSearch,
                mode:
                  "insensitive" as const,
              },
            },
            {
              city: {
                contains:
                  normalizedSearch,
                mode:
                  "insensitive" as const,
              },
            },
            {
              state: {
                contains:
                  normalizedSearch,
                mode:
                  "insensitive" as const,
              },
            },
          ],
        }
      : {}),
  };

  const totalCount =
    await prisma.pincode.count({
      where,
    });

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        totalCount /
          safePageSize,
      ),
    );

  const currentPage =
    Math.min(
      safePage,
      totalPages,
    );

  const pincodes =
    await prisma.pincode.findMany({
      where,

      orderBy: [
        {
          createdAt: "asc",
        },
        {
          id: "asc",
        },
      ],

      skip:
        (currentPage - 1) *
        safePageSize,

      take:
        safePageSize,
    });

  return {
    pincodes,
    totalCount,
    totalPages,
    currentPage,
    pageSize:
      safePageSize,
  };
}

export async function getPincodeById(
  id: string,
  shopId: string,
) {
  return prisma.pincode.findFirst({
    where: {
      id,
      shopId,
    },
  });
}

export async function getPincodeByValue(
  shopId: string,
  pincode: string,
) {
  return prisma.pincode.findUnique({
    where: {
      shopId_pincode: {
        shopId,
        pincode:
          normalizePincode(
            pincode,
          ),
      },
    },
  });
}

export async function countPincodesByShop(
  shopId: string,
) {
  return prisma.pincode.count({
    where: {
      shopId,
    },
  });
}

export async function countActivePincodesByShop(
  shopId: string,
) {
  return prisma.pincode.count({
    where: {
      shopId,
      isActive: true,
    },
  });
}

export async function createPincode(
  input: PincodeInput,
) {
  const pincode =
    normalizePincode(
      input.pincode,
    );

  return prisma.pincode.create({
    data: {
      shopId:
        input.shopId,

      pincode,

      city:
        input.city ?? null,

      state:
        input.state ?? null,

      country:
        input.country ?? null,

      codAvailable:
        input.codAvailable ??
        false,

      prepaidAvailable:
        input.prepaidAvailable ??
        true,

      estDeliveryDays:
        input.estDeliveryDays ??
        null,

      isActive:
        input.isActive ??
        true,

      disabledByPlan:
        false,

      source:
        input.source ??
        "manual",
    },
  });
}

export async function updatePincode(
  id: string,
  shopId: string,
  input: Omit<
    PincodeInput,
    "shopId"
  >,
) {
  const existing =
    await getPincodeById(
      id,
      shopId,
    );

  if (!existing) {
    throw new Error(
      "Pincode not found",
    );
  }

  const requestedIsActive =
    input.isActive ?? true;

  /*
   * Preserve disabledByPlan when a plan-disabled
   * record is edited but remains inactive.
   *
   * Clear it when the merchant explicitly activates
   * the record or when it is a manually inactive record.
   */
  const disabledByPlan =
    existing.disabledByPlan &&
    !requestedIsActive;

  return prisma.pincode.update({
    where: {
      id,
    },

    data: {
      pincode:
        normalizePincode(
          input.pincode,
        ),

      city:
        input.city ?? null,

      state:
        input.state ?? null,

      country:
        input.country ?? null,

      codAvailable:
        input.codAvailable ??
        false,

      prepaidAvailable:
        input.prepaidAvailable ??
        true,

      estDeliveryDays:
        input.estDeliveryDays ??
        null,

      isActive:
        requestedIsActive,

      disabledByPlan,

      source:
        input.source ??
        existing.source ??
        "manual",
    },
  });
}

export async function upsertSinglePincode(
  input: PincodeInput,
) {
  const pincode =
    normalizePincode(
      input.pincode,
    );

  const existing =
    await prisma.pincode.findUnique({
      where: {
        shopId_pincode: {
          shopId:
            input.shopId,
          pincode,
        },
      },
    });

  const requestedIsActive =
    input.isActive ?? true;

  if (existing) {
    const disabledByPlan =
      existing.disabledByPlan &&
      !requestedIsActive;

    return prisma.pincode.update({
      where: {
        id:
          existing.id,
      },

      data: {
        city:
          input.city ?? null,

        state:
          input.state ?? null,

        country:
          input.country ?? null,

        codAvailable:
          input.codAvailable ??
          false,

        prepaidAvailable:
          input.prepaidAvailable ??
          true,

        estDeliveryDays:
          input.estDeliveryDays ??
          null,

        isActive:
          requestedIsActive,

        disabledByPlan,

        source:
          input.source ??
          existing.source ??
          "manual",
      },
    });
  }

  return prisma.pincode.create({
    data: {
      shopId:
        input.shopId,

      pincode,

      city:
        input.city ?? null,

      state:
        input.state ?? null,

      country:
        input.country ?? null,

      codAvailable:
        input.codAvailable ??
        false,

      prepaidAvailable:
        input.prepaidAvailable ??
        true,

      estDeliveryDays:
        input.estDeliveryDays ??
        null,

      isActive:
        requestedIsActive,

      disabledByPlan:
        false,

      source:
        input.source ??
        "manual",
    },
  });
}

export async function deletePincode(
  id: string,
  shopId: string,
) {
  const existing =
    await getPincodeById(
      id,
      shopId,
    );

  if (!existing) {
    throw new Error(
      "Pincode not found",
    );
  }

  return prisma.pincode.delete({
    where: {
      id,
    },
  });
}

export async function bulkDeletePincodes(
  ids: string[],
  shopId: string,
) {
  if (!ids.length) {
    return {
      count: 0,
    };
  }

  return prisma.pincode.deleteMany({
    where: {
      shopId,

      id: {
        in: ids,
      },
    },
  });
}

export async function bulkUpdatePincodeStatus(
  ids: string[],
  shopId: string,
  isActive: boolean,
) {
  if (!ids.length) {
    return {
      count: 0,
    };
  }

  return prisma.pincode.updateMany({
    where: {
      shopId,

      id: {
        in: ids,
      },
    },

    /*
     * This is an explicit merchant action, so it is no
     * longer considered an automatic plan restriction.
     */
    data: {
      isActive,
      disabledByPlan:
        false,
    },
  });
}

export async function bulkUpsertPincodes(
  shopId: string,
  rows: ParsedCsvRow[],
) {
  if (!rows.length) {
    return {
      insertedOrUpdated: 0,
    };
  }

  await prisma.$transaction(
    rows.map((row) =>
      prisma.pincode.upsert({
        where: {
          shopId_pincode: {
            shopId,
            pincode:
              row.pincode,
          },
        },

        update: {
          city:
            row.city ?? null,

          state:
            row.state ?? null,

          country:
            row.country ?? null,

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

        create: {
          shopId,

          pincode:
            row.pincode,

          city:
            row.city ?? null,

          state:
            row.state ?? null,

          country:
            row.country ?? null,

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
      }),
    ),
  );

  return {
    insertedOrUpdated:
      rows.length,
  };
}

export async function enforcePincodePlanLimit({
  shopId,
  isPro,
}: {
  shopId: string;
  isPro: boolean;
}) {
  /*
   * Restore only records that were automatically disabled
   * because of the Free-plan limit.
   *
   * Manually inactive records remain inactive.
   */
  if (isPro) {
    const restored =
      await prisma.pincode.updateMany({
        where: {
          shopId,
          disabledByPlan: true,
        },

        data: {
          isActive: true,
          disabledByPlan:
            false,
        },
      });

    return {
      plan:
        "pro" as const,

      restrictedCount:
        0,

      newlyRestrictedCount:
        0,

      restoredCount:
        restored.count,
    };
  }

  /*
   * The oldest 100 records are allowed on Free.
   */
  const allowedPincodes =
    await prisma.pincode.findMany({
      where: {
        shopId,
      },

      orderBy: [
        {
          createdAt: "asc",
        },
        {
          id: "asc",
        },
      ],

      take:
        FREE_PINCODE_LIMIT,

      select: {
        id: true,
      },
    });

  const allowedIds =
    allowedPincodes.map(
      (item) => item.id,
    );

  return prisma.$transaction(
    async (transaction) => {
      /*
       * If older records were deleted, a previously
       * restricted record may now enter the first 100.
       */
      if (
        allowedIds.length > 0
      ) {
        await transaction.pincode.updateMany({
          where: {
            shopId,

            id: {
              in:
                allowedIds,
            },

            disabledByPlan:
              true,
          },

          data: {
            isActive: true,
            disabledByPlan:
              false,
          },
        });
      }

      /*
       * Disable active records beyond the first 100.
       *
       * Manually inactive records remain manually inactive
       * and are not marked disabledByPlan.
       */
      const newlyRestricted =
        await transaction.pincode.updateMany({
          where: {
            shopId,
            isActive: true,

            ...(allowedIds.length >
            0
              ? {
                  id: {
                    notIn:
                      allowedIds,
                  },
                }
              : {}),
          },

          data: {
            isActive: false,
            disabledByPlan:
              true,
          },
        });

      const restrictedCount =
        await transaction.pincode.count({
          where: {
            shopId,
            disabledByPlan:
              true,
          },
        });

      return {
        plan:
          "free" as const,

        restrictedCount,

        newlyRestrictedCount:
          newlyRestricted.count,

        restoredCount:
          0,
      };
    },
  );
}