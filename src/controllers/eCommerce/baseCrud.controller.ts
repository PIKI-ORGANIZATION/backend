// utils/baseCrud.ts
import { Request, Response } from "express";
import { prisma } from "../../config/prisma";
import { ApiResponse } from "../../utils/apiResponse";

export const createBaseController = (model: any, include: any = {}) => ({
  
  // ================= GET LIST =================
  getAll: async (req: Request, res: Response) => {
    try {
      const { search, currentPage, pageSize } = req.query as any;

      const page = Number(currentPage) || 1;
      const size = Number(pageSize) || 10;
      const skip = (page - 1) * size;

      let where: any = {
        deleted_at: null,
      };

      if (search) {
        where.OR = Object.keys(model.fields || {}).map((field) => ({
          [field]: { contains: search, mode: "insensitive" },
        }));
      }

      const total = await prisma[model.name].count({ where });

      const data = await prisma[model.name].findMany({
        where,
        include,
        skip,
        take: size,
        orderBy: { created_at: "desc" },
      });

      return res.json(
        ApiResponse.success({
          result: data,
          pagination: { page, size, total },
        })
      );
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  },

  // ================= GET BY ID =================
  getById: async (req: Request, res: Response) => {
    try {
      const { uuid } = req.params;

      const data = await prisma[model.name].findUnique({
        where: { uuid },
        include,
      });

      if (!data) {
        return res.status(404).json({ message: "Data not found" });
      }

      return res.json(ApiResponse.success({ result: data }));
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  },

  // ================= CREATE =================
  create: async (req: Request, res: Response) => {
    try {
      const data = await prisma[model.name].create({
        data: req.body,
        include,
      });

      return res.status(201).json(
        ApiResponse.success({
          message: "Created",
          result: data,
        })
      );
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  },

  // ================= UPDATE =================
  update: async (req: Request, res: Response) => {
    try {
      const { uuid } = req.params;

      const data = await prisma[model.name].update({
        where: { uuid },
        data: req.body,
      });

      return res.json(
        ApiResponse.success({
          message: "Updated",
          result: data,
        })
      );
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  },

  // ================= SOFT DELETE =================
  delete: async (req: Request, res: Response) => {
    try {
      const { uuid } = req.params;

      await prisma[model.name].update({
        where: { uuid },
        data: { deleted_at: new Date() },
      });

      return res.json(
        ApiResponse.success({
          message: "Deleted",
        })
      );
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  },
});