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
// GET ALL
////////////////////////////////////////////////////
export const getAlbumGaleri = async (req: Request, res: Response) => {
  try {
    const { search, currentPage, pageSize, year, statusAlbum } = req.query as any;
    const scope = req.scope;

    const page = Number(currentPage) || 1;
    const size = Number(pageSize) || 10;
    const skip = (page - 1) * size;

    const whereCondition: any = {};

    // =====================================================
    // SCOPE-BASED FILTERING (mengikuti pattern newsUtama)
    // =====================================================
    if (!scope?.isAdmin) {
      // PUBLIC: hanya album publik & aktif
      whereCondition.isPublic = true;
      whereCondition.statusAlbum = "ACTIVE";
    } else {
      // ADMIN (Hierarki DPP > DPD > DPC)
      const scopeWhere = buildCabangRelationScopeWhere(scope);
      if (scopeWhere) {
        whereCondition.AND = [scopeWhere];
      }

      // Admin status filter from query
      if (statusAlbum) {
        whereCondition.statusAlbum = statusAlbum;
      }
    }

    // FILTER TAHUN (untuk landing page)
    if (year) {
      const startDate = new Date(`${year}-01-01`);
      const endDate = new Date(`${Number(year) + 1}-01-01`);
      whereCondition.tanggalKegiatan = {
        gte: startDate,
        lt: endDate,
      };
    }

    if (search) {
      whereCondition.OR = [
        { namaAlbum: { contains: search, mode: "insensitive" } },
        { deskripsi: { contains: search, mode: "insensitive" } },
      ];
    }

    const total = await prisma.albumGaleri.count({ where: whereCondition });

    const data = await prisma.albumGaleri.findMany({
        where: whereCondition,
        include: {
            mediaList: {
              select: {
                uuid: true,
                tipeMedia: true,
                urlMedia: true,
                thumbnail: true,
                keterangan: true,
                urutan: true,
              },
              orderBy: { urutan: "asc" },
            },
            cabang: {
              select: {
                uuid: true,
                namaCabang: true,
              },
            },
            _count: {
              select: { mediaList: true },
            },
        },
        orderBy: { tanggalKegiatan: "desc" },
        skip,
        take: size,
    });

    return res.status(200).json(
      ApiResponse.success({
        result: data,
        pagination: { currentPage: page, pageSize: size, total },
      })
    );
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getAlbumGaleriById = async (req: Request, res: Response) => {
  try {
    const uuid = String(req.params.uuid);

    const data = await prisma.albumGaleri.findUnique({
      where: { uuid },
    });

    if (!data) {
      return res.status(404).json({ message: "Album not found" });
    }

    await assertCanReadCabangItem(req.scope, data.cabangUuid, "album galeri");

    return res.status(200).json(
      ApiResponse.success({
        data,
      })
    );
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};

////////////////////////////////////////////////////
// CREATE
////////////////////////////////////////////////////
export const createAlbumGaleri = async (
  req: Request,
  res: Response
) => {
  try {
    const user = req.user!;
    const scope = req.scope;

    const data = Array.isArray(req.body)
      ? req.body
      : [req.body];

    const result = await prisma.albumGaleri.createMany({
      data: data.map((d) => ({
        ...d,

        // =================================================
        // AUTO INJECT CABANG
        // =================================================
        cabangUuid: resolveCreateCabangUuid(scope, d.cabangUuid),

        insert_by: user.sub,
      })),
    });

    return res.status(201).json(
      ApiResponse.success({
        message: `${result.count} album berhasil dibuat`,
      })
    );

  } catch (error: any) {

    res.status(error.statusCode || 500).json({
      message: error.message,
    });
  }
};

////////////////////////////////////////////////////
// UPDATE
////////////////////////////////////////////////////
export const updateAlbumGaleri = async (req: Request, res: Response) => {
  try {
    const { uuid } = req.params;
    const user = req.user!;

    const existing = await prisma.albumGaleri.findUnique({ where: { uuid: String(uuid) } });
    if (!existing) {
      return res.status(404).json({ message: "Album not found" });
    }

    assertCanWriteCabangItem(req.scope, existing.cabangUuid, "album galeri");

    const { cabangUuid: bodyCabangUuid, ...restBody } = req.body;

    const updated = await prisma.albumGaleri.update({
      where: { uuid: String(uuid) },
      data: {
        ...restBody,
        ...(req.scope?.isSuperAdmin && bodyCabangUuid !== undefined && { cabangUuid: bodyCabangUuid }),
        update_by: user.sub,
      },
    });

    return res.status(200).json(
      ApiResponse.success({
        message: "Album berhasil diupdate",
        data: updated,
      })
    );
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};

////////////////////////////////////////////////////
// DELETE (SOFT)
////////////////////////////////////////////////////
export const deleteAlbumGaleri = async (req: Request, res: Response) => {
  try {
    const { uuid } = req.params;
    const user = req.user!;

    const existing = await prisma.albumGaleri.findUnique({ where: { uuid: String(uuid) } });
    if (!existing) {
      return res.status(404).json({ message: "Album not found" });
    }

    assertCanWriteCabangItem(req.scope, existing.cabangUuid, "album galeri");

    await prisma.albumGaleri.update({
      where: { uuid: String(uuid) },
      data: {
        statusAlbum: "ARCHIVED",
        update_by: user.sub,
      },
    });

    return res.status(200).json(
      ApiResponse.success({
        message: "Album berhasil di-archive",
      })
    );
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};
