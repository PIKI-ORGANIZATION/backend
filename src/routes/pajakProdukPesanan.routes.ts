import { Router } from "express";
import { pajakProdukPesananController } from "../controllers/eCommerce/pajakProdukPesanan.controller";

import { validate } from "../middlewares/validate.middleware";
import { authenticate } from "../middlewares/auth.middleware";

import { optionalAuthenticate } from '../middlewares/optionalAuthenticate.middleware';
import { scope } from "../middlewares/scope.middleware";

import {
  createPajakProdukPesananSchema,
  updatePajakProdukPesananSchema,
} from "../validators/eCommerce/pajakProdukPesanan.schema";

const router = Router();

router.get("/", optionalAuthenticate, scope, pajakProdukPesananController.getAll);
router.get("/:uuid", optionalAuthenticate, scope, pajakProdukPesananController.getById);

router.post(
  "/",
  optionalAuthenticate,
  scope,    
  validate(createPajakProdukPesananSchema),
  pajakProdukPesananController.create
);

router.post(
  "/:uuid/update",
  optionalAuthenticate,
  scope,
  validate(updatePajakProdukPesananSchema),
  pajakProdukPesananController.update
);

router.post("/:uuid/delete", optionalAuthenticate, scope, pajakProdukPesananController.delete);

export default router;
