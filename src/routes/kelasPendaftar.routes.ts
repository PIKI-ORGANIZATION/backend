import { Router } from "express";
import {
    getPendaftaranKelas,
    getPendaftaranKelasById,
    getPendaftaranKelasByEmailPendaftar, // khusus get utk pendaftar public tanpa login
    createPendaftaranKelas,
    updatePendaftaranKelas,
    deletePendaftaranKelas,
} from "../controllers/kelasPendaftar.controller";
import { cache } from "../middlewares/cache.middleware.js";
import { validate } from '../middlewares/validate.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize, authorizeAll } from '../middlewares/authorize.middleware';
import { createPendaftaranSchema, updatePendaftaranSchema } from '../validators/kelasPendaftar.schema';

const router = Router();

router.get("/", authenticate, authorize("MANAGE_ALL_CABANG"), getPendaftaranKelas);

router.get("/:uuid", authenticate, authorize("MANAGE_ALL_CABANG"), getPendaftaranKelasById);

router.get("/:email", getPendaftaranKelasByEmailPendaftar);

router.post("/", validate(createPendaftaranSchema), createPendaftaranKelas);

router.post("/:uuid/update", authenticate, authorize("MANAGE_ALL_CABANG"), validate(updatePendaftaranSchema), updatePendaftaranKelas);

router.post("/:uuid/delete", authenticate, authorize("MANAGE_ALL_CABANG"), deletePendaftaranKelas);

export default router;