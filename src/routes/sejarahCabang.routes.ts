import { Router } from "express";
import {
  getSejarahCabang,
  getSejarahCabangByCabangId,
  createSejarahCabang,
  updateSejarahCabang,
  deleteSejarahCabang,
} from "../controllers/sejarahCabang.controller";
import { cache } from "../middlewares/cache.middleware.js";
import { validate } from '../middlewares/validate.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize, authorizeAll } from '../middlewares/authorize.middleware';
import { createSejarahCabangSchema, updateSejarahCabangSchema } from '../validators/sejarahCabang.schema';

const router = Router();

// parameter: search, currentPage, pageSize, fixed (all->untuk statusCabang apapun / active->hanya yang aktif)
router.get("/", authenticate, authorize("CABANG_READ", "MANAGE_ALL_CABANG"), getSejarahCabang);
  
router.get("/:uuidCabang", authenticate, authorize("CABANG_READ", "MANAGE_ALL_CABANG"), getSejarahCabangByCabangId);

router.post("/", authenticate, authorize("CABANG_CREATE", "MANAGE_ALL_CABANG"), validate(createSejarahCabangSchema), createSejarahCabang);

router.post("/:uuid/update", authenticate, authorize("CABANG_UPDATE", "MANAGE_ALL_CABANG"), validate(updateSejarahCabangSchema), updateSejarahCabang);

router.post("/:uuid/delete", authenticate, authorize("CABANG_DELETE", "MANAGE_ALL_CABANG"), deleteSejarahCabang);

export default router;
