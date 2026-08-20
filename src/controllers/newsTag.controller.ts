import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { clearCachePattern } from '../utils/cacheInvalidation';

export const getNewsTags = async (
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
      status_tag,
    } = req.query as {
      search?: string;
      currentPage?: string;
      pageSize?: string;
      tableFilter?: any;
      fixed?: string;
      status_tag?: string;
    };

    const page = Number(currentPage) || 1;
    const size = Number(pageSize) || 10;
    const skip = (page - 1) * size;

    // =================================================
    // DEFAULT FILTER
    // =================================================
    const where: any = {};

    const includeAll = fixed?.toLowerCase() === "all";

    if (status_tag) {
      where.status_tag = status_tag;
    } else if (!includeAll) {
      where.status_tag = "ACTIVE";
    }

    // =================================================
    // SEARCH
    // =================================================
    if (search) {
      where.nama_tag = {
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
          // support multiple select filter
          if (Array.isArray(value)) {
            where[key] = {
              in: value,
            };
          } else {
            where[key] = value;
          }
        }
      });
    }

    const [tags, total] = await Promise.all([
      prisma.newsTag.findMany({
        where,
        skip,
        take: size,
      }),

      prisma.newsTag.count({
        where,
      }),
    ]);

    res.json(
      ApiResponse.success({
        result: tags,
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

export const getNewsTagById = async (req: Request, res: Response) => {
    try {
        const uuid = req.params.uuid as string;

        const tag = await prisma.newsTag.findUnique({
            where: { 
                uuid
            },
        });
        
        if (!tag) {
        return res.status(404).json({ error: "Tag tidak ditemukan" });
        }
        res.json(ApiResponse.success(tag));
    } catch (error) {
        res.status(500).json({ error: "Gagal mengambil tag" });
    }
};

export const getNewsTagByName = async (req: Request, res: Response) => {
    try {
        const nama = req.params.nama as string;
        
        const tag = await prisma.newsTag.findUnique({
            where: { nama_tag: nama },
        });

        if (!tag) {
            return res.status(404).json({ error: "Tag tidak ditemukan" });
        }

        res.json(ApiResponse.success(tag));
    } catch (error) {
        res.status(500).json({ error: "Gagal mengambil tag" });
    }
};

export const createNewsTag = async (req: Request, res: Response) => {
    try {
        const { nama_tag } = req.body;
        const newTag = await prisma.newsTag.create({
            data: { nama_tag, jumlah_penggunaan: 0 },
        });
        
        await clearCachePattern("cache:*:*/tags*");

        res.status(201).json(ApiResponse.success(newTag));
    } catch (error) {
        console.error("createNewsTag error:", error);
        res.status(500).json({ error: "Gagal membuat tag" });
    }
};

export const updateNewsTag = async (req: Request, res: Response) => {
    try {
        const uuid = req.params.uuid as string;
        const { nama_tag } = req.body;
        const updatedTag = await prisma.newsTag.update({
            where: { uuid },
            data: { nama_tag },
        });

        await clearCachePattern("cache:*:*/tags*");
        await clearCachePattern("cache:*:*/newsUtama*");

        res.json(ApiResponse.success(updatedTag));
    } catch (error) {
        res.status(500).json({ error: "Gagal mengupdate tag" });
    }
};

export const deleteNewsTag = async (req: Request, res: Response) => {
    try {
        const uuid = req.params.uuid as string;
        await prisma.newsTag.update({
            where: { uuid },
            data: { status_tag: "INACTIVE" },
        });

        await clearCachePattern("cache:*:*/tags*");
        await clearCachePattern("cache:*:*/newsUtama*");

        res.json(ApiResponse.success(null, "Tag berhasil dihapus"));
    } catch (error) {
        res.status(500).json({ error: "Gagal menghapus tag" });
    }
};


