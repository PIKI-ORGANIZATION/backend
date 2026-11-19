import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { ApiResponse } from "../utils/apiResponse";
import {
  buildCabangRelationScopeWhere,
  resolveCreateCabangUuid,
  assertCanReadCabangItem,
  assertCanWriteCabangItem,
} from "../middlewares/scope.middleware";

////////////////////////////////////////////////////
// GET FAQ (WITH SCOPE HIERARCHY)
////////////////////////////////////////////////////
export const getFAQ = async (req: Request, res: Response) => {
  try {
    const { search, currentPage, pageSize, kategori, status, cabangUuid } = req.query as {
      search?: string;
      currentPage?: string;
      pageSize?: string;
      kategori?: string;
      status?: string;
      cabangUuid?: string;
    };
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
    // SCOPE LOGIC (DPP > DPD > DPC)
    ////////////////////////////////////////////////////
    if (!scope?.isAdmin) {
      // PUBLIC USER
      whereCondition.isPublish = true;
      whereCondition.statusFAQ = "ACTIVE";
      if (cabangUuid) {
        whereCondition.cabangUuid = cabangUuid;
      }
    } else {
      const scopeWhere = buildCabangRelationScopeWhere(scope);
      const andFilters: any[] = [];
      if (scopeWhere) andFilters.push(scopeWhere);
      if (cabangUuid) andFilters.push({ cabangUuid });
      if (andFilters.length > 0) {
        whereCondition.AND = andFilters;
      }
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
    const uuid = String(req.params.uuid);

    const data = await prisma.fAQ.findUnique({
      where: { uuid },
    });

    if (!data) {
      return res.status(404).json({ message: "FAQ not found" });
    }

    if (!req.scope?.isAdmin) {
      if (!data.isPublish || data.statusFAQ !== "ACTIVE") {
        return res.status(404).json({ message: "FAQ not found" });
      }
    } else {
      await assertCanReadCabangItem(req.scope, data.cabangUuid, "FAQ");
    }

    return res.json(ApiResponse.success({ result: data }));
  } catch (error: any) {
    return res.status(error.statusCode || 500).json({
      message: error.message || "Failed to fetch FAQ",
    });
  }
};

////////////////////////////////////////////////////
// CREATE FAQ
////////////////////////////////////////////////////
export const createFAQ = async (req: Request, res: Response) => {
  try {
    const userUuid = req.user?.sub;
    const payload = req.body;

    const items = Array.isArray(payload) ? payload : [payload];
    const resolvedItems = items.map((item: any) => ({
      ...item,
      cabangUuid: resolveCreateCabangUuid(req.scope, item.cabangUuid),
      insert_by: userUuid,
    }));

    const targetCabangUuids = Array.from(
      new Set(resolvedItems.map((i) => i.cabangUuid).filter((id): id is string => Boolean(id)))
    );
    if (targetCabangUuids.length > 0) {
      const foundCabangs = await prisma.cabang.findMany({
        where: { uuid: { in: targetCabangUuids } },
        select: { uuid: true },
      });
      if (foundCabangs.length !== targetCabangUuids.length) {
        return res.status(404).json({ message: "Cabang tidak ditemukan" });
      }
    }

    const data = Array.isArray(payload)
      ? await prisma.fAQ.createMany({ data: resolvedItems })
      : await prisma.fAQ.create({ data: resolvedItems[0] });

    return res.status(201).json({
      message: "FAQ created successfully",
      data,
    });
  } catch (error: any) {
    return res.status(error.statusCode || 500).json({
      message: error.message || "Failed to create FAQ",
    });
  }
};

////////////////////////////////////////////////////
// UPDATE FAQ
////////////////////////////////////////////////////
export const updateFAQ = async (req: Request, res: Response) => {
  try {
    const uuid = String(req.params.uuid);
    const userUuid = req.user?.sub;

    const existing = await prisma.fAQ.findUnique({ where: { uuid } });
    if (!existing) {
      return res.status(404).json({ message: "FAQ not found" });
    }

    assertCanWriteCabangItem(req.scope, existing.cabangUuid, "FAQ");

    const updateData: any = {
      ...req.body,
      update_by: userUuid,
    };
    delete updateData.insert_by;

    if (!req.scope?.isSuperAdmin) {
      delete updateData.cabangUuid;
    } else if (updateData.cabangUuid) {
      const targetCabang = await prisma.cabang.findUnique({
        where: { uuid: String(updateData.cabangUuid) },
        select: { uuid: true },
      });
      if (!targetCabang) {
        return res.status(404).json({ message: "Cabang tidak ditemukan" });
      }
    }

    const data = await prisma.fAQ.update({
      where: { uuid },
      data: updateData,
    });

    return res.json({
      message: "FAQ updated successfully",
      data,
    });
  } catch (error: any) {
    return res.status(error.statusCode || 500).json({
      message: error.message || "Failed to update FAQ",
    });
  }
};

////////////////////////////////////////////////////
// ARCHIVE FAQ
////////////////////////////////////////////////////
export const archiveFAQ = async (req: Request, res: Response) => {
  try {
    const uuid = String(req.params.uuid);
    const userUuid = req.user?.sub;

    const existing = await prisma.fAQ.findUnique({ where: { uuid } });
    if (!existing) {
      return res.status(404).json({ message: "FAQ not found" });
    }

    assertCanWriteCabangItem(req.scope, existing.cabangUuid, "FAQ");

    await prisma.fAQ.update({
      where: { uuid },
      data: {
        statusFAQ: "ARCHIVED",
        update_by: userUuid,
      },
    });

    return res.json({
      message: "FAQ archived successfully",
    });
  } catch (error: any) {
    return res.status(error.statusCode || 500).json({
      message: error.message || "Failed to archive FAQ",
    });
  }
};
