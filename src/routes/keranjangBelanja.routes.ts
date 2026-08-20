import { Router } from "express";
import { keranjangBelanjaController } from "../controllers/eCommerce/keranjangBelanja.controller";

import { validate } from "../middlewares/validate.middleware";
import { authenticate } from "../middlewares/auth.middleware";
import { optionalAuthenticate } from "../middlewares/optionalAuthenticate.middleware";
import { authorize } from "../middlewares/authorize.middleware";
import { scope } from "../middlewares/scope.middleware";

import {
  createKeranjangBelanjaSchema,
  updateKeranjangBelanjaSchema,
} from "../validators/eCommerce/keranjangBelanja.schema";

const router = Router();

router.get("/", keranjangBelanjaController.getAll);
router.get("/:uuid", keranjangBelanjaController.getById);

router.post(
  "/",
  validate(createKeranjangBelanjaSchema),
  keranjangBelanjaController.create
);

router.post(
  "/:uuid/update",
  validate(updateKeranjangBelanjaSchema),
  keranjangBelanjaController.update
);

router.post("/:uuid/delete", keranjangBelanjaController.delete);

export default router;