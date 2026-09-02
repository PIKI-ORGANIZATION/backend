import { prisma } from "../config/prisma";

/**
 * 1. Ambil daftar unik DPD (Provinsi) dari dpd_dpc / data_master_wilayah
 */
export const getDpdList = async () => {
  // Group by dpd & kode_provinsi di tabel dpd_dpc
  const list = await prisma.dpdDpc.groupBy({
    by: ["dpd", "kode_provinsi"],
    where: {
      dpd: { not: null },
    },
    orderBy: {
      dpd: "asc",
    },
  });

  return list.map((item) => ({
    dpd: item.dpd,
    kode_provinsi: item.kode_provinsi,
  }));
};

/**
 * 2. Ambil daftar DPC (Kabupaten/Kota) yang berada di bawah DPD / Kode Provinsi tertentu
 */
export const getDpcList = async (params: { dpd?: string; kode_provinsi?: string }) => {
  const where: any = {
    dpc: { not: null },
  };

  if (params.dpd) {
    where.dpd = { equals: params.dpd, mode: "insensitive" };
  } else if (params.kode_provinsi) {
    where.kode_provinsi = params.kode_provinsi;
  }

  const list = await prisma.dpdDpc.findMany({
    where,
    orderBy: {
      dpc: "asc",
    },
    select: {
      id: true,
      dpd: true,
      dpc: true,
      kode_provinsi: true,
      kode_kabupaten: true,
      pengurus: true,
      no_handphone: true,
      keterangan: true,
      penerbitan_sk: true,
    },
  });

  return list;
};

/**
 * 3. Ambil Master Provinsi Lengkap (dari data_master_wilayah)
 */
export const getMasterProvinsi = async () => {
  const list = await prisma.dataMasterWilayah.groupBy({
    by: ["kode_provinsi", "nama_provinsi"],
    where: {
      kode_provinsi: { not: null },
      nama_provinsi: { not: null },
    },
    orderBy: {
      nama_provinsi: "asc",
    },
  });

  return list.map((item) => ({
    kode_provinsi: item.kode_provinsi,
    nama_provinsi: item.nama_provinsi,
  }));
};

/**
 * 4. Ambil Master Kabupaten/Kota berdasarkan kode_provinsi (dari data_master_wilayah)
 */
export const getMasterKabupaten = async (kode_provinsi?: string) => {
  const where: any = {
    kode_kabupaten: { not: null },
    nama_kabupaten: { not: null },
  };

  if (kode_provinsi) {
    where.kode_provinsi = kode_provinsi;
  }

  const list = await prisma.dataMasterWilayah.groupBy({
    by: ["kode_provinsi", "nama_provinsi", "kode_kabupaten", "nama_kabupaten"],
    where,
    orderBy: {
      nama_kabupaten: "asc",
    },
  });

  return list.map((item) => ({
    kode_provinsi: item.kode_provinsi,
    nama_provinsi: item.nama_provinsi,
    kode_kabupaten: item.kode_kabupaten,
    nama_kabupaten: item.nama_kabupaten,
  }));
};
