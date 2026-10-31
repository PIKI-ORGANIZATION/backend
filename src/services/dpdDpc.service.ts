import prisma from "../config/prisma";
import { RequestScope } from "../middlewares/scope.middleware";
import { CreateDpdDpcInput, UpdateDpdDpcInput } from "../validators/dpdDpc.schema";

const httpError = (statusCode: number, message: string) =>
  Object.assign(new Error(message), { statusCode });

// Hierarki lihat: DPP semua, DPD semua DPC di provinsinya, DPC hanya dirinya sendiri
const getScopeWhere = async (scope: RequestScope) => {
  if (scope.isSuperAdmin) return {};

  if (scope.tingkat === "DPD" && scope.dpdId) {
    const dpd = await prisma.dpd.findFirst({
      where: { id: scope.dpdId, deletedAt: null },
      select: { kodeProvinsi: true },
    });
    if (dpd?.kodeProvinsi) return { kode_provinsi: dpd.kodeProvinsi };
  }

  if (scope.tingkat === "DPC" && scope.dpcId) return { id: scope.dpcId };

  throw httpError(403, "Akun tidak memiliki akses ke data DPC");
};

// Nama DPC, nama DPD & kode provinsi diturunkan dari kode kabupaten
const getWilayahKabupaten = async (kodeKabupaten: string) => {
  const wilayah = await prisma.dataMasterWilayah.findFirst({
    where: { kode_kabupaten: kodeKabupaten },
    select: { kode_provinsi: true, nama_provinsi: true, nama_kabupaten: true },
  });
  if (!wilayah?.nama_kabupaten) {
    throw httpError(400, "Kode kabupaten/kota tidak ditemukan di data master wilayah");
  }
  return {
    dpc: wilayah.nama_kabupaten,
    dpd: wilayah.nama_provinsi,
    kode_provinsi: wilayah.kode_provinsi,
  };
};

const cekKodeKabupatenTersedia = async (kodeKabupaten: string, kecualiId?: number) => {
  const existing = await prisma.dpdDpc.findFirst({
    where: { kode_kabupaten: kodeKabupaten, ...(kecualiId && { NOT: { id: kecualiId } }) },
  });
  if (existing) {
    throw httpError(
      409,
      existing.deleted_at
        ? "DPC untuk kabupaten/kota ini pernah dibuat dan sudah dihapus"
        : "DPC untuk kabupaten/kota ini sudah ada"
    );
  }
};

export const getDpdDpcList = async (
  scope: RequestScope,
  {
    search,
    kode_provinsi,
    currentPage,
    pageSize,
  }: { search?: string; kode_provinsi?: string; currentPage: number; pageSize: number }
) => {
  // AND agar filter hierarki tidak tertimpa filter lain
  const where = {
    AND: [
      { deleted_at: null },
      await getScopeWhere(scope),
      kode_provinsi ? { kode_provinsi } : {},
      search
        ? {
            OR: [
              { dpd: { contains: search, mode: "insensitive" as const } },
              { dpc: { contains: search, mode: "insensitive" as const } },
              { pengurus: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {},
    ],
  };

  const [total, data] = await Promise.all([
    prisma.dpdDpc.count({ where }),
    prisma.dpdDpc.findMany({
      where,
      skip: (currentPage - 1) * pageSize,
      take: pageSize,
      orderBy: { updated_at: "desc" },
    }),
  ]);

  return { total, data, page: currentPage, limit: pageSize };
};

export const getDpdDpcById = async (scope: RequestScope, id: number) => {
  return await prisma.dpdDpc.findFirst({
    where: { AND: [{ id, deleted_at: null }, await getScopeWhere(scope)] },
  });
};

export const createDpdDpc = async (data: CreateDpdDpcInput, actorUuid?: string) => {
  const wilayah = await getWilayahKabupaten(data.kode_kabupaten);
  await cekKodeKabupatenTersedia(data.kode_kabupaten);

  return await prisma.dpdDpc.create({
    data: {
      ...data,
      ...wilayah,
      created_by: actorUuid,
      updated_by: actorUuid,
    },
  });
};

export const updateDpdDpc = async (
  scope: RequestScope,
  id: number,
  data: UpdateDpdDpcInput,
  actorUuid?: string
) => {
  // Hak ubah: DPP semua DPC, DPC hanya dirinya sendiri (DPD hanya bisa melihat)
  const bolehUbah = scope.isSuperAdmin || (scope.tingkat === "DPC" && scope.dpcId === id);
  if (!bolehUbah) throw httpError(403, "Akun tidak memiliki akses untuk mengubah data DPC ini");

  const existing = await prisma.dpdDpc.findFirst({ where: { id, deleted_at: null } });
  if (!existing) throw httpError(404, "Data DPC tidak ditemukan");

  let wilayah = {};
  if (data.kode_kabupaten && data.kode_kabupaten !== existing.kode_kabupaten) {
    wilayah = await getWilayahKabupaten(data.kode_kabupaten);
    await cekKodeKabupatenTersedia(data.kode_kabupaten, id);
  }

  return await prisma.dpdDpc.update({
    where: { id },
    data: {
      ...data,
      ...wilayah,
      updated_by: actorUuid,
    },
  });
};

export const softDeleteDpdDpc = async (id: number, actorUuid?: string) => {
  const existing = await prisma.dpdDpc.findFirst({ where: { id, deleted_at: null } });
  if (!existing) throw httpError(404, "Data DPC tidak ditemukan");

  return await prisma.dpdDpc.update({
    where: { id },
    data: {
      deleted_at: new Date(),
      deleted_by: actorUuid,
    },
  });
};
