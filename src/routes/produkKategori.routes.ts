import { Router } from "express";
import { produkKategoriController } from "../controllers/eCommerce/produkKategori.controller";

import { validate } from "../middlewares/validate.middleware";
import { authenticate } from "../middlewares/auth.middleware";
import { optionalAuthenticate } from "../middlewares/optionalAuthenticate.middleware";
import { authorize } from "../middlewares/authorize.middleware";
import { scope } from "../middlewares/scope.middleware";

import {
  createProdukKategoriSchema,
  updateProdukKategoriSchema,
} from "../validators/eCommerce/produkKategori.schema";

const router = Router();

// ================= GET =================
router.get("/", optionalAuthenticate, scope, produkKategoriController.getAll);

router.get("/:uuid", optionalAuthenticate, scope, produkKategoriController.getById);

// ================= CREATE =================
router.post(
  "/",
  authenticate,
  authorize("PRODUK_KATEGORI_CREATE", "MANAGE_ALL_CABANG"),
  validate(createProdukKategoriSchema),
  produkKategoriController.create
);

// ================= UPDATE =================
router.post(
  "/:uuid/update",
  authenticate,
  authorize("PRODUK_KATEGORI_UPDATE", "MANAGE_ALL_CABANG"),
  validate(updateProdukKategoriSchema),
  produkKategoriController.update
);

// ================= DELETE =================
router.post(
  "/:uuid/delete",
  authenticate,
  authorize("PRODUK_KATEGORI_DELETE", "MANAGE_ALL_CABANG"),
  produkKategoriController.delete
);

export default router;