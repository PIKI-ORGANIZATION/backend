import { Router } from "express";
import { pembayaranController } from "../controllers/eCommerce/pembayaran_copy_tanpa_helperEmail.controller";

import { validate } from "../middlewares/validate.middleware";
import { authenticate } from "../middlewares/auth.middleware";


import { optionalAuthenticate } from '../middlewares/optionalAuthenticate.middleware';
import { scope } from "../middlewares/scope.middleware";

import {
  createPembayaranSchema,
  updatePembayaranSchema,
} from "../validators/eCommerce/pembayaran.schema";

const router = Router();

router.get("/", optionalAuthenticate, scope, pembayaranController.getAll);
router.get("/:uuid", optionalAuthenticate, scope, pembayaranController.getById);

router.post(
  "/",
  optionalAuthenticate,
  scope,
  validate(createPembayaranSchema),
  pembayaranController.create
);

router.post(
  "/:uuid/update",
  optionalAuthenticate,
  scope,
  validate(updatePembayaranSchema),
  pembayaranController.update
);

router.post("/:uuid/delete", optionalAuthenticate, scope, pembayaranController.delete);

export default router;