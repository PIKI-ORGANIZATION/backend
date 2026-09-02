import { Router } from "express";
import {
  getJabatan,
  getJabatanById,
  createJabatan,
  updateJabatan,
  deleteJabatan,
} from "../controllers/jabatan.controller";
import { cache } from "../middlewares/cache.middleware.js";
import { validate } from '../middlewares/validate.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize, authorizeAll } from '../middlewares/authorize.middleware';
import { createJabatanSchema, updateJabatanSchema } from '../validators/periodeJabatanBidang.schema';
import { scope } from "../middlewares/scope.middleware";
import { optionalAuthenticate } from '../middlewares/optionalAuthenticate.middleware';

const router = Router();

router.get("/", optionalAuthenticate, scope, getJabatan);

router.get("/:uuid", authenticate, authorize("CABANG_READ", "MANAGE_ALL_CABANG"), getJabatanById);

router.post("/", authenticate, authorize("CABANG_CREATE", "MANAGE_ALL_CABANG"), validate(createJabatanSchema), createJabatan);

router.post("/:uuid/update", authenticate, authorize("CABANG_UPDATE", "MANAGE_ALL_CABANG"), validate(updateJabatanSchema), updateJabatan);

router.post("/:uuid/delete", authenticate, authorize("CABANG_DELETE", "MANAGE_ALL_CABANG"), deleteJabatan);

export default router;
