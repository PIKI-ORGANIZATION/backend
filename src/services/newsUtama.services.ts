import { Request } from "express";
import prisma from "../config/prisma";
import redisClient from "../config/redis";

const VIEW_TTL = 60 * 10; // 10 menit

/**
 * Ambil identifier viewer:
 * - Login → user UUID
 * - Guest → IP Address
 */
export const getViewerIdentifier = (req: Request): string => {
  if (req.user?.sub) {
    return `user:${req.user.sub}`;
  }

  const ip =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0] ||
    req.socket.remoteAddress ||
    "unknown";

  return `ip:${ip}`;
};

/**
 * Track view news utama (anti spam via Redis TTL)
 */
export const trackViewNewsUtama = async (
  req: Request,
  uuid: string
): Promise<void> => {
  try {
    const identifier = getViewerIdentifier(req);

    const key = `news:view:${uuid}:${identifier}`;

    // cek apakah sudah pernah view dalam TTL
    const exists = await redisClient.get(key);
    if (exists) return;

    // set lock TTL
    await redisClient.set(key, "1", {
      EX: VIEW_TTL,
    });

    // increment jumlah dibaca
    await prisma.newsUtama.update({
      where: { uuid },
      data: {
        jumlah_dibaca: {
          increment: 1,
        },
      },
    });
  } catch (error) {
    console.error("trackViewNewsUtama error:", error);
  }
};
