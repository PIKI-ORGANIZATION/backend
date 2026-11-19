import { Router } from "express";
import {
  getPeriodeKepengurusan,
  getPeriodeKepengurusanAdminByCabang,
  getPeriodeKepengurusanById,
  createPeriodeKepengurusan,
  updatePeriodeKepengurusan,
  deletePeriodeKepengurusan,
} from "../controllers/periodeKepengurusan.controller";
import { cache } from "../middlewares/cache.middleware.js";
import { validate } from '../middlewares/validate.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize, authorizeAll } from '../middlewares/authorize.middleware';
import { createPeriodeSchema, updatePeriodeSchema } from '../validators/periodeJabatanBidang.schema';
import { scope } from "../middlewares/scope.middleware";
import { optionalAuthenticate } from '../middlewares/optionalAuthenticate.middleware';

const router = Router();

// parameter: search, currentPage, pageSize, fixed (all->untuk statusCabang apapun / active->hanya yang aktif)
router.get("/", optionalAuthenticate, scope, getPeriodeKepengurusan);

router.get("/admin", authenticate, scope, authorize("CABANG_READ", "STRUKTUR_READ", "MANAGE_ALL_CABANG"), getPeriodeKepengurusanAdminByCabang);

router.get("/:uuid", authenticate, scope, authorize("CABANG_READ", "STRUKTUR_READ", "MANAGE_ALL_CABANG"), getPeriodeKepengurusanById);

router.post("/", authenticate, scope, authorize("CABANG_CREATE", "CABANG_UPDATE", "STRUKTUR_CREATE", "MANAGE_ALL_CABANG"), validate(createPeriodeSchema), createPeriodeKepengurusan);

router.post("/:uuid/update", authenticate, scope, authorize("CABANG_UPDATE", "STRUKTUR_UPDATE", "MANAGE_ALL_CABANG"), validate(updatePeriodeSchema), updatePeriodeKepengurusan);

router.post("/:uuid/delete", authenticate, scope, authorize("CABANG_DELETE", "CABANG_UPDATE", "STRUKTUR_DELETE", "MANAGE_ALL_CABANG"), deletePeriodeKepengurusan);

export default router;
