import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { ApiResponse } from "../utils/apiResponse";

////////////////////////////////////////////////////
// GET ALL MENTOR
////////////////////////////////////////////////////
export const getMentor = async (req: Request, res: Response) => {
  try {
    const { search } = req.query as any;

    const where: any = {
      statusMentor: "ACTIVE",
    };

    ////////////////////////////////////////////////////
    // SEARCH
    ////////////////////////////////////////////////////
    if (search) {
      where.OR = [
        {
          namaLengkap: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          keahlian: {
            contains: search,
            mode: "insensitive",
          },
        },
      ];
    }

    const data = await prisma.mentor.findMany({
      where,
    });

    return res.json(ApiResponse.success(data));
  } catch (error: any) {
    return res.status(500).json({
      message: "Failed to fetch mentor",
      error: error.message,
    });
  }
};

////////////////////////////////////////////////////
// GET BY ID
////////////////////////////////////////////////////
export const getMentorById = async (req: Request, res: Response) => {
  try {
    const { uuid } = req.params;

    const data = await prisma.mentor.findUnique({
      where: { uuid },
    });

    ////////////////////////////////////////////////////
    // VALIDASI
    ////////////////////////////////////////////////////
    if (!data) {
      return res.status(404).json({
        message: "Mentor tidak ditemukan",
      });
    }

    return res.json(ApiResponse.success(data));
  } catch (error: any) {
    return res.status(500).json({
      message: "Failed to fetch mentor",
      error: error.message,
    });
  }
};

////////////////////////////////////////////////////
// CREATE
////////////////////////////////////////////////////
export const createMentor = async (req: Request, res: Response) => {
  try {
    const user = req.user!;

    ////////////////////////////////////////////////////
    // VALIDASI FIELD WAJIB
    ////////////////////////////////////////////////////
    const { namaLengkap } = req.body;

    if (!namaLengkap) {
      return res.status(400).json({
        message: "namaLengkap wajib diisi",
      });
    }

    ////////////////////////////////////////////////////
    // CREATE
    ////////////////////////////////////////////////////
    const data = await prisma.mentor.create({
      data: {
        ...req.body,
        insert_by: user.sub,
      },
    });

    return res.status(201).json(
      ApiResponse.success({
        message: "Mentor berhasil dibuat",
        data,
      })
    );
  } catch (error: any) {
    return res.status(500).json({
      message: "Failed to create mentor",
      error: error.message,
    });
  }
};

////////////////////////////////////////////////////
// UPDATE
////////////////////////////////////////////////////
export const updateMentor = async (req: Request, res: Response) => {
  try {
    const { uuid } = req.params;
    const user = req.user!;

    ////////////////////////////////////////////////////
    // VALIDASI EXIST
    ////////////////////////////////////////////////////
    const existing = await prisma.mentor.findUnique({
      where: { uuid },
    });

    if (!existing) {
      return res.status(404).json({
        message: "Mentor tidak ditemukan",
      });
    }

    ////////////////////////////////////////////////////
    // UPDATE
    ////////////////////////////////////////////////////
    const data = await prisma.mentor.update({
      where: { uuid },
      data: {
        ...req.body,
        update_by: user.sub,
      },
    });

    return res.json(
      ApiResponse.success({
        message: "Mentor berhasil diupdate",
        data,
      })
    );
  } catch (error: any) {
    return res.status(500).json({
      message: "Failed to update mentor",
      error: error.message,
    });
  }
};

////////////////////////////////////////////////////
// DELETE (SOFT DELETE)
////////////////////////////////////////////////////
export const deleteMentor = async (req: Request, res: Response) => {
  try {
    const { uuid } = req.params;

    ////////////////////////////////////////////////////
    // VALIDASI EXIST
    ////////////////////////////////////////////////////
    const existing = await prisma.mentor.findUnique({
      where: { uuid },
    });

    if (!existing) {
      return res.status(404).json({
        message: "Mentor tidak ditemukan",
      });
    }

    ////////////////////////////////////////////////////
    // SOFT DELETE
    ////////////////////////////////////////////////////
    await prisma.mentor.update({
      where: { uuid },
      data: {
        statusMentor: "INACTIVE",
      },
    });

    return res.json(
      ApiResponse.success({
        message: "Mentor berhasil dihapus (soft delete)",
      })
    );
  } catch (error: any) {
    return res.status(500).json({
      message: "Failed to delete mentor",
      error: error.message,
    });
  }
};
