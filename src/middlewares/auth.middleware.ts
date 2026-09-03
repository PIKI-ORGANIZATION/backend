import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import redisClient from "../config/redis";

export interface JwtUser extends JwtPayload {
  sub: string; // UUID sekarang
  email: string;
  username: string;
  roles: string[];
  permissions: string[];

  cabang?: string | null;
  cabangId?: string | null;
  isCabang?: boolean;
  isApprovedByDPC?: boolean;
  isApprovedByDPP?: boolean;
  isFromAdmin?: boolean;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtUser;
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];

  const isBlacklisted = await redisClient.get(`blacklist:${token}`);

  if (isBlacklisted) {
    return res.status(401).json({
      message: "Token sudah logout",
    });
  }

  try {
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET not defined");
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    ) as JwtUser;


    req.user = decoded;
    next();

  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }

    return res.status(401).json({ message: "Invalid token" });
  }
};
