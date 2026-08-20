import { Router } from "express";
import { getYoutubeVideos } from "../controllers/youtube.controller";
import { cache } from "../middlewares/cache.middleware";

const router = Router();

// Retrieve channel videos and cache in Redis for 1 hour
router.get("/videos", cache(3600), getYoutubeVideos);

export default router;
