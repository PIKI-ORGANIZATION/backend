import { Request, Response, NextFunction } from "express";
import { prisma } from "../config/prisma";

export const injectAnggotaUuid = async (req: Request, res: Response, next: NextFunction) => {
  if (req.user && !req.user.isFromAdmin) {
    try {
      const akun = await prisma.akun.findUnique({
        where: { uuid: req.user.sub },
        select: { anggotaUuid: true }
      });
      if (akun && akun.anggotaUuid) {
        req.body.anggotaUuid = akun.anggotaUuid;
      }
    } catch (error) {
      console.error("Error injecting anggotaUuid:", error);
    }
  }
  next();
};
