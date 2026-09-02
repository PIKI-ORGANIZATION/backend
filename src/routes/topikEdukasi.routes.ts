import { Router } from "express";
import {
    getTopikEdukasi,
    getTopikEdukasiById,
    createTopikEdukasi,
    updateTopikEdukasi,
    deleteTopikEdukasi
} from "../controllers/topikEdukasi.controller";
import { cache } from "../middlewares/cache.middleware.js";
import { validate } from '../middlewares/validate.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize, authorizeAll } from '../middlewares/authorize.middleware';
import { createTopikEdukasiSchema, updateTopikEdukasiSchema } from '../validators/topikEdukasi.schema';

const router = Router();

router.get("/", getTopikEdukasi);

router.get("/:uuid", getTopikEdukasiById);

router.post("/", authenticate, authorize("MANAGE_ALL_CABANG"), validate(createTopikEdukasiSchema), createTopikEdukasi);

router.post("/:uuid/update", authenticate, authorize("MANAGE_ALL_CABANG"), validate(updateTopikEdukasiSchema), updateTopikEdukasi);

router.post("/:uuid/delete", authenticate, authorize("MANAGE_ALL_CABANG"), deleteTopikEdukasi);

export default router;
