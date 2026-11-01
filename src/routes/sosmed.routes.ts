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
// Khusus pengelola CMS: fixed=all (semua status) atau statusSosmed=DRAFT|PUBLISHED|ARCHIVED
router.get("/", optionalAuthenticate, getSosmed);

// CMS: DPP (MANAGE_ALL_CABANG) atau role dengan SOSMED_MANAGE (ADMIN_CABANG, KETUA_CABANG)
router.post("/preview", authenticate, authorize("MANAGE_ALL_CABANG", "SOSMED_MANAGE"), validate(previewSosmedSchema), previewSosmed);

router.get("/:uuid", authenticate, authorize("MANAGE_ALL_CABANG", "SOSMED_MANAGE"), validate(uuidParamSchema, "params"), getSosmedById);

router.post("/", authenticate, authorize("MANAGE_ALL_CABANG", "SOSMED_MANAGE"), validate(createSosmedSchema), createSosmed);

router.post("/:uuid/update", authenticate, authorize("MANAGE_ALL_CABANG", "SOSMED_MANAGE"), validate(uuidParamSchema, "params"), validate(updateSosmedSchema), updateSosmed);

router.post("/:uuid/archive", authenticate, authorize("MANAGE_ALL_CABANG", "SOSMED_MANAGE"), validate(uuidParamSchema, "params"), archiveSosmed);

export default router;
