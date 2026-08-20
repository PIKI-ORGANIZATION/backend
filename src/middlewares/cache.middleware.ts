import { Request, Response, NextFunction } from "express";
import redisClient from "../config/redis";
import crypto from "crypto";

export const cache = (duration: number) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== "GET") {
      return next();
    }

    const userKey = req.user?.sub ? `user:${req.user.sub}` : "public";
    const key = `cache:${userKey}:${req.originalUrl}`;

    try {
      const cachedResponse = await redisClient.get(key);

      if (cachedResponse) {
        const etag = 'W/"' + crypto.createHash("md5").update(cachedResponse).digest("hex") + '"';
        
        res.setHeader("ETag", etag);
        res.setHeader("Cache-Control", "public, no-cache, must-revalidate");

        if (req.headers["if-none-match"] === etag) {
          return res.status(304).end();
        }

        res.type("json");
        return res.send(cachedResponse);
      }

      const originalJson = res.json.bind(res);

      res.json = (body: any) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const stringifiedBody = JSON.stringify(body);
          redisClient.setEx(key, duration, stringifiedBody);
          
          const etag = 'W/"' + crypto.createHash("md5").update(stringifiedBody).digest("hex") + '"';
          res.setHeader("ETag", etag);
          res.setHeader("Cache-Control", "public, no-cache, must-revalidate");
        }
        
        return originalJson(body);
      };

      next();
    } catch (error) {
      console.error("Redis Cache Error:", error);
      next();
    }
  };
};