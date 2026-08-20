import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { ApiResponse } from "../utils/apiResponse";

////////////////////////////////////////////////////
// GET ALL
////////////////////////////////////////////////////
export const getTopikEdukasi = async (req: Request, res: Response) => {
  try {
    const { search, currentPage, pageSize } = req.query as any;

    const page = Number(currentPage) || 1;
    const size = Number(pageSize) || 10;
    const skip = (page - 1) * size;

    const where: any = {
      statusTopikEdukasi: "ACTIVE",
    };

    ////////////////////////////////////////////////////
    // SEARCH
    ////////////////////////////////////////////////////
    if (search) {
      where.OR = [
        {
          namaTopikEdukasi: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          deskripsiTopikEdukasi: {
            contains: search,
            mode: "insensitive",
          },
        },
      ];
    }

    ////////////////////////////////////////////////////
    // TOTAL
    ////////////////////////////////////////////////////
    const total = await prisma.topikEdukasi.count({ where });

    ////////////////////////////////////////////////////
    // QUERY
    ////////////////////////////////////////////////////
    const data = await prisma.topikEdukasi.findMany({
      where,
      skip,
      take: size,
      orderBy: { insert_at: "desc" },
    });

    return res.json(
      ApiResponse.success({
        result: data,
        pagination: {
          currentPage: page,
          pageSize: size,
          total,
        },
      })
    );
  } catch (error: any) {
    return res.status(500).json({
      message: "Failed to fetch topik edukasi",
      error: error.message,
    });
  }
};

////////////////////////////////////////////////////
// GET BY ID
////////////////////////////////////////////////////
export const getTopikEdukasiById = async (req: Request, res: Response) => {
  try {
    const { uuid } = req.params;

    const data = await prisma.topikEdukasi.findUnique({
      where: { uuid },
      include: {
        kelasList: {
          include: {
            kelas: true,
          },
        },
      },
    });

    ////////////////////////////////////////////////////
    // VALIDASI
    ////////////////////////////////////////////////////
    if (!data) {
      return res.status(404).json({
        message: "Topik edukasi tidak ditemukan",
      });
    }

    return res.json(ApiResponse.success(data));
  } catch (error: any) {
    return res.status(500).json({
      message: "Failed to fetch topik edukasi",
      error: error.message,
    });
  }
};

////////////////////////////////////////////////////
// CREATE
////////////////////////////////////////////////////
export const createTopikEdukasi = async (
  req: Request,
  res: Response
) => {
  try {
    const user = req.user!;

    const { namaTopikEdukasi } = req.body;

    ////////////////////////////////////////////////////
    // VALIDASI WAJIB
    ////////////////////////////////////////////////////
    if (!namaTopikEdukasi) {
      return res.status(400).json({
        message: "namaTopikEdukasi wajib diisi",
      });
    }

    ////////////////////////////////////////////////////
    // PREVENT DUPLICATE (OPSIONAL)
    ////////////////////////////////////////////////////
    const exist = await prisma.topikEdukasi.findFirst({
      where: {
        namaTopikEdukasi,
      },
    });

    if (exist) {
      return res.status(400).json({
        message: "Topik edukasi sudah ada",
      });
    }

    ////////////////////////////////////////////////////
    // CREATE
    ////////////////////////////////////////////////////
    const created = await prisma.topikEdukasi.create({
      data: {
        ...req.body,
        insert_by: user.sub,
      },
    });

    return res.status(201).json(
      ApiResponse.success({
        message: "Topik edukasi berhasil dibuat",
        data: created,
      })
    );
  } catch (error: any) {
    return res.status(500).json({
      message: "Failed to create topik edukasi",
      error: error.message,
    });
  }
};

////////////////////////////////////////////////////
// UPDATE
////////////////////////////////////////////////////
export const updateTopikEdukasi = async (
  req: Request,
  res: Response
) => {
  try {
    const { uuid } = req.params;
    const user = req.user!;

    ////////////////////////////////////////////////////
    // VALIDASI EXIST
    ////////////////////////////////////////////////////
    const existing = await prisma.topikEdukasi.findUnique({
      where: { uuid },
    });

    if (!existing) {
      return res.status(404).json({
        message: "Topik edukasi tidak ditemukan",
      });
    }

    ////////////////////////////////////////////////////
    // UPDATE
    ////////////////////////////////////////////////////
    const updated = await prisma.topikEdukasi.update({
      where: { uuid },
      data: {
        ...req.body,
        update_by: user.sub,
      },
    });

    return res.json(
      ApiResponse.success({
        message: "Topik edukasi berhasil diupdate",
        data: updated,
      })
    );
  } catch (error: any) {
    return res.status(500).json({
      message: "Failed to update topik edukasi",
      error: error.message,
    });
  }
};

////////////////////////////////////////////////////
// DELETE (SOFT DELETE)
////////////////////////////////////////////////////
export const deleteTopikEdukasi = async (
  req: Request,
  res: Response
) => {
  try {
    const { uuid } = req.params;

    ////////////////////////////////////////////////////
    // VALIDASI EXIST
    ////////////////////////////////////////////////////
    const existing = await prisma.topikEdukasi.findUnique({
      where: { uuid },
    });

    if (!existing) {
      return res.status(404).json({
        message: "Topik edukasi tidak ditemukan",
      });
    }

    ////////////////////////////////////////////////////
    // SOFT DELETE
    ////////////////////////////////////////////////////
    await prisma.topikEdukasi.update({
      where: { uuid },
      data: {
        statusTopikEdukasi: "INACTIVE",
      },
    });

    return res.json(
      ApiResponse.success({
        message: "Topik edukasi berhasil dihapus (soft delete)",
      })
    );
  } catch (error: any) {
    return res.status(500).json({
      message: "Failed to delete topik edukasi",
      error: error.message,
    });
  }
};