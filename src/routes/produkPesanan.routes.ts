import { Router } from "express";
import { produkPesananController } from "../controllers/eCommerce/produkPesanan.controller";

import { validate } from "../middlewares/validate.middleware";
import { authenticate } from "../middlewares/auth.middleware";

import {
  createProdukPesananSchema,
  updateProdukPesananSchema,
} from "../validators/eCommerce/produkPesanan.schema";

import { optionalAuthenticate } from '../middlewares/optionalAuthenticate.middleware';
import { scope } from "../middlewares/scope.middleware";

const router = Router();

router.get("/", optionalAuthenticate, scope, produkPesananController.getAll);
router.get("/:uuid", optionalAuthenticate, scope, produkPesananController.getById);

router.post(
  "/",
  optionalAuthenticate,
  scope,
  validate(createProdukPesananSchema),
  produkPesananController.create
);

router.post(
  "/:uuid/update",
    optionalAuthenticate,
    scope,
  validate(updateProdukPesananSchema),
  produkPesananController.update
);

router.post("/:uuid/delete", optionalAuthenticate, scope, produkPesananController.delete);

export default router;
