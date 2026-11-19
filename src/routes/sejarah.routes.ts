import { Router } from "express";
import {
  getSejarah,
  getSejarahById,
  createSejarah,
  updateSejarah,
  toggleStatusSejarah,
  archiveSejarah,
  deleteSejarah,
} from "../controllers/sejarah.controller";
import { validate } from '../middlewares/validate.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/authorize.middleware';
import { optionalAuthenticate } from '../middlewares/optionalAuthenticate.middleware';
import { scope } from '../middlewares/scope.middleware';
import { createSejarahSchema, updateSejarahSchema, uuidParamSchema } from '../validators/sejarah.schema';

const router = Router();

const pengelola = [authenticate, scope, authorize("MANAGE_ALL_CABANG", "SEJARAH_MANAGE")];
const validUuid = validate(uuidParamSchema, "params");

// Publik: timeline PUBLISHED. Parameter: search, currentPage, pageSize
// Khusus pengelola CMS: fixed=all (semua status) atau status=DRAFT|PUBLISHED|ARCHIVED
router.get("/", optionalAuthenticate, scope, getSejarah);

// CMS: DPP (MANAGE_ALL_CABANG) atau role dengan SEJARAH_MANAGE (ADMIN_CABANG, KETUA_CABANG)
router.get("/:uuid", ...pengelola, validUuid, getSejarahById);

router.post("/", ...pengelola, validate(createSejarahSchema), createSejarah);

router.post("/:uuid/update", ...pengelola, validUuid, validate(updateSejarahSchema), updateSejarah);

router.post("/:uuid/toggle-status", ...pengelola, validUuid, toggleStatusSejarah);

router.post("/:uuid/archive", ...pengelola, validUuid, archiveSejarah);

router.post("/:uuid/delete", ...pengelola, validUuid, deleteSejarah);

export default router;
