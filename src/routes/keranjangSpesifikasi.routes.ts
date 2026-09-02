import { Router } from "express";
import { keranjangSpesifikasiController } from "../controllers/eCommerce/keranjangSpesifikasi.controller";

import { validate } from "../middlewares/validate.middleware";
import { authenticate } from "../middlewares/auth.middleware";

import {
  createKeranjangSpesifikasiSchema,
  updateKeranjangSpesifikasiSchema,
} from "../validators/eCommerce/keranjangSpesifikasi.schema";

const router = Router();

router.get("/", keranjangSpesifikasiController.getAll);
router.get("/:uuid", keranjangSpesifikasiController.getById);

router.post(
  "/",
  validate(createKeranjangSpesifikasiSchema),
  keranjangSpesifikasiController.create
);

router.post(
  "/:uuid/update",
  validate(updateKeranjangSpesifikasiSchema),
  keranjangSpesifikasiController.update
);

router.post("/:uuid/delete", keranjangSpesifikasiController.delete);

export default router;
