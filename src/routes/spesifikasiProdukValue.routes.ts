import { Router } from "express";
import { spesifikasiProdukValueController } from "../controllers/eCommerce/spesifikasiProdukValue.controller";
import { authorize, authorizeAll } from "../middlewares/authorize.middleware";

import { optionalAuthenticate } from '../middlewares/optionalAuthenticate.middleware';
import { scope } from "../middlewares/scope.middleware";

import { validate } from "../middlewares/validate.middleware";
import { authenticate } from "../middlewares/auth.middleware";

import {
  createSpesifikasiProdukValueSchema,
  updateSpesifikasiProdukValueSchema,
} from "../validators/eCommerce/spesifikasiProdukValue.schema";

const router = Router();

router.get("/", optionalAuthenticate, scope, spesifikasiProdukValueController.getAll);
router.get("/:uuid", optionalAuthenticate, scope, spesifikasiProdukValueController.getById);

router.post(
  "/",
  authenticate,
  authorize("SPESIFIKASI_PRODUK_VALUE_CREATE", "MANAGE_ALL_CABANG"),
  validate(createSpesifikasiProdukValueSchema),
  spesifikasiProdukValueController.create
);

router.post(
  "/:uuid/update",
  authenticate,
  authorize("SPESIFIKASI_PRODUK_VALUE_UPDATE", "MANAGE_ALL_CABANG"),
  validate(updateSpesifikasiProdukValueSchema),
  spesifikasiProdukValueController.update
);

router.post(
  "/:uuid/delete",
  authenticate,
  authorize("SPESIFIKASI_PRODUK_VALUE_DELETE", "MANAGE_ALL_CABANG"),
  spesifikasiProdukValueController.delete
);

export default router;
