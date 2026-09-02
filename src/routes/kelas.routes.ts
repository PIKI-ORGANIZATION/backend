import { Router } from "express";
import {
    getKelas,
    getKelasById,
    getKelasByTopikEdukasiId,
    createKelas,
    updateKelas,
    deleteKelas
} from "../controllers/kelas.controller";
import { cache } from "../middlewares/cache.middleware.js";
import { validate } from '../middlewares/validate.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize, authorizeAll } from '../middlewares/authorize.middleware';
import { createKelasSchema, updateKelasSchema } from '../validators/kelas.schema';

const router = Router();

router.get("/", getKelas);

router.get("/:uuid", getKelasById);

router.get("/:topikUuid", getKelasByTopikEdukasiId);

router.post("/", authenticate, authorize("MANAGE_ALL_CABANG"), validate(createKelasSchema), createKelas);

router.post("/:uuid/update", authenticate, authorize("MANAGE_ALL_CABANG"), validate(updateKelasSchema), updateKelas);

router.post("/:uuid/delete", authenticate, authorize("MANAGE_ALL_CABANG"), deleteKelas);

export default router;
