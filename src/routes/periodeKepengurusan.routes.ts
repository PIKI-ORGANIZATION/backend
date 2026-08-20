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

router.get("/admin", authenticate, authorize("CABANG_READ", "MANAGE_ALL_CABANG"), getPeriodeKepengurusanAdminByCabang);

router.get("/:uuid", authenticate, authorize("CABANG_READ", "MANAGE_ALL_CABANG"), getPeriodeKepengurusanById);

router.post("/", authenticate, authorize("CABANG_CREATE"), validate(createPeriodeSchema), createPeriodeKepengurusan);

router.post("/:uuid/update", authenticate, authorize("CABANG_UPDATE"), validate(updatePeriodeSchema), updatePeriodeKepengurusan);

router.post("/:uuid/delete", authenticate, authorize("CABANG_DELETE"), deletePeriodeKepengurusan);

export default router;
