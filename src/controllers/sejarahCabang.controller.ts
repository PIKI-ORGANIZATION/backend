import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { ApiResponse } from "../utils/apiResponse";

////////////////////////////////////////////////////
// GET ALL SEJARAH CABANG
////////////////////////////////////////////////////
export const getSejarahCabang = async (req: Request, res: Response) => {
  try {
    const { search, currentPage, pageSize } = req.query as {
      search?: string;
      currentPage?: string;
      pageSize?: string;
    };

    const page = Number(currentPage) || 1;
    const size = Number(pageSize) || 10;
    const skip = (page - 1) * size;

    const whereCondition: any = {};

    if (search) {
      whereCondition.OR = [
        { timeline: { contains: search, mode: "insensitive" } },
        { deskripsiTimeline: { contains: search, mode: "insensitive" } },
        {
          cabang: {
            namaCabang: { contains: search, mode: "insensitive" },
          },
        },
      ];
    }

    const total = await prisma.sejarahCabang.count({
      where: whereCondition,
    });

    const sejarahCabang = await prisma.sejarahCabang.findMany({
      where: whereCondition,
      include: {
        cabang: {
          select: {
            uuid: true,
            namaCabang: true,
            provinsi: true,
          },
        },
      },
      orderBy: {
        insert_at: "desc",
      },
      skip,
      take: size,
    });

    return res.status(200).json(
      ApiResponse.success({
        result: sejarahCabang,
        pagination: {
          currentPage: page,
          pageSize: size,
          total,
        },
      })
    );
  } catch (error: any) {
    return res.status(500).json({
      message: "Failed to fetch sejarah cabang",
      error: error.message,
    });
  }
};

////////////////////////////////////////////////////
// GET SEJARAH CABANG BY ID
////////////////////////////////////////////////////
export const getSejarahCabangByCabangId = async (req: Request, res: Response) => {
  try {
    const { uuidCabang } = req.params;

    const sejarahCabang = await prisma.sejarahCabang.findMany({
      where: { cabang_uuid: uuidCabang },
      include: {
        cabang: {
          select: {
            uuid: true,
            namaCabang: true,
            provinsi: true,
          },
        },
      },
    });

    if (!sejarahCabang) {
      return res.status(404).json({
        message: "Sejarah cabang not found",
      });
    }

    return res.status(200).json(ApiResponse.success(sejarahCabang));
  } catch (error: any) {
    return res.status(500).json({
      message: "Failed to fetch sejarah cabang",
      error: error.message,
    });
  }
};

////////////////////////////////////////////////////
// CREATE SEJARAH CABANG
////////////////////////////////////////////////////
export const createSejarahCabang = async (req: Request, res: Response) => {
  try {
    const user = req.user!;

    const data = Array.isArray(req.body) ? req.body : [req.body];

    ////////////////////////////////////////////////////
    // VALIDASI CABANG EXIST
    ////////////////////////////////////////////////////
    const cabangIds = [...new Set(data.map((d) => d.cabang_uuid))];

    const cabang = await prisma.cabang.findMany({
      where: { uuid: { in: cabangIds } },
      select: { uuid: true },
    });

    if (cabang.length !== cabangIds.length) {
      return res.status(400).json({
        message: "Cabang tidak ditemukan",
      });
    }

    ////////////////////////////////////////////////////
    // CREATE DATA
    ////////////////////////////////////////////////////
    const result = await prisma.sejarahCabang.createMany({
      data: data.map((item) => ({
        ...item,
        insert_by: user.sub,
      })),
      skipDuplicates: true,
    });

    return res.status(201).json(
      ApiResponse.success({
        message: `${result.count} sejarah cabang berhasil dibuat`,
      })
    );
  } catch (error: any) {
    return res.status(500).json({
      message: error.message || "Failed to create sejarah cabang",
    });
  }
};

////////////////////////////////////////////////////
// UPDATE SEJARAH CABANG
////////////////////////////////////////////////////
export const updateSejarahCabang = async (req: Request, res: Response) => {
  try {
    const { uuid } = req.params;
    const user = req.user!;

    ////////////////////////////////////////////////////
    // CEK DATA EXIST
    ////////////////////////////////////////////////////
    const existing = await prisma.sejarahCabang.findUnique({
      where: { uuid },
    });

    if (!existing) {
      return res.status(404).json({
        message: "Sejarah cabang tidak ditemukan",
      });
    }

    ////////////////////////////////////////////////////
    // MENCEGAH SEJARAH CABANG PINDAH KE CABANG LAIN
    ////////////////////////////////////////////////////
    if (
      req.body.cabang_uuid &&
      req.body.cabang_uuid !== existing.cabang_uuid
    ) {
      return res.status(400).json({
        message: "Sejarah cabang tidak dapat dipindahkan ke cabang lain",
      });
    }

    ////////////////////////////////////////////////////
    // HAPUS cabang_uuid DARI BODY AGAR TIDAK DIUPDATE / BERGANTI CABANG
    ////////////////////////////////////////////////////
    const { cabang_uuid, ...body } = req.body;

    ////////////////////////////////////////////////////
    // UPDATE
    ////////////////////////////////////////////////////
    const updated = await prisma.sejarahCabang.update({
      where: { uuid },
      data: {
        ...body,
        update_by: user.sub,
      },
    });

    return res.status(200).json(
      ApiResponse.success({
        message: "Sejarah cabang berhasil diperbarui",
        data: updated,
      })
    );
  } catch (error: any) {
    return res.status(500).json({
      message: error.message || "Failed to update sejarah cabang",
    });
  }
};

////////////////////////////////////////////////////
// DELETE SEJARAH CABANG
////////////////////////////////////////////////////
export const deleteSejarahCabang = async (req: Request, res: Response) => {
  try {
    const { uuid } = req.params;
    const user = req.user!;

    await prisma.sejarahCabang.update({
      where: { uuid },
      data: {
        statusSejarahCabang: "NON_ACTIVE",
        update_by: user.sub,
      },
    });

    return res.status(200).json(
      ApiResponse.success({
        message: "Sejarah cabang berhasil dihapus",
      })
    );
  } catch (error: any) {
    return res.status(500).json({
      message: error.message || "Failed to delete sejarah cabang",
    });
  }
};
