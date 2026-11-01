import { Router } from "express";
import {
  getGaleri,
  getGaleriStats,
  getGaleriById,
  previewGaleri,
  createGaleri,
  updateGaleri,
  toggleStatusGaleri,
  toggleFeaturedGaleri,
  archiveGaleri,
  deleteGaleri,
} from "../controllers/galeri.controller";
import { validate } from '../middlewares/validate.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/authorize.middleware';
import { optionalAuthenticate } from '../middlewares/optionalAuthenticate.middleware';
import {
  createGaleriSchema,
  updateGaleriSchema,
  previewGaleriSchema,
  idParamSchema,
} from '../validators/galeri.schema';

const router = Router();

// CMS: DPP (MANAGE_ALL_CABANG) atau role dengan GALERI_MANAGE (ADMIN_CABANG, KETUA_CABANG)
const pengelola = [authenticate, authorize("MANAGE_ALL_CABANG", "GALERI_MANAGE")];
const validId = validate(idParamSchema, "params");

// Publik: item PUBLISHED. Parameter: type, kategori, penempatan, search, currentPage, pageSize
// Khusus pengelola: fixed=all (semua status) atau status=DRAFT|PUBLISHED|ARCHIVED
router.get("/", optionalAuthenticate, getGaleri);

router.get("/stats", ...pengelola, getGaleriStats);

router.post("/preview", ...pengelola, validate(previewGaleriSchema), previewGaleri);

router.get("/:id", ...pengelola, validId, getGaleriById);

router.post("/", ...pengelola, validate(createGaleriSchema), createGaleri);

router.post("/:id/update", ...pengelola, validId, validate(updateGaleriSchema), updateGaleri);

router.post("/:id/toggle-status", ...pengelola, validId, toggleStatusGaleri);

router.post("/:id/toggle-featured", ...pengelola, validId, toggleFeaturedGaleri);

router.post("/:id/archive", ...pengelola, validId, archiveGaleri);

router.post("/:id/delete", ...pengelola, validId, deleteGaleri); // soft delete

export default router;
