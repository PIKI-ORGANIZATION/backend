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

// Publik: timeline ACTIVE. Parameter: search, currentPage, pageSize, fixed=all (khusus DPP: semua status)
router.get("/", optionalAuthenticate, getSejarah);

// CMS khusus DPP
router.get("/:uuid", authenticate, authorize("MANAGE_ALL_CABANG"), validate(uuidParamSchema, "params"), getSejarahById);

router.post("/", authenticate, authorize("MANAGE_ALL_CABANG"), validate(createSejarahSchema), createSejarah);

router.post("/:uuid/update", authenticate, authorize("MANAGE_ALL_CABANG"), validate(uuidParamSchema, "params"), validate(updateSejarahSchema), updateSejarah);

router.post("/:uuid/delete", authenticate, authorize("MANAGE_ALL_CABANG"), validate(uuidParamSchema, "params"), deleteSejarah);

export default router;
