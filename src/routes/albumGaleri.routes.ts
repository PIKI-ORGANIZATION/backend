import { Router } from "express";
import {
  getAlbumGaleri,
  getAlbumGaleriById,
  createAlbumGaleri,
  updateAlbumGaleri,
  deleteAlbumGaleri,
} from "../controllers/albumGaleri.controller";
import { cache } from "../middlewares/cache.middleware.js";
import { validate } from '../middlewares/validate.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize, authorizeAll } from '../middlewares/authorize.middleware';
import { createAlbumGaleriSchema, updateAlbumGaleriSchema } from '../validators/albumGaleri.schema';
import { optionalAuthenticate } from "../middlewares/optionalAuthenticate.middleware";
import { scope } from "../middlewares/scope.middleware";

const router = Router();

router.get("/", optionalAuthenticate, scope, getAlbumGaleri);

router.get("/:uuid", authenticate, authorize("CABANG_READ", "MANAGE_ALL_CABANG"), getAlbumGaleriById);

router.post("/", authenticate, authorize("CABANG_CREATE", "MANAGE_ALL_CABANG"), validate(createAlbumGaleriSchema), createAlbumGaleri);

router.post("/:uuid/update", authenticate, authorize("CABANG_UPDATE", "MANAGE_ALL_CABANG"), validate(updateAlbumGaleriSchema), updateAlbumGaleri);

router.post("/:uuid/delete", authenticate, authorize("CABANG_DELETE", "MANAGE_ALL_CABANG"), deleteAlbumGaleri);

export default router;