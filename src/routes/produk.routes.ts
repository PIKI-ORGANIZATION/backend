import { Router } from "express";
import { produkController } from "../controllers/eCommerce/produk.controller";

import { validate } from "../middlewares/validate.middleware";
import { authenticate } from "../middlewares/auth.middleware";
import { optionalAuthenticate } from "../middlewares/optionalAuthenticate.middleware";
import { authorize } from "../middlewares/authorize.middleware";
import { scope } from "../middlewares/scope.middleware";
import { injectAnggotaUuid } from "../middlewares/injectAnggotaUuid.middleware";

import {
  createProdukSchema,
  updateProdukSchema,
} from "../validators/eCommerce/produk.schema";

const router = Router();

// ================= GET =================
router.get("/", optionalAuthenticate, scope, produkController.getAll);

router.get("/:uuid", optionalAuthenticate, scope, produkController.getById);

router.get("/me/list", authenticate, authorize("PRODUK_READ", "MANAGE_ALL_CABANG"), produkController.getMyProduk);

router.get(
  "/anggota/:anggotaUuid",
  optionalAuthenticate,
  scope,
  produkController.getByAnggota
);

// ================= CREATE =================
router.post(
  "/",
  authenticate,
  authorize("PRODUK_CREATE", "MANAGE_ALL_CABANG"),
  injectAnggotaUuid,
  validate(createProdukSchema),
  produkController.create
);

// ================= UPDATE =================
router.post(
  "/:uuid/update",
  authenticate,
  authorize("PRODUK_UPDATE", "MANAGE_ALL_CABANG"),
  injectAnggotaUuid,
  validate(updateProdukSchema),
  produkController.update
);

// ================= DELETE =================
router.post(
  "/:uuid/delete",
  authenticate,
  authorize("PRODUK_DELETE", "MANAGE_ALL_CABANG"),
  produkController.delete
);

export default router;
