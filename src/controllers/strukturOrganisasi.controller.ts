import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { ApiResponse } from "../utils/apiResponse";

////////////////////////////////////////////////////
// GET ALL STRUKTUR ORGANISASI
////////////////////////////////////////////////////
export const getStrukturOrganisasi = async (req: Request, res: Response) => {
  try {
    const { search, currentPage, pageSize, fixed, periodeUuid } =
      req.query as {
        search?: string;
        currentPage?: string;
        pageSize?: string;
        fixed?: string;
        periodeUuid?: string;
      };

    const scope = req.scope;

    const page = Number(currentPage) || 1;
    const size = Number(pageSize) || 10;
    const skip = (page - 1) * size;

    const whereCondition: any = {};

    ////////////////////////////////////////////////////
    // SEARCH
    ////////////////////////////////////////////////////
    if (search) {
      whereCondition.OR = [
        {
          jabatan: {
            namaJabatan: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
        {
          bidang: {
            namaBidang: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
        {
          anggota: {
            namaLengkap: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
      ];
    }

    ////////////////////////////////////////////////////
    // FILTER PERIODE UUID
    ////////////////////////////////////////////////////
    if (periodeUuid) {
      whereCondition.periodeUuid = periodeUuid;
    }

    const includeAll = fixed?.toLowerCase() === "all";

    ////////////////////////////////////////////////////
    // ROLE BASED (SCOPE + RELATION FIX)
    ////////////////////////////////////////////////////

    if (!scope?.isAdmin) {
      // PUBLIC → hanya periode aktif
      whereCondition.periode = {
        isAktif: true,
      };
    } else {
      // 🛠 ADMIN

      if (!scope.isSuperAdmin) {
        // FILTER CABANG via relasi periode
        whereCondition.periode = {
          ...(whereCondition.periode || {}),
          cabangUuid: scope.cabangId,
        };
      }

      // default tetap hanya aktif kecuali fixed=all
      if (!includeAll) {
        whereCondition.periode = {
          ...(whereCondition.periode || {}),
          isAktif: true,
        };
      }
    }

    ////////////////////////////////////////////////////

    const total = await prisma.strukturOrganisasi.count({
      where: whereCondition,
    });

    const struktur = await prisma.strukturOrganisasi.findMany({
      where: whereCondition,
      include: {
        anggota: true,
        periode: {
          include: {
            cabang: true,
          },
        },
        jabatan: true,
        bidang: true,
      },
      orderBy: [
        { jabatan: { levelJabatan: "asc" } },
        { urutan: "asc" },
      ],
      skip,
      take: size,
    });

    return res.status(200).json(
      ApiResponse.success({
        result: struktur,
        pagination: {
          currentPage: page,
          pageSize: size,
          total,
        },
      })
    );
  } catch (error: any) {
    res.status(500).json({
      message: "Failed to fetch struktur organisasi",
      error: error.message,
    });
  }
};

export const getStrukturOrganisasiAdminByCabang = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      search,
      currentPage,
      pageSize,
      fixed,
      periodeUuid,
    } = req.query as {
      search?: string;
      currentPage?: string;
      pageSize?: string;
      fixed?: string;
      periodeUuid?: string;
    };

    const page = Number(currentPage) || 1;
    const size = Number(pageSize) || 10;
    const skip = (page - 1) * size;

    const uuid = req.user?.cabangId;
    const isManageAllCabang =
      req.user?.permissions.includes("MANAGE_ALL_CABANG");

    const whereCondition: any = {};

    ////////////////////////////////////////////////////
    // FILTER CABANG (FIXED)
    ////////////////////////////////////////////////////
    if (!isManageAllCabang) {
      whereCondition.periode = {
        cabangUuid: uuid,
      };
    }

    ////////////////////////////////////////////////////
    // SEARCH
    ////////////////////////////////////////////////////
    if (search) {
      whereCondition.OR = [
        {
          jabatan: {
            namaJabatan: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
        {
          bidang: {
            namaBidang: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
        {
          anggota: {
            namaLengkap: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
      ];
    }

    ////////////////////////////////////////////////////
    // FILTER PERIODE (IMPORTANT: merge, jangan overwrite)
    ////////////////////////////////////////////////////
    if (periodeUuid) {
      whereCondition.periode = {
        ...(whereCondition.periode || {}),
        uuid: periodeUuid,
      };
    }

    ////////////////////////////////////////////////////
    // FIXED LOGIC (merge juga)
    ////////////////////////////////////////////////////
    if (fixed?.toLowerCase() !== "all") {
      whereCondition.periode = {
        ...(whereCondition.periode || {}),
        isAktif: true,
      };
    }

    ////////////////////////////////////////////////////
    // TOTAL
    ////////////////////////////////////////////////////
    const total = await prisma.strukturOrganisasi.count({
      where: whereCondition,
    });

    ////////////////////////////////////////////////////
    // QUERY DATA
    ////////////////////////////////////////////////////
    const struktur = await prisma.strukturOrganisasi.findMany({
      where: whereCondition,
      include: {
        anggota: true,
        periode: true,
        jabatan: true,
        bidang: true,
      },
      orderBy: [
        { jabatan: { levelJabatan: "asc" } },
        { urutan: "asc" },
      ],
      skip,
      take: size,
    });

    ////////////////////////////////////////////////////
    // RESPONSE
    ////////////////////////////////////////////////////
    return res.status(200).json(
      ApiResponse.success({
        result: struktur,
        pagination: {
          currentPage: page,
          pageSize: size,
          total,
        },
      })
    );
  } catch (error: any) {
    res.status(500).json({
      message: "Failed to fetch struktur organisasi",
      error: error.message,
    });
  }
};

export const getStrukturOrganisasiById = async (req: Request, res: Response) => {
  try {
    const { uuid } = req.params;
    const data = await prisma.strukturOrganisasi.findUnique({
      where: { uuid },
      include: {
        anggota: true,
        periode: true,
        jabatan: true,
        bidang: true,
      },
    });

    if (!data) {
      return res.status(404).json({ message: "Struktur organisasi tidak ditemukan" });
    }
    return res.status(200).json(ApiResponse.success(data));
  } catch (error: any) {    res.status(500).json({
      message: "Failed to fetch struktur organisasi",
      error: error.message,
    });
  }
};

////////////////////////////////////////////////////
// CREATE STRUKTUR ORGANISASI
////////////////////////////////////////////////////
export const createStrukturOrganisasi = async (
  req: Request,
  res: Response
) => {
  try {
    const user = req.user!;
    const dataArray = Array.isArray(req.body) ? req.body : [req.body];

    if (dataArray.length === 0) {
      return res.status(400).json({ message: "Data tidak boleh kosong" });
    }

    ////////////////////////////////////////////////////
    // VALIDASI FIELD WAJIB
    ////////////////////////////////////////////////////
    for (const d of dataArray) {
      if (!d.periodeUuid || !d.anggotaUuid || !d.jabatanUuid) {
        return res.status(400).json({
          message: "periodeUuid, anggotaUuid, dan jabatanUuid wajib diisi",
        });
      }
    }

    const periodeUuid = dataArray[0].periodeUuid;

    ////////////////////////////////////////////////////
    // VALIDASI PERIODE
    ////////////////////////////////////////////////////
    const periode = await prisma.periodeKepengurusan.findUnique({
      where: { uuid: periodeUuid },
    });

    if (!periode) {
      return res.status(400).json({ message: "Periode tidak ditemukan" });
    }

    ////////////////////////////////////////////////////
    // VALIDASI ANGGOTA
    ////////////////////////////////////////////////////
    const anggotaUuids = dataArray.map((d) => d.anggotaUuid);

    const anggotas = await prisma.anggota.findMany({
      where: { uuid: { in: anggotaUuids } },
    });

    if (anggotas.length !== anggotaUuids.length) {
      return res.status(400).json({
        message: "Ada anggota yang tidak ditemukan",
      });
    }

    ////////////////////////////////////////////////////
    // VALIDASI JABATAN EXIST
    ////////////////////////////////////////////////////
    const jabatanUuids = dataArray.map((d) => d.jabatanUuid);

    const jabatans = await prisma.jabatan.findMany({
      where: { uuid: { in: jabatanUuids } },
    });

    if (jabatans.length !== jabatanUuids.length) {
      return res.status(400).json({
        message: "Ada jabatan yang tidak ditemukan",
      });
    }

    ////////////////////////////////////////////////////
    // VALIDASI ANGGOTA DOUBLE ROLE
    ////////////////////////////////////////////////////
    const anggotaExist = await prisma.strukturOrganisasi.findMany({
      where: {
        periodeUuid,
        anggotaUuid: { in: anggotaUuids },
      },
    });

    if (anggotaExist.length > 0) {
      return res.status(400).json({
        message: "Ada anggota yang sudah punya jabatan di periode ini",
      });
    }

    ////////////////////////////////////////////////////
    // VALIDASI JABATAN UNIK (LEVEL 0 / NON ANGGOTA)
    ////////////////////////////////////////////////////
    const jabatanMap = new Map(
      jabatans.map((j) => [j.uuid, j])
    );

    for (const d of dataArray) {
      const jabatan = jabatanMap.get(d.jabatanUuid);

      if (jabatan?.levelJabatan === 0) {
        const exist = await prisma.strukturOrganisasi.findFirst({
          where: {
            periodeUuid,
            jabatanUuid: d.jabatanUuid,
            bidangUuid: d.bidangUuid ?? null,
          },
        });

        if (exist) {
          return res.status(400).json({
            message: "Jabatan level tinggi sudah terisi",
          });
        }
      }
    }

    ////////////////////////////////////////////////////
    // CREATE
    ////////////////////////////////////////////////////
    const created = await prisma.strukturOrganisasi.createMany({
      data: dataArray.map((d) => ({
        ...d,
        insert_by: user.sub,
      })),
    });

    return res.status(201).json(
      ApiResponse.success({
        message: "Struktur organisasi berhasil dibuat",
        data: created,
      })
    );
  } catch (error: any) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

////////////////////////////////////////////////////
// UPDATE STRUKTUR ORGANISASI
////////////////////////////////////////////////////
export const updateStrukturOrganisasi = async (
  req: Request,
  res: Response
) => {
  try {
    const { uuid } = req.params;
    const user = req.user!;

    const existing = await prisma.strukturOrganisasi.findUnique({
      where: { uuid },
    });

    if (!existing) {
      return res.status(404).json({
        message: "Struktur organisasi tidak ditemukan",
      });
    }

    const finalPeriodeUuid = req.body.periodeUuid ?? existing.periodeUuid;
    const finalAnggotaUuid = req.body.anggotaUuid ?? existing.anggotaUuid;
    const finalJabatanUuid = req.body.jabatanUuid ?? existing.jabatanUuid;
    const finalBidangUuid = req.body.bidangUuid ?? existing.bidangUuid ?? null;

    ////////////////////////////////////////////////////
    // VALIDASI ANGGOTA DOUBLE ROLE
    ////////////////////////////////////////////////////
    const anggotaExist = await prisma.strukturOrganisasi.findFirst({
      where: {
        anggotaUuid: finalAnggotaUuid,
        periodeUuid: finalPeriodeUuid,
        NOT: { uuid },
      },
    });

    if (anggotaExist) {
      return res.status(400).json({
        message: "Anggota sudah punya jabatan di periode ini",
      });
    }

    ////////////////////////////////////////////////////
    // VALIDASI JABATAN LEVEL
    ////////////////////////////////////////////////////
    const jabatan = await prisma.jabatan.findUnique({
      where: { uuid: finalJabatanUuid },
    });

    if (jabatan?.levelJabatan === 0) {
      const exist = await prisma.strukturOrganisasi.findFirst({
        where: {
          periodeUuid: finalPeriodeUuid,
          jabatanUuid: finalJabatanUuid,
          bidangUuid: finalBidangUuid,
          NOT: { uuid },
        },
      });

      if (exist) {
        return res.status(400).json({
          message: "Jabatan ini sudah terisi",
        });
      }
    }

    ////////////////////////////////////////////////////
    // UPDATE
    ////////////////////////////////////////////////////
    const updated = await prisma.strukturOrganisasi.update({
      where: { uuid },
      data: {
        ...req.body,
        update_by: user.sub,
      },
    });

    return res.status(200).json(
      ApiResponse.success({
        message: "Berhasil update",
        data: updated,
      })
    );
  } catch (error: any) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

////////////////////////////////////////////////////
// DELETE STRUKTUR ORGANISASI
////////////////////////////////////////////////////
export const deleteStrukturOrganisasi = async (
  req: Request,
  res: Response
) => {
  try {
    const { uuid } = req.params;

    const existing = await prisma.strukturOrganisasi.findUnique({
      where: { uuid },
    });

    if (!existing) {
      return res.status(404).json({
        message: "Struktur organisasi tidak ditemukan",
      });
    }

    await prisma.strukturOrganisasi.delete({
      where: { uuid },
    });

    return res.status(200).json(
      ApiResponse.success({
        message: "Struktur organisasi berhasil dihapus",
      })
    );
  } catch (error: any) {
    return res.status(500).json({
      message: error.message || "Failed to delete struktur organisasi",
    });
  }
};
