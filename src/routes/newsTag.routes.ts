import e, { Router } from "express";
import {
    getNewsTags,
    getNewsTagById,
    getNewsTagByName,
    createNewsTag,
    updateNewsTag,
    deleteNewsTag
} from "../controllers/newsTag.controller";
import { validate } from '../middlewares/validate.middleware';
import { createNewsTagBulkSchema, updateNewsTagSchema } from "../validators/newsTag.schema.js";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize, authorizeAll } from "../middlewares/authorize.middleware";

const router = Router();

router.get("/", getNewsTags);
router.get("/:uuid", getNewsTagById);
router.get("/nama/:nama", getNewsTagByName);
router.post("/", authenticate, authorize("NEWS_TAG_CREATE", "MANAGE_ALL_CABANG"), validate(createNewsTagBulkSchema), createNewsTag);
router.post("/:uuid/update", authenticate, authorize("NEWS_TAG_UPDATE", "MANAGE_ALL_CABANG"), validate(updateNewsTagSchema), updateNewsTag);
router.post("/:uuid/delete", authenticate, authorize("NEWS_TAG_DELETE", "MANAGE_ALL_CABANG"), deleteNewsTag);

export default router;