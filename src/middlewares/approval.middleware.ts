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
    include: { senior: true },
  });

  if (!akun?.senior) {
    return res.status(403).json({
      message: "Data senior tidak ditemukan",
    });
  }

  if (!akun.senior.isApprovedByPCPS || !akun.senior.isApprovedByPNPS) {
    return res.status(403).json({
      message: "Belum disetujui oleh PCPS / PNPS",
    });
  }

  next();
};