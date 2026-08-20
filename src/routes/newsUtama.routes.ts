import { Router } from 'express';
import { 
    getNewsUtama,
    getNewsUtamaById,
    getNewsUtamaByCabang,
    getNewsUtamaAdminByCabang,
    getNewsUtamaBySlug,
    getNewsUtamaByKategori,
    getNewsUtamaByTag,
    getNewsUtamaSearch,
    createNewsUtama,
    updateNewsUtama,
    archiveNewsUtama
 } from '../controllers/newsUtama.controller';
import { cache } from '../middlewares/cache.middleware.js';
import { validate } from '../middlewares/validate.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import { optionalAuthenticate } from '../middlewares/optionalAuthenticate.middleware';
import { authorize, authorizeAll } from '../middlewares/authorize.middleware';
import { createNewsUtamaBulkSchema, updateNewsUtamaSchema } from '../validators/newsUtama.schema';
import { scope } from "../middlewares/scope.middleware";

const router = Router();

// Cache for 1 hour (3600 seconds)
router.get('/search', getNewsUtamaSearch);
router.get('/', optionalAuthenticate, scope, getNewsUtama); // utk get semua news utama, bisa diakses public

// Admin route untuk get news utama berdasarkan cabang, hanya bisa diakses oleh user dengan role MANAGE_ALL_CABANG
router.get('/admin', authenticate, authorize("CABANG_READ", "MANAGE_ALL_CABANG"), getNewsUtamaAdminByCabang);

router.get('/:uuid', getNewsUtamaById); // utk get news utama by id, bisa diakses public
router.get('/cabang/:cabangUuid', getNewsUtamaByCabang); // utk get news utama dari cabang tertentu, bisa diakses public

router.get('/tags/:tag', getNewsUtamaByTag);
router.get('/kategori/:kategori', getNewsUtamaByKategori);
router.get('/slug/:slug', getNewsUtamaBySlug);

router.post('/', optionalAuthenticate, scope, authorize("NEWS_UTAMA_CREATE", "MANAGE_ALL_CABANG"), validate(createNewsUtamaBulkSchema), createNewsUtama);
router.post('/:uuid/update', authenticate, authorize("NEWS_UTAMA_UPDATE", "MANAGE_ALL_CABANG"), validate(updateNewsUtamaSchema), updateNewsUtama);
router.post('/:uuid/archive', authenticate, authorize("NEWS_UTAMA_ARCHIVE", "MANAGE_ALL_CABANG"), archiveNewsUtama);

// router.get('/categories', cache(3600), getCategories);
// router.get('/tags', cache(3600), getTags);


export default router;