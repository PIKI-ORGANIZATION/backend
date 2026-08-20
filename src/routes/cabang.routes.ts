import { Router } from "express";
import {
  getCabang,
  getCabangById,
  createCabang,
  updateCabang,
  deleteCabang,
} from "../controllers/cabang.controller";
import { cache } from "../middlewares/cache.middleware.js";
import { validate } from '../middlewares/validate.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize, authorizeAll } from '../middlewares/authorize.middleware';
import { createCabangSchema, updateCabangSchema } from '../validators/cabang.schema';
import { scope } from "../middlewares/scope.middleware";
import { optionalAuthenticate } from '../middlewares/optionalAuthenticate.middleware';

const router = Router();

// parameter: search, currentPage, pageSize, fixed (all->untuk statusCabang apapun / active->hanya yang aktif)
router.get("/", optionalAuthenticate, scope, getCabang);

router.get("/:uuid", authenticate, authorize("CABANG_READ", "MANAGE_ALL_CABANG"), getCabangById);

router.post("/", authenticate, authorize("CABANG_CREATE", "MANAGE_ALL_CABANG"), validate(createCabangSchema), createCabang);

router.post("/:uuid/update", authenticate, authorize("CABANG_UPDATE", "MANAGE_ALL_CABANG"), validate(updateCabangSchema), updateCabang);

router.post("/:uuid/delete", authenticate, authorize("CABANG_DELETE", "MANAGE_ALL_CABANG"), deleteCabang);

export default router;
