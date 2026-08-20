import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { ApiResponse } from '../utils/apiResponse';
import { clearCachePattern } from '../utils/cacheInvalidation';

export const getNewsKategori = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      search,
      currentPage,
      pageSize,
      tableFilter,
      fixed,
      status_kategori,
    } = req.query as {
      search?: string;
      currentPage?: string;
      pageSize?: string;
      tableFilter?: any;
      fixed?: string;
      status_kategori?: string;
    };

    const page = Number(currentPage) || 1;
    const size = Number(pageSize) || 10;
    const skip = (page - 1) * size;

    const where: any = {};

    // =================================================
    // DEFAULT FILTER
    // =================================================
    const includeAll = fixed?.toLowerCase() === "all";

    if (status_kategori) {
      where.status_kategori = status_kategori;
    } else if (!includeAll) {
      where.status_kategori = "ACTIVE";
    }

    // =================================================
    // SEARCH
    // =================================================
    if (search) {
      where.nama_kategori = {
        contains: search,
        mode: "insensitive",
      };
    }

    // =================================================
    // TABLE FILTER OVERRIDE
    // =================================================
    if (tableFilter) {
      Object.keys(tableFilter).forEach((key) => {
        const value = tableFilter[key];

        if (
          value !== undefined &&
          value !== null &&
          value !== ""
        ) {
          where[key] = value;
        }
      });
    }

    const [kategori, total] = await Promise.all([
      prisma.newsKategori.findMany({
        where,
        skip,
        take: size,
      }),

      prisma.newsKategori.count({
        where,
      }),
    ]);

    res.json(
      ApiResponse.success({
        result: kategori,
        pagination: {
          currentPage: page,
          pageSize: size,
          total,
        },
      })
    );
  } catch (error) {
    next(error);
  }
};

export const getNewsKategoriById = async (req: Request, res: Response) => {
    try {
        const uuid = req.params.uuid as string;
        const kategori = await prisma.newsKategori.findUnique({
            where: { uuid },
        });
        if (!kategori) {
            return res.status(404).json({ error: "Kategori tidak ditemukan" });
        }
        res.json(ApiResponse.success(kategori));
    } catch (error) {
        res.status(500).json({ error: "Gagal mengambil kategori" });
    }
};

export const getNewsKategoriByName = async (req: Request, res: Response) => {
    try {
        const nama = req.params.nama as string;
        const kategori = await prisma.newsKategori.findFirst({
            where: { nama_kategori: nama },
        });
        if (!kategori) {
            return res.status(404).json({ error: "Kategori tidak ditemukan" });
        }
        res.json(ApiResponse.success(kategori));
    } catch (error) {
        res.status(500).json({ error: "Gagal mengambil kategori" });
    }
};

export const createNewsKategori = async (req: Request, res: Response) => {
    try {
        const { nama, slug, deskripsi } = req.body;
        const newKategori = await prisma.newsKategori.create({
            data: { nama_kategori: nama, slug, deskripsi },
        });

        await clearCachePattern("cache:*:*/kategori*");

        res.status(201).json(ApiResponse.success(newKategori));
    } catch (error) {
        res.status(500).json({ error: "Gagal membuat kategori" });
    }
};

export const updateNewsKategori = async (req: Request, res: Response) => {
    try {
        const uuid = req.params.uuid as string;
        const { nama, slug, deskripsi } = req.body;
        const updatedKategori = await prisma.newsKategori.update({
            where: { uuid },
            data: { nama_kategori: nama, slug, deskripsi },
        });

        await clearCachePattern("cache:*:*/kategori*");
        await clearCachePattern("cache:*:*/newsUtama*");

        res.json(ApiResponse.success(updatedKategori));
    } catch (error) {
        res.status(500).json({ error: "Gagal memperbarui kategori" });
    }
};

export const deleteNewsKategori = async (req: Request, res: Response) => {
    try {
        const uuid = req.params.uuid as string;
        await prisma.newsKategori.update({
            where: { uuid },
            data: { status_kategori: "INACTIVE" },
        });

        await clearCachePattern("cache:*:*/kategori*");
        await clearCachePattern("cache:*:*/newsUtama*");

        res.json(ApiResponse.success({ message: "Kategori berhasil dihapus" }));

    } catch (error) {
        res.status(500).json({ error: "Gagal menghapus kategori" });
    }
};
