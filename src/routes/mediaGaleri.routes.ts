import { Router } from "express";
import {
  getMediaByAlbum,
  createMediaGaleri,
  updateMediaGaleri,
  deleteMediaGaleri,
} from "../controllers/mediaGaleri.controller";
import { cache } from "../middlewares/cache.middleware.js";
import { validate } from '../middlewares/validate.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize, authorizeAll } from '../middlewares/authorize.middleware';
import { createMediaGaleriSchema, updateMediaGaleriSchema } from '../validators/mediaGaleri.schema';

const router = Router();

router.get("/:albumUuid", authenticate, authorize("CABANG_READ", "MANAGE_ALL_CABANG"), getMediaByAlbum);

router.post("/", authenticate, authorize("CABANG_CREATE", "MANAGE_ALL_CABANG"), validate(createMediaGaleriSchema), createMediaGaleri);

router.post("/:uuid/update", authenticate, authorize("CABANG_UPDATE", "MANAGE_ALL_CABANG"), validate(updateMediaGaleriSchema), updateMediaGaleri);

router.post("/:uuid/delete", authenticate, authorize("CABANG_DELETE", "MANAGE_ALL_CABANG"), deleteMediaGaleri);

export default router;
