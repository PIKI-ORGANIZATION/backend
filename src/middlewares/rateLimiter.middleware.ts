import { Request, Response, NextFunction } from "express";
import redisClient from "../config/redis";

const MAX_ATTEMPTS = 5;

export const rateLimitLogin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const ip = req.ip ?? req.socket.remoteAddress ?? "unknown";
  const identifier = req.body.identifier;

  if (!identifier) {
    return res.status(400).json({
      message: "Identifier is required",
    });
  }

  const key = `login:${ip}:${identifier}`;

  try {
    const attempts = await redisClient.get(key);

    if (attempts && Number(attempts) >= MAX_ATTEMPTS) {
      const ttl = await redisClient.ttl(key);

      return res.status(429).json({
        message: `Terlalu banyak percobaan login. Coba lagi dalam ${Math.ceil(ttl / 60)} menit`,
        retryAfterSeconds: ttl,
      });
    }

    next();
  } catch (err) {
    console.error("Rate limiter error:", err);
    next();
  }
};

export const rateLimitResendEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const email = req.body.email;

  if (!email) {
    return res.status(400).json({
      message: "Email wajib diisi",
    });
  }

  const key = `resend-email:${email}`;

  try {
    const isLocked = await redisClient.get(key);

    if (isLocked) {
      const ttl = await redisClient.ttl(key);
      return res.status(429).json({
        message: `Silakan tunggu ${ttl} detik sebelum mengirim ulang email verifikasi.`,
        retryAfterSeconds: ttl,
      });
    }

    // Set lock for 60 seconds
    await redisClient.set(key, "true", {
      EX: 60,
    });

    next();
  } catch (err) {
    console.error("Rate limiter error:", err);
    next();
  }
};

export const rateLimitForgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const email = req.body.email;

  if (!email) {
    return res.status(400).json({
      message: "Email wajib diisi",
    });
  }

  const key = `forgot-password:${email}`;

  try {
    const isLocked = await redisClient.get(key);

    if (isLocked) {
      const ttl = await redisClient.ttl(key);
      return res.status(429).json({
        message: `Silakan tunggu ${ttl} detik sebelum meminta reset password lagi.`,
        retryAfterSeconds: ttl,
      });
    }

    // Set lock for 60 seconds
    await redisClient.set(key, "true", {
      EX: 60,
    });

    next();
  } catch (err) {
    console.error("Rate limiter error:", err);
    next();
  }
};
