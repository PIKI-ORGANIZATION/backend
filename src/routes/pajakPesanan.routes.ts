import { Router } from "express";
import { pajakPesananController } from "../controllers/eCommerce/pajakPesanan.controller";

import { validate } from "../middlewares/validate.middleware";
import { authenticate } from "../middlewares/auth.middleware";


import { optionalAuthenticate } from '../middlewares/optionalAuthenticate.middleware';
import { scope } from "../middlewares/scope.middleware";

import {
  createPajakPesananSchema,
  updatePajakPesananSchema,
} from "../validators/eCommerce/pajakPesanan.schema";

const router = Router();

router.get("/", optionalAuthenticate, scope, pajakPesananController.getAll);
router.get("/:uuid", optionalAuthenticate, scope, pajakPesananController.getById);

router.post(
  "/",
  optionalAuthenticate,
  scope,
  validate(createPajakPesananSchema),
  pajakPesananController.create
);

router.post(
  "/:uuid/update",
  optionalAuthenticate,
  scope,
  validate(updatePajakPesananSchema),
  pajakPesananController.update
);

router.post("/:uuid/delete", optionalAuthenticate, scope, pajakPesananController.delete);

export default router;