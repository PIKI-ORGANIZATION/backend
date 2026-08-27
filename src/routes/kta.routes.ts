import { Router } from 'express';
import { KtaController } from '../controllers/kta.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Endpoint untuk download KTA
// Memerlukan token otentikasi
router.get('/download', authenticate, KtaController.downloadKta);

export default router;
