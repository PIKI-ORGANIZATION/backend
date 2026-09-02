import e, { Router } from "express";
import {
    getNewsKategori,
    getNewsKategoriById,
    getNewsKategoriByName,
    createNewsKategori,
    updateNewsKategori,
    deleteNewsKategori
} from "../controllers/newsKategori.controller";
import { validate } from '../middlewares/validate.middleware';
import { createKategoriSchema, updateKategoriSchema } from "../validators/newsKategori.schema";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize, authorizeAll } from "../middlewares/authorize.middleware";

const router = Router();

router.get("/", getNewsKategori);
router.get("/:uuid", getNewsKategoriById);
router.get("/nama/:nama", getNewsKategoriByName);
router.post("/", authenticate, authorize("NEWS_KATEGORI_CREATE"), validate(createKategoriSchema), createNewsKategori);
router.post("/:uuid/update", authenticate, authorize("NEWS_KATEGORI_UPDATE"), validate(updateKategoriSchema), updateNewsKategori);
router.post("/:uuid/delete", authenticate, authorize("NEWS_KATEGORI_DELETE"), deleteNewsKategori);

export default router;
