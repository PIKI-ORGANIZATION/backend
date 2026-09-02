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

        sejarahCabang: {
          select: {
            uuid: true,
            timeline: true,
            deskripsiTimeline: true,
            gambar: true,
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

        sejarahCabang: {
          select: {
            uuid: true,
            timeline: true,
            deskripsiTimeline: true,
            gambar: true,
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
