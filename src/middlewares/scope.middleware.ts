import { Request, Response, NextFunction } from "express";

export interface RequestScope {
  isAdmin: boolean;
  isSuperAdmin: boolean;
  cabangId: string | null;
}

declare global {
  namespace Express {
    interface Request {
      scope?: RequestScope;
    }
  }
}

export const scope = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = req.user;

  const permissions = user?.permissions || [];

  const isSuperAdmin = permissions.includes("MANAGE_ALL_CABANG");
  const isAdmin = user?.isFromAdmin === true || isSuperAdmin;

  req.scope = {
    isAdmin,
    isSuperAdmin,
    cabangId: user?.cabangId ?? null,
  };

  next();
};
