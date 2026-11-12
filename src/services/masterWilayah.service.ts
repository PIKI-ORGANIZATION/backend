import { prisma } from "../config/prisma";

/**
 * 1. Ambil daftar unik DPD (Provinsi) dari tabel Dpd resmi (38 DPD se-Indonesia)
 *    dengan fallback ke data_master_wilayah jika tabel Dpd belum memiliki data.
 */
export const getDpdList = async () => {
  // 1. Ambil dari tabel Dpd (38 DPD resmi)
  let listDpd: { dpd: string | null; kodeProvinsi: string | null }[] = [];
  try {
    listDpd = await prisma.dpd.findMany({
      where: {
        deletedAt: null,
        dpd: { not: null },
      } as any,
      orderBy: {
        dpd: "asc",
      },
      select: {
        dpd: true,
        kodeProvinsi: true,
      },
    });
  } catch (error) {
    // Database yang belum menjalankan migrasi dpd_dpc_hierarki belum memiliki kolom deletedAt
    console.warn("[masterWilayah] Gagal membaca tabel dpd, memakai data_master_wilayah:", (error as Error).message?.split("\n").pop());
  }

  if (listDpd && listDpd.length > 0) {
    return listDpd.map((item) => ({
      dpd: item.dpd,
      kode_provinsi: item.kodeProvinsi,
    }));
  }

  // Fallback ke master provinsi jika tabel Dpd kosong
  const masterList = await prisma.dataMasterWilayah.groupBy({
    by: ["kode_provinsi", "nama_provinsi"],
    where: {
      kode_provinsi: { not: null },
      nama_provinsi: { not: null },
    },
    orderBy: {
      nama_provinsi: "asc",
    },
  });

  return masterList.map((item) => ({
    dpd: item.nama_provinsi,
    kode_provinsi: item.kode_provinsi,
  }));
};

/**
 * 2. Ambil daftar DPC (Kabupaten/Kota) yang berada di bawah DPD / Kode Provinsi tertentu
 */
export const getDpcList = async (params: { dpd?: string; kode_provinsi?: string }) => {
  let kodeProv = params.kode_provinsi;

  // Jika kode_provinsi belum dikirim, cari dari nama DPD di tabel Dpd atau data_master_wilayah
  if (!kodeProv && params.dpd) {
    const dpdRecord = await prisma.dpd
      .findFirst({
        where: { dpd: { equals: params.dpd, mode: "insensitive" } },
        select: { kodeProvinsi: true },
      })
      .catch(() => null);
    kodeProv = dpdRecord?.kodeProvinsi || undefined;

    if (!kodeProv) {
      const masterProv = await prisma.dataMasterWilayah.findFirst({
        where: { nama_provinsi: { equals: params.dpd, mode: "insensitive" } },
        select: { kode_provinsi: true },
      });
      kodeProv = masterProv?.kode_provinsi || undefined;
    }
  }

  const where: any = {
    dpc: { not: null },
    deleted_at: null,
  };

  if (kodeProv) {
    where.OR = [
      { kode_provinsi: kodeProv },
      ...(params.dpd ? [{ dpd: { equals: params.dpd, mode: "insensitive" as const } }] : []),
    ];
  } else if (params.dpd) {
    where.dpd = { equals: params.dpd, mode: "insensitive" };
  }

  // 1. Ambil DPC yang sudah terdaftar di tabel dpd_dpc
  const dpcSelect = {
    id: true,
    dpd: true,
    dpc: true,
    kode_provinsi: true,
    kode_kabupaten: true,
    pengurus: true,
    no_handphone: true,
    keterangan: true,
    penerbitan_sk: true,
  } as const;

  let list: any[] = [];
  try {
    list = await prisma.dpdDpc.findMany({
      where,
      orderBy: { dpc: "asc" },
      select: dpcSelect,
    });
  } catch (error) {
    // Database yang belum menjalankan migrasi dpd_dpc_hierarki belum memiliki kolom deleted_at
    console.warn("[masterWilayah] Gagal membaca dpd_dpc dengan filter deleted_at, mencoba tanpa filter:", (error as Error).message?.split("\n").pop());
    const { deleted_at, ...legacyWhere } = where;
    list = await prisma.dpdDpc
      .findMany({
        where: legacyWhere,
        orderBy: { dpc: "asc" },
        select: dpcSelect,
      })
      .catch(() => []);
  }

  if (!kodeProv && !params.dpd) return list;

  // 2. Lengkapi dengan kabupaten/kota resmi dari data_master_wilayah yang DPC-nya belum terbentuk
  // agar calon anggota di seluruh kabupaten/kota tetap dapat mendaftar.
  const masterWhere: any = {
    kode_kabupaten: { not: null },
    nama_kabupaten: { not: null },
  };
  if (kodeProv) {
    masterWhere.kode_provinsi = kodeProv;
  } else if (params.dpd) {
    masterWhere.nama_provinsi = { equals: params.dpd, mode: "insensitive" };
  }

  const masterKabupatens = await prisma.dataMasterWilayah.groupBy({
    by: ["kode_provinsi", "nama_provinsi", "kode_kabupaten", "nama_kabupaten"],
    where: masterWhere,
    orderBy: {
      nama_kabupaten: "asc",
    },
  });

  const kodeTerdaftar = new Set(list.map((item) => item.kode_kabupaten).filter(Boolean));
  const namaTerdaftar = new Set(list.map((item) => (item.dpc || "").toLowerCase()));

  const belumTerbentuk = masterKabupatens
    .filter(
      (mk) =>
        !kodeTerdaftar.has(mk.kode_kabupaten) &&
        !namaTerdaftar.has((mk.nama_kabupaten || "").toLowerCase()),
    )
    .map((mk) => ({
      id: mk.kode_kabupaten || mk.nama_kabupaten || "",
      dpd: params.dpd || mk.nama_provinsi || "",
      dpc: mk.nama_kabupaten || "",
      kode_provinsi: mk.kode_provinsi || kodeProv || "",
      kode_kabupaten: mk.kode_kabupaten || "",
      pengurus: null,
      no_handphone: null,
      keterangan: "DPC Belum Terbentuk",
      penerbitan_sk: null,
    }));

  return [...list, ...belumTerbentuk].sort((a, b) =>
    (a.dpc || "").localeCompare(b.dpc || "", "id"),
  );
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
