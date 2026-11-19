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

router.get("/:uuid", authenticate, scope, authorize("CABANG_READ", "GALERI_READ", "GALERI_MANAGE", "MANAGE_ALL_CABANG"), getAlbumGaleriById);

router.post("/", authenticate, scope, authorize("CABANG_CREATE", "CABANG_UPDATE", "GALERI_CREATE", "GALERI_MANAGE", "MANAGE_ALL_CABANG"), validate(createAlbumGaleriSchema), createAlbumGaleri);

router.post("/:uuid/update", authenticate, scope, authorize("CABANG_UPDATE", "GALERI_UPDATE", "GALERI_MANAGE", "MANAGE_ALL_CABANG"), validate(updateAlbumGaleriSchema), updateAlbumGaleri);

router.post("/:uuid/delete", authenticate, scope, authorize("CABANG_DELETE", "CABANG_UPDATE", "GALERI_DELETE", "GALERI_MANAGE", "MANAGE_ALL_CABANG"), deleteAlbumGaleri);

export default router;
