import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { ApiResponse } from "../utils/apiResponse";

////////////////////////////////////////////////////
// GET FORM PENGADUAN (WITH SCOPE)
////////////////////////////////////////////////////
export const getFormPengaduan = async (req: Request, res: Response) => {
  try {
    const { search, status, currentPage, pageSize } = req.query as any;
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
        { namaPelapor: { contains: search, mode: "insensitive" } },
        { emailPelapor: { contains: search, mode: "insensitive" } },
        { subjek: { contains: search, mode: "insensitive" } },
        { isiBadan: { contains: search, mode: "insensitive" } },
      ];
    }

    ////////////////////////////////////////////////////
    // FILTER
    ////////////////////////////////////////////////////
    if (status) {
      whereCondition.statusPengaduan = status;
    }

    ////////////////////////////////////////////////////
    // SCOPE LOGIC
    ////////////////////////////////////////////////////
    if (!scope?.isAdmin) {
      // PUBLIC USER
      return res.status(403).json({
        message: "Forbidden",
      });
    }

    ////////////////////////////////////////////////////

    const total = await prisma.formPengaduan.count({
      where: whereCondition,
    });

    const data = await prisma.formPengaduan.findMany({
      where: whereCondition,
      orderBy: { insert_at: "desc" },
      skip,
      take: size,
    });

    return res.status(200).json(
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
      message: "Failed to fetch pengaduan",
      error: error.message,
    });
  }
};

////////////////////////////////////////////////////
// GET BY ID
////////////////////////////////////////////////////
export const getFormPengaduanById = async (req: Request, res: Response) => {
  try {
    const uuid = req.params.uuid;
    const scope = req.scope;

    if (!scope?.isAdmin) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const data = await prisma.formPengaduan.findUnique({
      where: { uuid },
    });

    if (!data) {
      return res.status(404).json({ message: "Pengaduan not found" });
    }

    return res.json(ApiResponse.success({ result: data }));
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch pengaduan",
    });
  }
};

////////////////////////////////////////////////////
// CREATE (PUBLIC BISA)
////////////////////////////////////////////////////
export const createFormPengaduan = async (req: Request, res: Response) => {
  try {
    const payload = req.body;

    const data = await prisma.formPengaduan.create({
      data: payload,
    });

    return res.status(201).json({
      message: "Pengaduan berhasil dikirim",
      data,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: "Failed to create pengaduan",
      error: error.message,
    });
  }
};

////////////////////////////////////////////////////
// RESPOND / UPDATE STATUS (ADMIN ONLY)
////////////////////////////////////////////////////
export const updateFormPengaduan = async (req: Request, res: Response) => {
  try {
    const uuid = req.params.uuid;
    const userUuid = req.user?.sub;
    const scope = req.scope;

    if (!scope?.isAdmin) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const { statusPengaduan, tanggapan } = req.body;

    const data = await prisma.formPengaduan.update({
      where: { uuid },
      data: {
        ...(statusPengaduan && { statusPengaduan }),
        ...(tanggapan && { tanggapan }),
        ...(tanggapan && {
          tanggalTanggapan: new Date(),
          insert_by: userUuid,
        }),
      },
    });

    return res.json({
      message: "Pengaduan updated",
      data,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: "Failed to update pengaduan",
      error: error.message,
    });
  }
};
