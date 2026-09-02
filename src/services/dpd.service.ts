import prisma from "../config/prisma";
import { DpdInput, UpdateDpdInput } from "../validators/dpd.schema";

export const getDpdList = async ({
  search,
  skip,
  take,
}: {
  search?: string;
  skip?: number;
  take?: number;
}) => {
  const where = search
    ? {
        OR: [
          { dpd: { contains: search, mode: "insensitive" as const } },
          { kodeProvinsi: { contains: search, mode: "insensitive" as const } },
          { pengurus: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  const total = await prisma.dpd.count({ where });
  const data = await prisma.dpd.findMany({
    where,
    skip,
    take,
    orderBy: { createdAt: "desc" },
  });

  return { total, data, page: skip && take ? Math.floor(skip / take) + 1 : 1, limit: take || total };
};

export const getDpdById = async (id: string) => {
  return await prisma.dpd.findUnique({
    where: { id },
  });
};

export const createDpd = async (data: DpdInput, actorUuid?: string) => {
  return await prisma.dpd.create({
    data: {
      ...data,
      createdBy: actorUuid,
      updatedBy: actorUuid,
    },
  });
};

export const updateDpd = async (id: string, data: UpdateDpdInput, actorUuid?: string) => {
  return await prisma.dpd.update({
    where: { id },
    data: {
      ...data,
      updatedBy: actorUuid,
    },
  });
};

export const deleteDpd = async (id: string) => {
  return await prisma.dpd.delete({
    where: { id },
  });
};
