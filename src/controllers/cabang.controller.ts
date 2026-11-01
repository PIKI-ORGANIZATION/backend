import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { ApiResponse } from "../utils/apiResponse";

export const getCabang = async (req: Request, res: Response) => {
  try {
    const { search, currentPage, pageSize, fixed } = req.query as any;

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
        { namaCabang: { contains: search, mode: "insensitive" } },
        { alamat: { contains: search, mode: "insensitive" } },
        { kabupatenKota: { contains: search, mode: "insensitive" } },
        { provinsi: { contains: search, mode: "insensitive" } },
        { wilayah: { contains: search, mode: "insensitive" } },
      ];
    }

    if (req.query.isCabang !== undefined) {
      whereCondition.isCabang = req.query.isCabang === "true";
    }

    const includeAll = fixed?.toLowerCase() === "all";

    ////////////////////////////////////////////////////
    // ROLE BASED (SCOPE)
    ////////////////////////////////////////////////////

    if (!scope?.isAdmin) {
      // PUBLIC
      whereCondition.statusCabang = "ACTIVE";
    } else {
      // 🛠 ADMIN

      if (!scope.isSuperAdmin) {
        // ADMIN CABANG → hanya cabangnya sendiri
        whereCondition.uuid = scope.cabangId;
      }

      // default tetap hanya ACTIVE kecuali fixed=all
      if (!includeAll) {
        whereCondition.statusCabang = "ACTIVE";
      }
    }

    ////////////////////////////////////////////////////

    const total = await prisma.cabang.count({ where: whereCondition });

    const cabang = await prisma.cabang.findMany({
      where: whereCondition,
      include: {
        misi: {
          select: {
            uuid: true,
            teks: true,
          },
          orderBy: { insert_at: "asc" },
        },
        ketua: {
          select: {
            uuid: true,
            username: true,
          },
        },

        ////////////////////////////////////////////////////
        // PERIODE + STRUKTUR ORGANISASI
        ////////////////////////////////////////////////////
        periodeList: {
          where: {
            isAktif: true,
          },
          include: {
            strukturList: {
              include: {
                anggota: true,
                jabatan: true,
                bidang: true,
              },
              orderBy: [
                { jabatan: { levelJabatan: "asc" } },
                { urutan: "asc" },
              ],
            },
          },
        },

        AlbumGaleriList: {
          select: {
            uuid: true,
            namaAlbum: true,
            deskripsi: true,
            tanggalKegiatan: true,
            coverMedia: true,
            isPublic: true,
            statusAlbum: true,
          },
          where: {
            isPublic: true,
            statusAlbum: "ACTIVE",
          },
          orderBy: {
            tanggalKegiatan: "desc",
          },
        },
      },
      orderBy: { insert_at: "desc" },
      skip,
      take: size,
    });

    ////////////////////////////////////////////////////
    // TRANSFORM RESPONSE
    ////////////////////////////////////////////////////
    const result = cabang.map((item: any) => {
      const { periodeList, ...rest } = item;

      const struktur =
        periodeList?.[0]?.strukturList?.map((s: any) => ({
          uuid: s.uuid,
          anggota: s.anggota,
          jabatan: s.jabatan,
          bidang: s.bidang,
          urutan: s.urutan,
        })) || [];

      return {
        ...rest,
        strukturOrganisasi: struktur,
      };
    });

    return res.status(200).json(
      ApiResponse.success({
        result,
        pagination: { currentPage: page, pageSize: size, total },
      })
    );
  } catch (error: any) {
    res.status(500).json({
      message: "Failed to fetch cabang",
      error: error.message,
    });
  }
};

export const getCabangById = async (req: Request, res: Response) => {
  try {
    const { uuid } = req.params;

    const cabang = await prisma.cabang.findUnique({
      where: { uuid },
      include: {
        misi: {
          select: {
            uuid: true,
            teks: true,
          },
          orderBy: { insert_at: "asc" },
        },
        ketua: {
          select: {
            uuid: true,
            username: true,
          },
        },

        ////////////////////////////////////////////////////
        // PERIODE + STRUKTUR
        ////////////////////////////////////////////////////
        periodeList: {
          where: {
            isAktif: true,
          },
          include: {
            strukturList: {
              include: {
                anggota: true,
                jabatan: true,
                bidang: true,
              },
              orderBy: [
                { jabatan: { levelJabatan: "asc" } },
                { urutan: "asc" },
              ],
            },
          },
        },
      },
    });

    if (!cabang) {
      return res.status(404).json({
        message: "Cabang not found",
      });
    }

    const { periodeList, ...rest } = cabang;

    const struktur =
      periodeList?.[0]?.strukturList?.map((s: any) => ({
        uuid: s.uuid,
        anggota: s.anggota,
        jabatan: s.jabatan,
        bidang: s.bidang,
        urutan: s.urutan,
      })) || [];

    return res.status(200).json(
      ApiResponse.success({
        ...rest,
        strukturOrganisasi: struktur,
      })
    );
  } catch (error: any) {
    res.status(500).json({
      message: "Failed to fetch cabang",
      error: error.message,
    });
  }
};

////////////////////////////////////////////////////
// VALIDASI TAUTAN CABANG -> DPD / DPC
////////////////////////////////////////////////////
type TautanWilayah = {
  dpdId?: string | null;
  dpcId?: number | null;
};

// Cabang ditautkan ke DPD (dpdId) atau DPC (dpcId), tidak boleh keduanya
const cekTautanWilayah = async (
  data: TautanWilayah,
  cabangUuid?: string
): Promise<{ status: number; message: string } | null> => {
  const dpdId = data.dpdId ?? null;
  const dpcId = data.dpcId ?? null;

  if (dpdId && dpcId) {
    return { status: 400, message: "Cabang hanya boleh ditautkan ke salah satu: dpdId atau dpcId" };
  }

  const bukanCabangIni = cabangUuid ? { NOT: { uuid: cabangUuid } } : {};

  if (dpdId) {
    const dpd = await prisma.dpd.findFirst({ where: { id: dpdId, deletedAt: null } });
    if (!dpd) return { status: 404, message: "DPD tidak ditemukan" };

    const dipakai = await prisma.cabang.findFirst({ where: { dpdId, ...bukanCabangIni } });
    if (dipakai) return { status: 409, message: `DPD ini sudah ditautkan ke cabang "${dipakai.namaCabang}"` };
  }

  if (dpcId) {
    const dpc = await prisma.dpdDpc.findFirst({ where: { id: dpcId, deleted_at: null } });
    if (!dpc) return { status: 404, message: "DPC tidak ditemukan" };

    const dipakai = await prisma.cabang.findFirst({ where: { dpcId, ...bukanCabangIni } });
    if (dipakai) return { status: 409, message: `DPC ini sudah ditautkan ke cabang "${dipakai.namaCabang}"` };
  }

  return null;
};

export const createCabang = async (req: Request, res: Response) => {
  try {
    const user = req.user!;

    const payload = Array.isArray(req.body)
      ? req.body
      : [req.body];

    if (!payload.length) {
      return res.status(400).json({
        message: "Data cabang tidak boleh kosong",
      });
    }

    for (const item of payload) {
      // createCabangSchema tidak mengembalikan hasil coerce, jadi dpcId dinormalisasi di sini
      if (item.dpcId !== undefined && item.dpcId !== null) {
        item.dpcId = Number(item.dpcId);
      }

      const errTautan = await cekTautanWilayah(item);
      if (errTautan) {
        return res.status(errTautan.status).json({ message: errTautan.message });
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      const createdCabang = [];

      for (const item of payload) {
        const { misi = [], ...cabangData } = item;

        const cabang = await tx.cabang.create({
          data: {
            ...cabangData,
            endTimeCountdown: cabangData.endTimeCountdown
              ? new Date(cabangData.endTimeCountdown)
              : null,
            insert_by: user.sub,
          },
        });

        createdCabang.push(cabang);

        if (Array.isArray(misi) && misi.length > 0) {
          await tx.misiCabang.createMany({
            data: misi.map((teks: string) => ({
              teks,
              cabang_uuid: cabang.uuid,
            })),
          });
        }
      }

      return createdCabang;
    });

    return res.status(201).json(
      ApiResponse.success({
        message: `${result.length} cabang berhasil dibuat`,
        total: result.length,
      })
    );
  } catch (error: any) {
    return res.status(500).json({
      message: error.message || "Failed to create cabang",
    });
  }
};

export const updateCabang = async (req: Request, res: Response) => {
  try {
    const { uuid } = req.params;
    const user = req.user!;

    const { misi, ...otherData } = req.body;

    if ("dpdId" in otherData || "dpcId" in otherData) {
      const existing = await prisma.cabang.findUnique({
        where: { uuid: String(uuid) },
        select: { dpdId: true, dpcId: true },
      });

      if (!existing) {
        return res.status(404).json({ message: "Cabang tidak ditemukan" });
      }

      const errTautan = await cekTautanWilayah(
        {
          dpdId: "dpdId" in otherData ? otherData.dpdId : existing.dpdId,
          dpcId: "dpcId" in otherData ? otherData.dpcId : existing.dpcId,
        },
        String(uuid)
      );
      if (errTautan) {
        return res.status(errTautan.status).json({ message: errTautan.message });
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      const cabang = await tx.cabang.update({
        where: { uuid },
        data: {
          ...otherData,

          ...(otherData.endTimeCountdown !== undefined && {
            endTimeCountdown: otherData.endTimeCountdown
              ? new Date(otherData.endTimeCountdown)
              : null,
          }),

          update_by: user.sub,
        },
      });

      if (Array.isArray(misi)) {
        await tx.misiCabang.deleteMany({
          where: {
            cabang_uuid: uuid,
          },
        });

        if (misi.length > 0) {
          await tx.misiCabang.createMany({
            data: misi.map((teks: string) => ({
              teks,
              cabang_uuid: uuid,
            })),
          });
        }
      }

      const updatedCabang = await tx.cabang.findUnique({
        where: { uuid },
        include: {
          misi: {
            orderBy: {
              insert_at: "asc",
            },
          },
        },
      });

      return updatedCabang;
    });

    return res.status(200).json(
      ApiResponse.success({
        message: "Cabang berhasil diperbarui",
        data: result,
      })
    );
  } catch (error: any) {
    return res.status(500).json({
      message: error.message || "Failed to update cabang",
    });
  }
};

export const deleteCabang = async (req: Request, res: Response) => {
  try {
    const { uuid } = req.params;
    const user = req.user!;

    await prisma.cabang.update({
      where: { uuid },
      data: {
        statusCabang: "NON_ACTIVE",
        update_by: user.sub,
      },
    });

    return res.status(200).json(
      ApiResponse.success({
        message: "Cabang berhasil dihapus",
      })
    );
    } catch (error: any) {
        return res.status(500).json({
            message: error.message || "Failed to delete cabang",
        });
    }
};
