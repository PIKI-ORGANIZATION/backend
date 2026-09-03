import { Request, Response, NextFunction } from "express";
import { prisma } from "../config/prisma.js";

export const requireFullApproval = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const akun = await prisma.akun.findUnique({
    where: { uuid: req.user.sub },
    include: { anggota: true },
  });

  if (!akun?.anggota) {
    return res.status(403).json({
      message: "Data anggota tidak ditemukan",
    });
  }

  if (!akun.anggota.isApprovedByDPC || !akun.anggota.isApprovedByDPP) {
    return res.status(403).json({
      message: "Belum disetujui oleh DPC / DPP",
    });
  }

  next();
};
