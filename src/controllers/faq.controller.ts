import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { ApiResponse } from "../utils/apiResponse";

////////////////////////////////////////////////////
// GET FAQ (WITH SCOPE)
////////////////////////////////////////////////////
export const getFAQ = async (req: Request, res: Response) => {
  try {
    const { search, currentPage, pageSize, kategori, status } = req.query as any;
    const scope = req.scope;

    const page = Number(currentPage) || 1;
    const size = Number(pageSize) || 10;
    const skip = (page - 1) * size;

    const whereCondition: any = {};

    // SEARCH
    if (search) {
      whereCondition.OR = [
        { pertanyaan: { contains: search, mode: "insensitive" } },
        { jawaban: { contains: search, mode: "insensitive" } },
      ];
    }

    // FILTER
    if (kategori) {
      whereCondition.kategori = kategori;
    }

    if (status) {
      whereCondition.statusFAQ = status;
    }

    ////////////////////////////////////////////////////
    // SCOPE LOGIC
    ////////////////////////////////////////////////////
    if (!scope?.isAdmin) {
      // PUBLIC USER
      whereCondition.isPublish = true;
      whereCondition.statusFAQ = "ACTIVE";
    }

    ////////////////////////////////////////////////////

    const total = await prisma.fAQ.count({ where: whereCondition });

    const data = await prisma.fAQ.findMany({
      where: whereCondition,
      orderBy: { urutan: "asc" },
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
      message: "Failed to fetch FAQ",
      error: error.message,
    });
  }
};

////////////////////////////////////////////////////
// GET FAQ BY ID
////////////////////////////////////////////////////
export const getFAQById = async (req: Request, res: Response) => {
  try {
    const uuid = req.params.uuid;

    const data = await prisma.fAQ.findUnique({
      where: { uuid },
    });

    if (!data) {
      return res.status(404).json({ message: "FAQ not found" });
    }

    return res.json(ApiResponse.success({ result: data }));
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch FAQ" });
  }
};

////////////////////////////////////////////////////
// CREATE FAQ
////////////////////////////////////////////////////
export const createFAQ = async (req: Request, res: Response) => {
  try {
    const userUuid = req.user?.sub;

    const payload = req.body;

    const data = Array.isArray(payload)
      ? await prisma.fAQ.createMany({
          data: payload.map((item: any) => ({
            ...item,
            insert_by: userUuid,
          })),
        })
      : await prisma.fAQ.create({
          data: {
            ...payload,
            insert_by: userUuid,
          },
        });

    return res.status(201).json({
      message: "FAQ created successfully",
      data,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: "Failed to create FAQ",
      error: error.message,
    });
  }
};

////////////////////////////////////////////////////
// UPDATE FAQ
////////////////////////////////////////////////////
export const updateFAQ = async (req: Request, res: Response) => {
  try {
    const uuid = req.params.uuid;
    const userUuid = req.user?.sub;

    const data = await prisma.fAQ.update({
      where: { uuid },
      data: {
        ...req.body,
        update_by: userUuid,
      },
    });

    return res.json({
      message: "FAQ updated successfully",
      data,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: "Failed to update FAQ",
      error: error.message,
    });
  }
};

////////////////////////////////////////////////////
// ARCHIVE FAQ
////////////////////////////////////////////////////
export const archiveFAQ = async (req: Request, res: Response) => {
  try {
    const uuid = req.params.uuid;

    await prisma.fAQ.update({
      where: { uuid },
      data: { statusFAQ: "ARCHIVED" },
    });

    return res.json({
      message: "FAQ archived successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to archive FAQ",
    });
  }
};