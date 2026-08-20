import { Request, Response, NextFunction } from "express";
import { prisma } from "../config/prisma";

export const injectSeniorUuid = async (req: Request, res: Response, next: NextFunction) => {
  if (req.user && !req.user.isFromAdmin) {
    try {
      const akun = await prisma.akun.findUnique({
        where: { uuid: req.user.sub },
        select: { seniorUuid: true }
      });
      if (akun && akun.seniorUuid) {
        req.body.seniorUuid = akun.seniorUuid;
      }
    } catch (error) {
      console.error("Error injecting seniorUuid:", error);
    }
  }
  next();
};
