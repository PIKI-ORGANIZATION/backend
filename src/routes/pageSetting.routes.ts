import { Router } from 'express';
import { 
    getPageSetting,
    getPageSettingById,
    getPageSettingByKey,
    getBulkPageSettings,
    createPageSetting,
    updatePageSetting,
    deletePageSetting,
 } from '../controllers/pageSetting.controller';
import { validate } from '../middlewares/validate.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/authorize.middleware';
import { createPageSettingSchema, updatePageSettingSchema } from '../validators/pageSetting.schema';

const router = Router();

// Public: bulk lookup by keys (for frontend consumption)
router.get('/bulk', getBulkPageSettings);

// Public: lookup by key (for frontend consumption)
router.get('/key/:key', getPageSettingByKey);

// Admin: CRUD
router.get('/', authenticate, authorize("MANAGE_PAGE_SETTINGS", "MANAGE_ALL_CABANG"), getPageSetting);
router.get('/:uuid', authenticate, authorize("MANAGE_PAGE_SETTINGS", "MANAGE_ALL_CABANG"), getPageSettingById);

router.post('/', authenticate, authorize("MANAGE_PAGE_SETTINGS", "MANAGE_ALL_CABANG"), validate(createPageSettingSchema), createPageSetting);
router.post('/:uuid/update', authenticate, authorize("MANAGE_PAGE_SETTINGS", "MANAGE_ALL_CABANG"), validate(updatePageSettingSchema), updatePageSetting);
router.post('/:uuid/delete', authenticate, authorize("MANAGE_PAGE_SETTINGS", "MANAGE_ALL_CABANG"), deletePageSetting);

export default router;
