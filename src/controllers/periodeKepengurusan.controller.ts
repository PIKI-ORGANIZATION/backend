import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { ApiResponse } from "../utils/apiResponse";
import ta from "zod/v4/locales/ta.js";

////////////////////////////////////////////////////
// GET ALL PERIODE
////////////////////////////////////////////////////
export const getPeriodeKepengurusan = async (req: Request, res: Response) => {
  try {
    const { search, currentPage, pageSize, isAktif, fixed } = req.query as {
      search?: string;
      currentPage?: string;
      pageSize?: string;
      isAktif?: string;
      fixed?: string;
    };

    const scope = req.scope;

    const page = Number(currentPage) || 1;
    const size = Number(pageSize) || 10;
    const skip = (page - 1) * size;

    const where: any = {};

    ////////////////////////////////////////////////////
    // SEARCH
    ////////////////////////////////////////////////////
    if (search) {
      where.namaPeriode = {
        contains: search,
        mode: "insensitive",
      };
    }

    ////////////////////////////////////////////////////
    // OPTIONAL FILTER (ADMIN ONLY)
    ////////////////////////////////////////////////////
    if (isAktif !== undefined) {
      where.isAktif = isAktif === "true";
    }

    const includeAll = fixed?.toLowerCase() === "all";

    ////////////////////////////////////////////////////
    // ROLE BASED (SCOPE)
    ////////////////////////////////////////////////////

    if (!scope?.isAdmin) {
      // PUBLIC → hanya aktif
      where.isAktif = true;
    } else {
      // ADMIN

      // ADMIN CABANG
      if (!scope.isSuperAdmin) {
        where.cabangUuid = scope.cabangId;
      }

      // default tetap aktif kecuali fixed=all
      if (!includeAll && isAktif === undefined) {
        where.isAktif = true;
      }
    }

    ////////////////////////////////////////////////////

    const total = await prisma.periodeKepengurusan.count({ where });

    const data = await prisma.periodeKepengurusan.findMany({
      where,
      orderBy: { tahunMulai: "desc" },
      skip,
      take: size,
      include: {
        cabang: {
          select: { namaCabang: true },
        },
      },
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
    res.status(500).json({ message: error.message });
  }
};

export const getPeriodeKepengurusanAdminByCabang = async (
  req: Request,
  res: Response
) => {
  try {
    const { search, currentPage, pageSize, isAktif } = req.query as {
      search?: string;
      currentPage?: string;
      pageSize?: string;
      isAktif?: string;
    };

    const page = Number(currentPage) || 1;
    const size = Number(pageSize) || 10;
    const skip = (page - 1) * size;

    const uuid = req.user?.cabangId;
    const isManageAllCabang =
      req.user?.permissions.includes("MANAGE_ALL_CABANG");

    const where: any = {};

    ////////////////////////////////////////////////////
    // FILTER CABANG (IMPORTANT)
    ////////////////////////////////////////////////////
    if (!isManageAllCabang) {
      where.cabangUuid = uuid;
    }

    ////////////////////////////////////////////////////
    // SEARCH
    ////////////////////////////////////////////////////
    if (search) {
      where.namaPeriode = {
        contains: search,
        mode: "insensitive",
      };
    }

    ////////////////////////////////////////////////////
    // FILTER STATUS AKTIF
    ////////////////////////////////////////////////////
    if (isAktif !== undefined) {
      where.isAktif = isAktif === "true";
    }

    ////////////////////////////////////////////////////
    // TOTAL
    ////////////////////////////////////////////////////
    const total = await prisma.periodeKepengurusan.count({ where });

    ////////////////////////////////////////////////////
    // QUERY DATA
    ////////////////////////////////////////////////////
    const data = await prisma.periodeKepengurusan.findMany({
      where,
      orderBy: { tahunMulai: "desc" },
      skip,
      take: size,
      include: {
        cabang: {
          select: { namaCabang: true },
        },
      },
    });

    ////////////////////////////////////////////////////
    // RESPONSE
    ////////////////////////////////////////////////////
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
    res.status(500).json({ message: error.message });
  }
};

export const getPeriodeKepengurusanById = async (req: Request, res: Response) => {
  try {
    const { uuid } = req.params;

    const data = await prisma.periodeKepengurusan.findUnique({
      where: { uuid },
      select: {
        uuid: true,
        namaPeriode: true,
        tahunMulai: true,
        tahunSelesai: true,
        isAktif: true,
        cabangUuid: true,
        cabang: { select: { namaCabang: true } },
      },
    });

    if (!data) {
      return res.status(404).json({ message: "Periode tidak ditemukan" });
    }

    return res.status(200).json(ApiResponse.success(data));
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

////////////////////////////////////////////////////
// CREATE
////////////////////////////////////////////////////
export const createPeriodeKepengurusan = async (req: Request, res: Response) => {
  try {
    const user = req.user!;

    // jika set aktif → nonaktifkan lainnya
    if (req.body.isAktif) {
      await prisma.periodeKepengurusan.updateMany({
        data: { isAktif: false },
      });
    }

    const created = await prisma.periodeKepengurusan.create({
      data: {
        ...req.body,
        insert_by: user.sub,
      },
    });

    return res.status(201).json(
      ApiResponse.success({
        message: "Periode berhasil dibuat",
        data: created,
      })
    );
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

////////////////////////////////////////////////////
// UPDATE
////////////////////////////////////////////////////
export const updatePeriodeKepengurusan = async (req: Request, res: Response) => {
  try {
    const { uuid } = req.params;
    const user = req.user!;

    const existing = await prisma.periodeKepengurusan.findUnique({
      where: { uuid },
    });

    if (!existing) {
      return res.status(404).json({ message: "Periode tidak ditemukan" });
    }

    if (req.body.isAktif) {
      await prisma.periodeKepengurusan.updateMany({
        where: { NOT: { uuid } },
        data: { isAktif: false },
      });
    }

    const updated = await prisma.periodeKepengurusan.update({
      where: { uuid },
      data: {
        ...req.body,
        update_by: user.sub,
      },
    });

    return res.status(200).json(
      ApiResponse.success({
        message: "Berhasil update periode",
        data: updated,
      })
    );
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

////////////////////////////////////////////////////
// DELETE
////////////////////////////////////////////////////
export const deletePeriodeKepengurusan = async (req: Request, res: Response) => {
  try {
    const { uuid } = req.params;

    await prisma.periodeKepengurusan.delete({
      where: { uuid },
    });

    return res.status(200).json(
      ApiResponse.success({
        message: "Periode berhasil dihapus",
      })
    );
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
