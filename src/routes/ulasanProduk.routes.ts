import { Router } from "express";
import { ulasanProdukController } from "../controllers/eCommerce/ulasanProduk.controller";

import { validate } from "../middlewares/validate.middleware";
import { authenticate } from "../middlewares/auth.middleware";
import { optionalAuthenticate } from "../middlewares/optionalAuthenticate.middleware";
import { authorize } from "../middlewares/authorize.middleware";
import { scope } from "../middlewares/scope.middleware";

import {
  createUlasanProdukSchema,
  updateUlasanProdukSchema,
} from "../validators/eCommerce/ulasanProduk.schema";

const router = Router();

// ================= GET =================
router.get("/", optionalAuthenticate, scope, ulasanProdukController.getAll);

router.get("/:uuid", optionalAuthenticate, scope, ulasanProdukController.getById);

// ================= CREATE =================
router.post(
  "/",
  authenticate,
  authorize("ULASAN_CREATE", "MANAGE_ALL_CABANG"),
  validate(createUlasanProdukSchema),
  ulasanProdukController.create
);

// ================= UPDATE =================
router.post(
  "/:uuid/update",
  authenticate,
  authorize("ULASAN_UPDATE", "MANAGE_ALL_CABANG"),
  validate(updateUlasanProdukSchema),
  ulasanProdukController.update
);

// ================= DELETE =================
router.post(
  "/:uuid/delete",
  authenticate,
  authorize("ULASAN_DELETE", "MANAGE_ALL_CABANG"),
  ulasanProdukController.delete
);

export default router;