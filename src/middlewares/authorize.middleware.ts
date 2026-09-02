import { Request, Response, NextFunction } from "express";

/**
 * OR-based authorization
 * User cukup punya SALAH SATU permission
 */
export const authorize =
  (...requiredPermissions: string[]) =>
  (req: Request, res: Response, next: NextFunction) => {

    // 1️ cek autentikasi
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized",
        reason: "User belum terautentikasi",
      });
    }

    const userPermissions: string[] = Array.isArray(req.user.permissions)
      ? req.user.permissions.filter(Boolean)
      : [];

    // 2️ cek minimal satu permission cocok
    const allowed = requiredPermissions.some((perm) =>
      userPermissions.includes(perm)
    );

    if (!allowed) {
      return res.status(403).json({
        message: "Forbidden",
        reason: "Permission tidak mencukupi (OR)",
        // requiredPermissions,
        // userPermissions,
        // endpoint: `${req.method} ${req.originalUrl}`,
      });
    }

    // 3️ audit / debug log
    // console.log("Authorization success (OR)", {
    //   email: req.user.email,
    //   username: req.user.username,
    //   endpoint: `${req.method} ${req.originalUrl}`,
    //   requiredPermissions,
    //   userPermissions,
    // });

    // 4️ inject auth info (opsional)
    (req as any).authInfo = {
      mode: "OR",
      endpoint: `${req.method} ${req.originalUrl}`,
      permissions: userPermissions,
    };

    next();
  };

/**
 * AND-based authorization
 * User WAJIB punya SEMUA permission
 */
export const authorizeAll =
  (...requiredPermissions: string[]) =>
  (req: Request, res: Response, next: NextFunction) => {

    // 1️ cek autentikasi
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized",
        reason: "User belum terautentikasi",
      });
    }

    const userPermissions: string[] = Array.isArray(req.user.permissions)
      ? req.user.permissions.filter(Boolean)
      : [];

    // 2️ cek semua permission wajib ada
    const allowed = requiredPermissions.every((perm) =>
      userPermissions.includes(perm)
    );

    if (!allowed) {
      return res.status(403).json({
        message: "Forbidden",
        reason: "Permission tidak mencukupi (AND)",
        // requiredPermissions,
        // userPermissions,
        // endpoint: `${req.method} ${req.originalUrl}`,
      });
    }

    // 3️ audit / debug log
    // console.log("Authorization success (AND)", {
    //   email: req.user.email,
    //   username: req.user.username,
    //   endpoint: `${req.method} ${req.originalUrl}`,
    //   requiredPermissions,
    //   userPermissions,
    // });

    // 4️ inject auth info (opsional)
    (req as any).authInfo = {
      mode: "AND",
      endpoint: `${req.method} ${req.originalUrl}`,
      permissions: userPermissions,
    };

    next();
  };
