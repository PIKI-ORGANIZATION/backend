import { Router } from 'express';
import { getHomeData, getHistory, getPrograms, getTeam, getBotPreview } from '../controllers/page.controller';
import { cache } from '../middlewares/cache.middleware';

const router = Router();

router.get('/home', cache(3600), getHomeData);
router.get('/history', cache(3600), getHistory);
router.get('/programs', cache(3600), getPrograms);
router.get('/team', cache(3600), getTeam);
router.get('/og-preview', getBotPreview);

export default router;
