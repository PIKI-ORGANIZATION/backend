import { createBaseController } from "./baseCrud.controller";
import { prisma } from "../../config/prisma";
import { Request, Response } from "express";
import { ApiResponse } from "../../utils/apiResponse";

const base = createBaseController(
  {
    name: "produk",
    fields: {
      namaProduk: true,
    },
  },
  {
    produkKategori: true,
    senior: true,
    spesifikasi: {
      include: {
        values: true,
      },
    },
  }
);

export const produkController = {
  ...base,
  getAll: async (req: Request, res: Response) => {
    try {
      const { search, statusProduk, currentPage, pageSize } = req.query as any;

      const page = Number(currentPage) || 1;
      const size = Number(pageSize) || 10;
      const skip = (page - 1) * size;

      let where: any = {
        deleted_at: null,
      };

      if (req.user && !req.user.isFromAdmin) {
        const akun = await prisma.akun.findUnique({
          where: { uuid: req.user.sub },
          select: { seniorUuid: true },
        });
        where.seniorUuid = akun?.seniorUuid || "NOT_FOUND";
      }

      if (statusProduk) {
        where.statusProduk = statusProduk;
      }

      if (search) {
        where.OR = [
          { namaProduk: { contains: search, mode: "insensitive" } },
        ];
      }

      const total = await prisma.produk.count({ where });

      const data = await prisma.produk.findMany({
        where,
        include: {
          produkKategori: true,
          senior: true,
          spesifikasi: {
            include: {
              values: true,
            },
          },
        },
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

  // ================= GET BY SENIOR =================
  getBySenior: async (req: Request, res: Response) => {
    try {
      const { seniorUuid } = req.params;
      const { currentPage, pageSize } = req.query as any;

      const page = Number(currentPage) || 1;
      const size = Number(pageSize) || 10;
      const skip = (page - 1) * size;

      const where: any = {
        seniorUuid,
        deleted_at: null,
      };

      const total = await prisma.produk.count({ where });

      const data = await prisma.produk.findMany({
        where,
        include: {
          produkKategori: true,
          senior: true,
          spesifikasi: {
            include: {
              values: true,
            },
          },
        },
        skip,
        take: size,
        orderBy: {
          created_at: "desc",
        },
      });

      return res.json(
        ApiResponse.success({
          result: data,
          pagination: {
            page,
            size,
            total,
          },
        })
      );
    } catch (error: any) {
      return res.status(500).json({
        message: "Failed to fetch produk by senior",
        error: error.message,
      });
    }
  },

  // ================= GET MY PRODUK =================
  getMyProduk: async (req: Request, res: Response) => {
    try {
      const { currentPage, pageSize, search, statusProduk } = req.query as any;
      const page = Number(currentPage) || 1;
      const size = Number(pageSize) || 10;
      const skip = (page - 1) * size;

      if (!req.user?.sub) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const akun = await prisma.akun.findUnique({
        where: { uuid: req.user.sub },
        select: { seniorUuid: true },
      });
      if (!akun || !akun.seniorUuid) {
        return res.status(403).json({ message: "Akun ini tidak memiliki toko / seniorUuid" });
      }

      let where: any = {
        seniorUuid: akun.seniorUuid,
        deleted_at: null,
      };

      if (statusProduk) where.statusProduk = statusProduk;
      if (search) {
        where.OR = [{ namaProduk: { contains: search, mode: "insensitive" } }];
      }

      const total = await prisma.produk.count({ where });
      const data = await prisma.produk.findMany({
        where,
        include: { produkKategori: true, senior: true, spesifikasi: { include: { values: true } } },
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
};