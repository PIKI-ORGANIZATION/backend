import { Router } from "express";
import {
  getStrukturOrganisasi,
  getStrukturOrganisasiAdminByCabang,
  getStrukturOrganisasiById,
  createStrukturOrganisasi,
  updateStrukturOrganisasi,
  deleteStrukturOrganisasi,
} from "../controllers/strukturOrganisasi.controller";
import { cache } from "../middlewares/cache.middleware.js";
import { validate } from '../middlewares/validate.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize, authorizeAll } from '../middlewares/authorize.middleware';
import { createStrukturOrganisasiSchema, updateStrukturOrganisasiSchema } from '../validators/strukturOrganisasi.schema';
import { scope } from "../middlewares/scope.middleware";
import { optionalAuthenticate } from '../middlewares/optionalAuthenticate.middleware';

const router = Router();

// parameter: search, currentPage, pageSize, fixed (all->untuk statusCabang apapun / active->hanya yang aktif)
router.get("/", optionalAuthenticate, scope, getStrukturOrganisasi);

router.get('/admin', authenticate, authorize("CABANG_READ", "MANAGE_ALL_CABANG"), getStrukturOrganisasiAdminByCabang);

router.get("/:uuid", authenticate, authorize("CABANG_READ", "MANAGE_ALL_CABANG"), getStrukturOrganisasiById);

router.post("/", authenticate, authorize("CABANG_CREATE", "MANAGE_ALL_CABANG"), validate(createStrukturOrganisasiSchema), createStrukturOrganisasi);

router.post("/:uuid/update", authenticate, authorize("CABANG_UPDATE", "MANAGE_ALL_CABANG"), validate(updateStrukturOrganisasiSchema), updateStrukturOrganisasi);

router.post("/:uuid/delete", authenticate, authorize("CABANG_DELETE", "MANAGE_ALL_CABANG"), deleteStrukturOrganisasi);

export default router;
