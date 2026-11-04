import { Request, Response, NextFunction } from "express";
import prisma from "../config/prisma";

export interface RequestScope {
  isAdmin: boolean;
  isSuperAdmin: boolean;
  cabangId: string | null;
  tingkat: "DPD" | "DPC" | null;
  dpdId: string | null;
  dpcId: number | null;
  kodeProvinsi: string | null;
  kodeKabupaten: string | null;
}

declare global {
  namespace Express {
    interface Request {
      scope?: RequestScope;
    }
  }
}

export const scope = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user;

    const permissions = user?.permissions || [];

    const isSuperAdmin = permissions.includes("MANAGE_ALL_CABANG");
    const isAdmin = user?.isFromAdmin === true || isSuperAdmin;

    let kodeProvinsi: string | null = null;
    let kodeKabupaten: string | null = null;

    // Resolusi kode wilayah berdasarkan hierarki akun (DPD / DPC)
    if (!isSuperAdmin && user) {
      if (user.tingkat === "DPD" && user.dpdId) {
        const dpd = await prisma.dpd.findFirst({
          where: { id: user.dpdId, deletedAt: null },
          select: { kodeProvinsi: true },
        });
        kodeProvinsi = dpd?.kodeProvinsi ?? null;
      } else if (user.tingkat === "DPC" && user.dpcId) {
        const dpc = await prisma.dpdDpc.findFirst({
          where: { id: user.dpcId, deleted_at: null },
          select: { kode_kabupaten: true, kode_provinsi: true },
        });
        kodeKabupaten = dpc?.kode_kabupaten ?? null;
        kodeProvinsi = dpc?.kode_provinsi ?? null;
      }
    }

    req.scope = {
      isAdmin,
      isSuperAdmin,
      cabangId: user?.cabangId ?? null,
      tingkat: user?.tingkat ?? null,
      dpdId: user?.dpdId ?? null,
      dpcId: user?.dpcId ?? null,
      kodeProvinsi,
      kodeKabupaten,
    };

    next();
  } catch (error) {
    next(error);
  }
};
