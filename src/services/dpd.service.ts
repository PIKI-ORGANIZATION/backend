import prisma from "../config/prisma";
import { RequestScope } from "../middlewares/scope.middleware";
import { CreateDpdInput, UpdateDpdInput } from "../validators/dpd.schema";

const httpError = (statusCode: number, message: string) =>
  Object.assign(new Error(message), { statusCode });

// Hierarki: DPP melihat semua, DPD hanya dirinya sendiri, selain itu tertutup
const getScopeWhere = (scope: RequestScope) => {
  if (scope.isSuperAdmin) return {};
  if (scope.tingkat === "DPD" && scope.dpdId) return { id: scope.dpdId };
  throw httpError(403, "Akun tidak memiliki akses ke data DPD");
};

const getNamaProvinsi = async (kodeProvinsi: string) => {
  const wilayah = await prisma.dataMasterWilayah.findFirst({
    where: { kode_provinsi: kodeProvinsi },
    select: { nama_provinsi: true },
  });
  if (!wilayah?.nama_provinsi) {
    throw httpError(400, "Kode provinsi tidak ditemukan di data master wilayah");
  }
  return wilayah.nama_provinsi;
};

const cekKodeProvinsiTersedia = async (kodeProvinsi: string, kecualiId?: string) => {
  const existing = await prisma.dpd.findFirst({
    where: { kodeProvinsi, ...(kecualiId && { NOT: { id: kecualiId } }) },
  });
  if (existing) {
    throw httpError(
      409,
      existing.deletedAt
        ? "DPD untuk provinsi ini pernah dibuat dan sudah dihapus"
        : "DPD untuk provinsi ini sudah ada"
    );
  }
};

export const getDpdList = async (
  scope: RequestScope,
  { search, currentPage, pageSize }: { search?: string; currentPage: number; pageSize: number }
) => {
  // AND agar filter hierarki tidak tertimpa filter lain
  const where = {
    AND: [
      { deletedAt: null },
      getScopeWhere(scope),
      search
        ? {
            OR: [
              { dpd: { contains: search, mode: "insensitive" as const } },
              { kodeProvinsi: { contains: search, mode: "insensitive" as const } },
              { pengurus: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {},
    ],
  };

  const [total, data] = await Promise.all([
    prisma.dpd.count({ where }),
    prisma.dpd.findMany({
      where,
      skip: (currentPage - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return { total, data, page: currentPage, limit: pageSize };
};

export const getDpdById = async (scope: RequestScope, id: string) => {
  return await prisma.dpd.findFirst({
    where: { AND: [{ id, deletedAt: null }, getScopeWhere(scope)] },
  });
};

export const createDpd = async (data: CreateDpdInput, actorUuid?: string) => {
  const dpd = await getNamaProvinsi(data.kodeProvinsi);
  await cekKodeProvinsiTersedia(data.kodeProvinsi);

  return await prisma.dpd.create({
    data: {
      ...data,
      dpd,
      createdBy: actorUuid,
      updatedBy: actorUuid,
    },
  });
};

export const updateDpd = async (
  scope: RequestScope,
  id: string,
  data: UpdateDpdInput,
  actorUuid?: string
) => {
  const existing = await getDpdById(scope, id);
  if (!existing) throw httpError(404, "Data DPD tidak ditemukan");

  let dpd: string | undefined;
  if (data.kodeProvinsi && data.kodeProvinsi !== existing.kodeProvinsi) {
    dpd = await getNamaProvinsi(data.kodeProvinsi);
    await cekKodeProvinsiTersedia(data.kodeProvinsi, id);
  }

  return await prisma.dpd.update({
    where: { id },
    data: {
      ...data,
      ...(dpd && { dpd }),
      updatedBy: actorUuid,
    },
  });
};

export const softDeleteDpd = async (id: string, actorUuid?: string) => {
  const existing = await prisma.dpd.findFirst({ where: { id, deletedAt: null } });
  if (!existing) throw httpError(404, "Data DPD tidak ditemukan");

  return await prisma.dpd.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      deletedBy: actorUuid,
    },
  });
};
