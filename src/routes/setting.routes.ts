import { Router } from 'express';
import { getCountdown } from '../controllers/setting.controller';
import { cache } from '../middlewares/cache.middleware';

const router = Router();

router.get('/countdown', cache(3600), getCountdown);

export default router;
