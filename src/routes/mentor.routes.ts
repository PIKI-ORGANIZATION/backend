import { Router } from "express";
import {
    getMentor,
    getMentorById,
    createMentor,
    updateMentor,
    deleteMentor
} from "../controllers/mentor.controller";
import { cache } from "../middlewares/cache.middleware.js";
import { validate } from '../middlewares/validate.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize, authorizeAll } from '../middlewares/authorize.middleware';
import { createMentorSchema, updateMentorSchema } from '../validators/mentor.schema';

const router = Router();

router.get("/", getMentor);

router.get("/:uuid", getMentorById);

router.post("/", authenticate, authorize("MANAGE_ALL_CABANG"), validate(createMentorSchema), createMentor);

router.post("/:uuid/update", authenticate, authorize("MANAGE_ALL_CABANG"), validate(updateMentorSchema), updateMentor);

router.post("/:uuid/delete", authenticate, authorize("MANAGE_ALL_CABANG"), deleteMentor);

export default router;
