import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { ApiResponse } from "../utils/apiResponse";
import { clearCachePattern } from "../utils/cacheInvalidation";
import { CreateSejarahInput } from "../validators/sejarah.schema";

////////////////////////////////////////////////////
// URUTAN TAMPIL: urutan (jika diisi) -> tahun -> waktu input
////////////////////////////////////////////////////
export const SEJARAH_ORDER_BY = [
  { urutan: { sort: "asc" as const, nulls: "last" as const } },
  { timeline: "asc" as const },
  { insert_at: "asc" as const },
];

// Halaman /page/home & /page/history di-cache, bersihkan setelah data berubah
const clearSejarahCache = async () => {
  await clearCachePattern("cache:*:*/page/*");
};

////////////////////////////////////////////////////
// GET ALL SEJARAH
// Publik: hanya ACTIVE. DPP dengan ?fixed=all: semua status.
////////////////////////////////////////////////////
export const getSejarah = async (req: Request, res: Response) => {
  try {
    const { search, currentPage, pageSize, fixed } = req.query as {
      search?: string;
      currentPage?: string;
      pageSize?: string;
      fixed?: string;
    };

    const page = Number(currentPage) || 1;
    const size = Number(pageSize) || 10;
    const skip = (page - 1) * size;

    const isSuperAdmin = req.user?.permissions?.includes("MANAGE_ALL_CABANG");

    const whereCondition: any = {};

    if (!(isSuperAdmin && fixed === "all")) {
      whereCondition.statusSejarah = "ACTIVE";
    }

    if (search) {
      whereCondition.OR = [
        { timeline: { contains: search, mode: "insensitive" } },
        { judul: { contains: search, mode: "insensitive" } },
        { deskripsiTimeline: { contains: search, mode: "insensitive" } },
      ];
    }

    const [total, sejarah] = await Promise.all([
      prisma.sejarah.count({ where: whereCondition }),
      prisma.sejarah.findMany({
        where: whereCondition,
        orderBy: SEJARAH_ORDER_BY,
        skip,
        take: size,
      }),
    ]);

    return res.status(200).json(
      ApiResponse.success({
        result: sejarah,
        pagination: {
          currentPage: page,
          pageSize: size,
          total,
        },
      })
    );
  } catch (error: any) {
    return res.status(500).json({
      message: "Failed to fetch sejarah",
      error: error.message,
    });
  }
};

////////////////////////////////////////////////////
// GET SEJARAH BY ID
////////////////////////////////////////////////////
export const getSejarahById = async (req: Request, res: Response) => {
  try {
    const uuid = String(req.params.uuid);

    const sejarah = await prisma.sejarah.findUnique({
      where: { uuid },
    });

    if (!sejarah) {
      return res.status(404).json({
        message: "Sejarah tidak ditemukan",
      });
    }

    return res.status(200).json(ApiResponse.success(sejarah));
  } catch (error: any) {
    return res.status(500).json({
      message: "Failed to fetch sejarah",
      error: error.message,
    });
  }
};

////////////////////////////////////////////////////
// CREATE SEJARAH (satu data atau banyak sekaligus)
////////////////////////////////////////////////////
export const createSejarah = async (req: Request, res: Response) => {
  try {
    const user = req.user!;

    const data: CreateSejarahInput[] = Array.isArray(req.body) ? req.body : [req.body];

    const result = await prisma.sejarah.createMany({
      data: data.map((item) => ({
        ...item,
        insert_by: user.sub,
      })),
    });

    await clearSejarahCache();

    return res.status(201).json(
      ApiResponse.success({
        message: `${result.count} sejarah berhasil dibuat`,
      })
    );
  } catch (error: any) {
    return res.status(500).json({
      message: error.message || "Failed to create sejarah",
    });
  }
};

////////////////////////////////////////////////////
// UPDATE SEJARAH
////////////////////////////////////////////////////
export const updateSejarah = async (req: Request, res: Response) => {
  try {
    const uuid = String(req.params.uuid);
    const user = req.user!;

    const existing = await prisma.sejarah.findUnique({
      where: { uuid },
    });

    if (!existing) {
      return res.status(404).json({
        message: "Sejarah tidak ditemukan",
      });
    }

    const updated = await prisma.sejarah.update({
      where: { uuid },
      data: {
        ...req.body,
        update_by: user.sub,
      },
    });

    await clearSejarahCache();

    return res.status(200).json(
      ApiResponse.success({
        message: "Sejarah berhasil diperbarui",
        data: updated,
      })
    );
  } catch (error: any) {
    return res.status(500).json({
      message: error.message || "Failed to update sejarah",
    });
  }
};

////////////////////////////////////////////////////
// DELETE SEJARAH (nonaktifkan, data tidak dihapus permanen)
////////////////////////////////////////////////////
export const deleteSejarah = async (req: Request, res: Response) => {
  try {
    const uuid = String(req.params.uuid);
    const user = req.user!;

    const existing = await prisma.sejarah.findUnique({
      where: { uuid },
    });

    if (!existing) {
      return res.status(404).json({
        message: "Sejarah tidak ditemukan",
      });
    }

    await prisma.sejarah.update({
      where: { uuid },
      data: {
        statusSejarah: "NON_ACTIVE",
        update_by: user.sub,
      },
    });

    await clearSejarahCache();

    return res.status(200).json(
      ApiResponse.success({
        message: "Sejarah berhasil dihapus",
      })
    );
  } catch (error: any) {
    return res.status(500).json({
      message: error.message || "Failed to delete sejarah",
    });
  }
};
