import { Router } from "express";
import { pengaturanPesananController } from "../controllers/eCommerce/pengaturanPesanan.controller";

import { validate } from "../middlewares/validate.middleware";
import { authenticate } from "../middlewares/auth.middleware";

import { optionalAuthenticate } from '../middlewares/optionalAuthenticate.middleware';
import { scope } from "../middlewares/scope.middleware";

import {
  createPengaturanPesananSchema,
  updatePengaturanPesananSchema,
} from "../validators/eCommerce/pengaturanPesanan.schema";

const router = Router();

router.get("/", optionalAuthenticate, scope, pengaturanPesananController.getAll);
router.get("/:uuid", optionalAuthenticate, scope, pengaturanPesananController.getById);

router.post(
  "/",
  optionalAuthenticate,
  scope,
  validate(createPengaturanPesananSchema),
  pengaturanPesananController.create
);

router.post(
  "/:uuid/update",
  optionalAuthenticate,
  scope,
  validate(updatePengaturanPesananSchema),
  pengaturanPesananController.update
);

router.post("/:uuid/delete", optionalAuthenticate, scope, pengaturanPesananController.delete);

export default router;
