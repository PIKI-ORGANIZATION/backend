import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { ApiResponse } from "../utils/apiResponse";
import { clearCachePattern } from "../utils/cacheInvalidation";
import { CreateSejarahInput, UpdateSejarahInput } from "../validators/sejarah.schema";

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

const isPengelola = (req: Request) => {
  const permissions = req.user?.permissions ?? [];
  return permissions.includes("MANAGE_ALL_CABANG") || permissions.includes("SEJARAH_MANAGE");
};

const cariSejarah = async (uuid: string) => {
  const sejarah = await prisma.sejarah.findFirst({
    where: { uuid, deleted_at: null },
  });
  if (!sejarah) {
    throw Object.assign(new Error("Sejarah tidak ditemukan"), { statusCode: 404 });
  }
  return sejarah;
};

////////////////////////////////////////////////////
// GET ALL SEJARAH
// Publik: hanya PUBLISHED. Pengelola CMS: ?status=DRAFT|PUBLISHED|ARCHIVED atau ?fixed=all (semua status).
////////////////////////////////////////////////////
export const getSejarah = async (req: Request, res: Response) => {
  try {
    const { search, currentPage, pageSize, fixed, status } = req.query as {
      search?: string;
      currentPage?: string;
      pageSize?: string;
      fixed?: string;
      status?: string;
    };

    const page = Number(currentPage) || 1;
    const size = Number(pageSize) || 10;
    const skip = (page - 1) * size;

    const whereCondition: any = { deleted_at: null };

    if (!isPengelola(req)) {
      whereCondition.statusSejarah = "PUBLISHED";
    } else if (status) {
      whereCondition.statusSejarah = status.toUpperCase();
    } else if (fixed !== "all") {
      whereCondition.statusSejarah = "PUBLISHED";
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
    const sejarah = await cariSejarah(String(req.params.uuid));
    return res.status(200).json(ApiResponse.success(sejarah));
  } catch (error: any) {
    return res.status(error.statusCode || 500).json({
      message: error.message || "Failed to fetch sejarah",
    });
  }
};

////////////////////////////////////////////////////
// CREATE SEJARAH (satu data atau banyak sekaligus; default status DRAFT)
////////////////////////////////////////////////////
export const createSejarah = async (req: Request, res: Response) => {
  try {
    const user = req.user!;

    const data: CreateSejarahInput[] = Array.isArray(req.body) ? req.body : [req.body];

    const result = await prisma.sejarah.createMany({
      data: data.map((item) => ({
        ...item,
        statusSejarah: item.statusSejarah ?? "DRAFT",
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
    return res.status(error.statusCode || 500).json({
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
    const body = req.body as UpdateSejarahInput;

    const existing = await cariSejarah(uuid);

    if (existing.statusSejarah === "ARCHIVED" && body.statusSejarah === "DRAFT") {
      return res.status(400).json({
        message: "Item yang diarsipkan hanya bisa dikembalikan ke PUBLISHED",
      });
    }

    const updated = await prisma.sejarah.update({
      where: { uuid },
      data: {
        ...body,
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
    return res.status(error.statusCode || 500).json({
      message: error.message || "Failed to update sejarah",
    });
  }
};

////////////////////////////////////////////////////
// TOGGLE STATUS: PUBLISHED <-> DRAFT (ARCHIVED -> PUBLISHED)
////////////////////////////////////////////////////
export const toggleStatusSejarah = async (req: Request, res: Response) => {
  try {
    const uuid = String(req.params.uuid);
    const user = req.user!;
    const existing = await cariSejarah(uuid);

    const statusSejarah = existing.statusSejarah === "PUBLISHED" ? "DRAFT" : "PUBLISHED";

    const updated = await prisma.sejarah.update({
      where: { uuid },
      data: {
        statusSejarah,
        update_by: user.sub,
      },
    });

    await clearSejarahCache();

    return res.status(200).json(
      ApiResponse.success(updated, `Status diubah menjadi ${statusSejarah}`)
    );
  } catch (error: any) {
    return res.status(error.statusCode || 500).json({
      message: error.message || "Failed to toggle status sejarah",
    });
  }
};

////////////////////////////////////////////////////
// ARSIPKAN SEJARAH (bisa dikembalikan ke PUBLISHED)
////////////////////////////////////////////////////
export const archiveSejarah = async (req: Request, res: Response) => {
  try {
    const uuid = String(req.params.uuid);
    const user = req.user!;
    await cariSejarah(uuid);

    const updated = await prisma.sejarah.update({
      where: { uuid },
      data: {
        statusSejarah: "ARCHIVED",
        update_by: user.sub,
      },
    });

    await clearSejarahCache();

    return res.status(200).json(
      ApiResponse.success(updated, "Sejarah berhasil diarsipkan")
    );
  } catch (error: any) {
    return res.status(error.statusCode || 500).json({
      message: error.message || "Failed to archive sejarah",
    });
  }
};

////////////////////////////////////////////////////
// DELETE SEJARAH (soft delete, hilang dari CMS & publik)
////////////////////////////////////////////////////
export const deleteSejarah = async (req: Request, res: Response) => {
  try {
    const uuid = String(req.params.uuid);
    const user = req.user!;
    await cariSejarah(uuid);

    await prisma.sejarah.update({
      where: { uuid },
      data: {
        deleted_at: new Date(),
        deleted_by: user.sub,
      },
    });

    await clearSejarahCache();

    return res.status(200).json(
      ApiResponse.success({
        message: "Sejarah berhasil dihapus",
      })
    );
  } catch (error: any) {
    return res.status(error.statusCode || 500).json({
      message: error.message || "Failed to delete sejarah",
    });
  }
};
