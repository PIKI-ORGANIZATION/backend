import { Router } from "express";
import {
  getSosmed,
  getSosmedById,
  previewSosmed,
  createSosmed,
  updateSosmed,
  archiveSosmed,
} from "../controllers/sosmed.controller";
import { validate } from '../middlewares/validate.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/authorize.middleware';
import { optionalAuthenticate } from '../middlewares/optionalAuthenticate.middleware';
import {
  createSosmedSchema,
  updateSosmedSchema,
  previewSosmedSchema,
  uuidParamSchema,
} from '../validators/sosmed.schema';

const router = Router();

// Publik: konten PUBLISHED. Parameter: platform, penempatan, search, currentPage, pageSize
// Khusus DPP: fixed=all (semua status) atau statusSosmed=DRAFT|PUBLISHED|ARCHIVED
router.get("/", optionalAuthenticate, getSosmed);

// CMS khusus DPP
router.post("/preview", authenticate, authorize("MANAGE_ALL_CABANG"), validate(previewSosmedSchema), previewSosmed);

router.get("/:uuid", authenticate, authorize("MANAGE_ALL_CABANG"), validate(uuidParamSchema, "params"), getSosmedById);

router.post("/", authenticate, authorize("MANAGE_ALL_CABANG"), validate(createSosmedSchema), createSosmed);

router.post("/:uuid/update", authenticate, authorize("MANAGE_ALL_CABANG"), validate(uuidParamSchema, "params"), validate(updateSosmedSchema), updateSosmed);

router.post("/:uuid/archive", authenticate, authorize("MANAGE_ALL_CABANG"), validate(uuidParamSchema, "params"), archiveSosmed);

export default router;
