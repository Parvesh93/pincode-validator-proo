import prisma from "../db.server";
import type { ParsedCsvRow } from "./csv.server";

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

function normalizePincode(value: string) {
  return value.trim();
}

export async function getOrCreateShopByDomain(shopDomain: string) {
  return prisma.shop.upsert({
    where: { shopDomain },
    update: {},
    create: { shopDomain },
  });
}

export async function getShopByDomain(shopDomain: string) {
  return prisma.shop.findUnique({
    where: { shopDomain },
  });
}

export async function getPincodesByShop(
  shopId: string,
  search?: string,
) {
  const normalizedSearch = search?.trim() || "";

  return prisma.pincode.findMany({
    where: {
      shopId,
      ...(normalizedSearch
        ? {
            OR: [
              {
                pincode: {
                  contains: normalizedSearch,
                  mode: "insensitive",
                },
              },
              {
                city: {
                  contains: normalizedSearch,
                  mode: "insensitive",
                },
              },
              {
                state: {
                  contains: normalizedSearch,
                  mode: "insensitive",
                },
              },
            ],
          }
        : {}),
    },
    orderBy: {
      pincode: "asc",
    },
  });
}

export async function getPaginatedPincodes({
  shopId,
  search = "",
  page = 1,
  pageSize = 25,
}: GetPaginatedPincodesInput) {
  const safePage =
    Number.isInteger(page) && page > 0 ? page : 1;

  const safePageSize = Math.min(
    100,
    Math.max(
      1,
      Number.isInteger(pageSize) ? pageSize : 25,
    ),
  );

  const normalizedSearch = search.trim();

  const where = {
    shopId,
    ...(normalizedSearch
      ? {
          OR: [
            {
              pincode: {
                contains: normalizedSearch,
                mode: "insensitive" as const,
              },
            },
            {
              city: {
                contains: normalizedSearch,
                mode: "insensitive" as const,
              },
            },
            {
              state: {
                contains: normalizedSearch,
                mode: "insensitive" as const,
              },
            },
          ],
        }
      : {}),
  };

  const totalCount = await prisma.pincode.count({
    where,
  });

  const totalPages = Math.max(
    1,
    Math.ceil(totalCount / safePageSize),
  );

  const currentPage = Math.min(safePage, totalPages);

  const pincodes = await prisma.pincode.findMany({
    where,
    orderBy: {
      pincode: "asc",
    },
    skip: (currentPage - 1) * safePageSize,
    take: safePageSize,
  });

  return {
    pincodes,
    totalCount,
    totalPages,
    currentPage,
    pageSize: safePageSize,
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

export async function createPincode(input: PincodeInput) {
  const pincode = normalizePincode(input.pincode);

  return prisma.pincode.create({
    data: {
      shopId: input.shopId,
      pincode,
      city: input.city ?? null,
      state: input.state ?? null,
      country: input.country ?? null,
      codAvailable: input.codAvailable ?? false,
      prepaidAvailable: input.prepaidAvailable ?? true,
      estDeliveryDays: input.estDeliveryDays ?? null,
      isActive: input.isActive ?? true,
      source: input.source ?? "manual",
    },
  });
}

export async function updatePincode(
  id: string,
  shopId: string,
  input: Omit<PincodeInput, "shopId">,
) {
  const existing = await getPincodeById(id, shopId);

  if (!existing) {
    throw new Error("Pincode not found");
  }

  return prisma.pincode.update({
    where: { id },
    data: {
      pincode: normalizePincode(input.pincode),
      city: input.city ?? null,
      state: input.state ?? null,
      country: input.country ?? null,
      codAvailable: input.codAvailable ?? false,
      prepaidAvailable: input.prepaidAvailable ?? true,
      estDeliveryDays: input.estDeliveryDays ?? null,
      isActive: input.isActive ?? true,
      source: input.source ?? existing.source ?? "manual",
    },
  });
}

export async function upsertSinglePincode(
  input: PincodeInput,
) {
  const pincode = normalizePincode(input.pincode);

  return prisma.pincode.upsert({
    where: {
      shopId_pincode: {
        shopId: input.shopId,
        pincode,
      },
    },
    update: {
      city: input.city ?? null,
      state: input.state ?? null,
      country: input.country ?? null,
      codAvailable: input.codAvailable ?? false,
      prepaidAvailable: input.prepaidAvailable ?? true,
      estDeliveryDays: input.estDeliveryDays ?? null,
      isActive: input.isActive ?? true,
      source: input.source ?? "manual",
    },
    create: {
      shopId: input.shopId,
      pincode,
      city: input.city ?? null,
      state: input.state ?? null,
      country: input.country ?? null,
      codAvailable: input.codAvailable ?? false,
      prepaidAvailable: input.prepaidAvailable ?? true,
      estDeliveryDays: input.estDeliveryDays ?? null,
      isActive: input.isActive ?? true,
      source: input.source ?? "manual",
    },
  });
}

export async function deletePincode(
  id: string,
  shopId: string,
) {
  const existing = await getPincodeById(id, shopId);

  if (!existing) {
    throw new Error("Pincode not found");
  }

  return prisma.pincode.delete({
    where: { id },
  });
}

export async function bulkDeletePincodes(
  ids: string[],
  shopId: string,
) {
  if (!ids.length) {
    return { count: 0 };
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

export async function bulkUpsertPincodes(
  shopId: string,
  rows: ParsedCsvRow[],
) {
  if (!rows.length) {
    return { insertedOrUpdated: 0 };
  }

  await prisma.$transaction(
    rows.map((row) =>
      prisma.pincode.upsert({
        where: {
          shopId_pincode: {
            shopId,
            pincode: row.pincode,
          },
        },
        update: {
          city: row.city ?? null,
          state: row.state ?? null,
          country: row.country ?? null,
          codAvailable: row.codAvailable,
          prepaidAvailable: row.prepaidAvailable,
          estDeliveryDays:
            row.estDeliveryDays ?? null,
          isActive: row.isActive,
          source: row.source,
        },
        create: {
          shopId,
          pincode: row.pincode,
          city: row.city ?? null,
          state: row.state ?? null,
          country: row.country ?? null,
          codAvailable: row.codAvailable,
          prepaidAvailable: row.prepaidAvailable,
          estDeliveryDays:
            row.estDeliveryDays ?? null,
          isActive: row.isActive,
          source: row.source,
        },
      }),
    ),
  );

  return {
    insertedOrUpdated: rows.length,
  };
}