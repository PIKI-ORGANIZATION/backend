import { Router } from "express";
import { produkPesananSpesifikasiController } from "../controllers/eCommerce/produkPesananSpesifikasi.controller";

import { validate } from "../middlewares/validate.middleware";
import { authenticate } from "../middlewares/auth.middleware";

import {
  createProdukPesananSpesifikasiSchema,
  updateProdukPesananSpesifikasiSchema,
} from "../validators/eCommerce/produkPesananSpesifikasi.schema";

import { optionalAuthenticate } from '../middlewares/optionalAuthenticate.middleware';
import { scope } from "../middlewares/scope.middleware";

const router = Router();

router.get("/", optionalAuthenticate, scope, produkPesananSpesifikasiController.getAll);
router.get("/:uuid", optionalAuthenticate, scope, produkPesananSpesifikasiController.getById);

router.post(
  "/",
  optionalAuthenticate, scope,
  validate(createProdukPesananSpesifikasiSchema),
  produkPesananSpesifikasiController.create
);

router.post(
  "/:uuid/update",
  optionalAuthenticate, scope,
  validate(updateProdukPesananSpesifikasiSchema),
  produkPesananSpesifikasiController.update
);

router.post("/:uuid/delete", optionalAuthenticate, scope, produkPesananSpesifikasiController.delete);

export default router;
