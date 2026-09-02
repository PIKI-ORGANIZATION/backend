import prisma from "../config/prisma";
import { DpdDpcInput, UpdateDpdDpcInput } from "../validators/dpdDpc.schema";

export const getDpdDpcList = async ({
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
          { dpc: { contains: search, mode: "insensitive" as const } },
          { pengurus: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  const total = await prisma.dpdDpc.count({ where });
  const data = await prisma.dpdDpc.findMany({
    where,
    skip,
    take,
    orderBy: { updated_at: "desc" },
  });

  return { total, data, page: skip && take ? Math.floor(skip / take) + 1 : 1, limit: take || total };
};

export const getDpdDpcById = async (id: number) => {
  return await prisma.dpdDpc.findUnique({
    where: { id },
  });
};

export const createDpdDpc = async (data: DpdDpcInput) => {
  return await prisma.dpdDpc.create({
    data,
  });
};

export const updateDpdDpc = async (id: number, data: UpdateDpdDpcInput) => {
  return await prisma.dpdDpc.update({
    where: { id },
    data,
  });
};

export const deleteDpdDpc = async (id: number) => {
  return await prisma.dpdDpc.delete({
    where: { id },
  });
};
