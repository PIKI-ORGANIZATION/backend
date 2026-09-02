import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { ApiResponse } from "../utils/apiResponse";

////////////////////////////////////////////////////
// GET ALL
////////////////////////////////////////////////////
export const getKelas = async (req: Request, res: Response) => {
  try {
    const { search, statusKelas, fixed } = req.query as any;

    const where: any = {};

    const includeAll = fixed?.toLowerCase() === "all";

    if (statusKelas) {
      where.statusKelas = statusKelas;
    } else if (!includeAll) {
      where.statusKelas = { not: "DIBATALKAN" };
    }

    if (search) {
      where.namaKelas = {
        contains: search,
        mode: "insensitive",
      };
    }

    const data = await prisma.kelas.findMany({
      where,
      include: {
        mentorList: { include: { mentor: true } },
        topikList: { include: { topikEdukasi: true } },
        newsUtama: true,
      },
    });

    return res.json(ApiResponse.success(data));
  } catch (error: any) {
    return res.status(500).json({
      message: "Failed to fetch kelas",
      error: error.message,
    });
  }
};

////////////////////////////////////////////////////
// GET BY ID
////////////////////////////////////////////////////
export const getKelasById = async (req: Request, res: Response) => {
  try {
    const data = await prisma.kelas.findUnique({
      where: { uuid: req.params.uuid },
      include: {
        mentorList: { include: { mentor: true } },
        topikList: { include: { topikEdukasi: true } },
        newsUtama: true,
      },
    });

    if (!data) {
      return res.status(404
        
      ).json({
        message: "Kelas tidak ditemukan",
      });
    }

    return res.json(ApiResponse.success(data));
  } catch (error: any) {
    return res.status(500).json({
      message: "Failed to fetch kelas",
      error: error.message,
    });
  }
};

////////////////////////////////////////////////////
// GET BY TOPIK
////////////////////////////////////////////////////
export const getKelasByTopikEdukasiId = async (
  req: Request,
  res: Response
) => {
  try {
    const { topikUuid } = req.params;

    const data = await prisma.kelas.findMany({
      where: {
        topikList: {
          some: {
            topikEdukasiUuid: topikUuid,
          },
        },
        statusKelas: { not: "DIBATALKAN" },
      },
      include: {
        mentorList: { include: { mentor: true } },
        topikList: { include: { topikEdukasi: true } },
      },
    });

    return res.json(ApiResponse.success(data));
  } catch (error: any) {
    return res.status(500).json({
      message: "Failed to fetch kelas by topik",
      error: error.message,
    });
  }
};

////////////////////////////////////////////////////
// CREATE
////////////////////////////////////////////////////
export const createKelas = async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { mentorUuids = [], topikUuids = [], news, ...payload } = req.body;

    ////////////////////////////////////////////////////
    // CREATE KELAS
    ////////////////////////////////////////////////////
    const kelas = await prisma.kelas.create({
      data: {
        ...payload,
        insert_by: user.sub,
      },
    });

    ////////////////////////////////////////////////////
    // RELASI MENTOR
    ////////////////////////////////////////////////////
    if (mentorUuids.length > 0) {
      await prisma.kelasMentor.createMany({
        data: mentorUuids.map((m: string) => ({
          kelasUuid: kelas.uuid,
          mentorUuid: m,
        })),
        skipDuplicates: true,
      });
    }

    ////////////////////////////////////////////////////
    // RELASI TOPIK
    ////////////////////////////////////////////////////
    if (topikUuids.length > 0) {
      await prisma.kelasTopikEdukasi.createMany({
        data: topikUuids.map((t: string) => ({
          kelasUuid: kelas.uuid,
          topikEdukasiUuid: t,
        })),
        skipDuplicates: true,
      });
    }

    ////////////////////////////////////////////////////
    // NEWS (OPTIONAL 1-1)
    ////////////////////////////////////////////////////
    if (news) {
      await prisma.newsUtama.create({
        data: {
          ...news,
          kelasUuid: kelas.uuid,
          author_akun_uuid: user.sub,
        },
      });
    }

    return res.status(201).json(
      ApiResponse.success({
        message: "Kelas berhasil dibuat",
        data: kelas,
      })
    );
  } catch (error: any) {
    return res.status(500).json({
      message: "Failed to create kelas",
      error: error.message,
    });
  }
};

////////////////////////////////////////////////////
// UPDATE
////////////////////////////////////////////////////
export const updateKelas = async (req: Request, res: Response) => {
  try {
    const { uuid } = req.params;
    const user = req.user!;
    const { mentorUuids = [], topikUuids = [], news, ...payload } = req.body;

    ////////////////////////////////////////////////////
    // VALIDASI
    ////////////////////////////////////////////////////
    const existing = await prisma.kelas.findUnique({
      where: { uuid },
    });

    if (!existing) {
      return res.status(404).json({
        message: "Kelas tidak ditemukan",
      });
    }

    ////////////////////////////////////////////////////
    // UPDATE KELAS
    ////////////////////////////////////////////////////
    const kelas = await prisma.kelas.update({
      where: { uuid },
      data: {
        ...payload,
        update_by: user.sub,
      },
    });

    ////////////////////////////////////////////////////
    // RESET RELASI
    ////////////////////////////////////////////////////
    await prisma.kelasMentor.deleteMany({ where: { kelasUuid: uuid } });
    await prisma.kelasTopikEdukasi.deleteMany({
      where: { kelasUuid: uuid },
    });

    ////////////////////////////////////////////////////
    // RE-CREATE RELASI
    ////////////////////////////////////////////////////
    if (mentorUuids.length > 0) {
      await prisma.kelasMentor.createMany({
        data: mentorUuids.map((m: string) => ({
          kelasUuid: uuid,
          mentorUuid: m,
        })),
      });
    }

    if (topikUuids.length > 0) {
      await prisma.kelasTopikEdukasi.createMany({
        data: topikUuids.map((t: string) => ({
          kelasUuid: uuid,
          topikEdukasiUuid: t,
        })),
      });
    }

    ////////////////////////////////////////////////////
    // UPSERT NEWS (1-1)
    ////////////////////////////////////////////////////
    if (news) {
      await prisma.newsUtama.upsert({
        where: { kelasUuid: uuid },
        update: {
          ...news,
          update_by: user.sub,
        },
        create: {
          ...news,
          kelasUuid: uuid,
          author_akun_uuid: user.sub,
        },
      });
    }

    return res.json(
      ApiResponse.success({
        message: "Kelas berhasil diupdate",
        data: kelas,
      })
    );
  } catch (error: any) {
    return res.status(500).json({
      message: "Failed to update kelas",
      error: error.message,
    });
  }
};

////////////////////////////////////////////////////
// DELETE (SOFT DELETE)
////////////////////////////////////////////////////
export const deleteKelas = async (req: Request, res: Response) => {
  try {
    const { uuid } = req.params;

    const existing = await prisma.kelas.findUnique({
      where: { uuid },
    });

    if (!existing) {
      return res.status(404).json({
        message: "Kelas tidak ditemukan",
      });
    }

    await prisma.kelas.update({
      where: { uuid },
      data: {
        statusKelas: "DIBATALKAN",
      },
    });

    return res.json(
      ApiResponse.success({
        message: "Kelas berhasil dihapus (soft delete)",
      })
    );
  } catch (error: any) {
    return res.status(500).json({
      message: "Failed to delete kelas",
      error: error.message,
    });
  }
};
