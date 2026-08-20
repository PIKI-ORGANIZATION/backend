import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import redisClient from "../config/redis";
import { JwtUser } from "./auth.middleware";

export const optionalAuthenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  // kalau tidak ada token → lanjut sebagai public
  if (!authHeader?.startsWith("Bearer ")) {
    req.user = undefined;
    return next();
  }

  const token = authHeader.split(" ")[1];

  try {
    const isBlacklisted = await redisClient.get(`blacklist:${token}`);

    if (isBlacklisted) {
      return next(); // treat as public
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET not defined");
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    ) as JwtUser;

    req.user = decoded;
    next();
  } catch {
    // kalau token invalid → anggap public (jangan error)
    req.user = undefined;
    next();
  }
};