import { Router } from "express";
import {
  getSejarah,
  getSejarahById,
  createSejarah,
  updateSejarah,
  deleteSejarah,
} from "../controllers/sejarah.controller";
import { validate } from '../middlewares/validate.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/authorize.middleware';
import { optionalAuthenticate } from '../middlewares/optionalAuthenticate.middleware';
import { createSejarahSchema, updateSejarahSchema, uuidParamSchema } from '../validators/sejarah.schema';

const router = Router();

// Publik: timeline ACTIVE. Parameter: search, currentPage, pageSize, fixed=all (khusus pengelola CMS: semua status)
router.get("/", optionalAuthenticate, getSejarah);

// CMS: DPP (MANAGE_ALL_CABANG) atau role dengan SEJARAH_MANAGE (ADMIN_CABANG, KETUA_CABANG)
router.get("/:uuid", authenticate, authorize("MANAGE_ALL_CABANG", "SEJARAH_MANAGE"), validate(uuidParamSchema, "params"), getSejarahById);

router.post("/", authenticate, authorize("MANAGE_ALL_CABANG", "SEJARAH_MANAGE"), validate(createSejarahSchema), createSejarah);

router.post("/:uuid/update", authenticate, authorize("MANAGE_ALL_CABANG", "SEJARAH_MANAGE"), validate(uuidParamSchema, "params"), validate(updateSejarahSchema), updateSejarah);

router.post("/:uuid/delete", authenticate, authorize("MANAGE_ALL_CABANG", "SEJARAH_MANAGE"), validate(uuidParamSchema, "params"), deleteSejarah);

export default router;
