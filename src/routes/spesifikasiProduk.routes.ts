import { Router } from "express";
import { spesifikasiProdukController } from "../controllers/eCommerce/spesifikasiProduk.controller";

import { validate } from "../middlewares/validate.middleware";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize, authorizeAll } from "../middlewares/authorize.middleware";

import {
  createSpesifikasiProdukSchema,
  updateSpesifikasiProdukSchema,
} from "../validators/eCommerce/spesifikasiProduk.schema";

const router = Router();

router.get("/", authenticate, authorize("SPESIFIKASI_PRODUK_READ", "MANAGE_ALL_CABANG"), spesifikasiProdukController.getAll);
router.get("/:uuid", authenticate, authorize("SPESIFIKASI_PRODUK_READ", "MANAGE_ALL_CABANG"), spesifikasiProdukController.getById);

router.post(
  "/",
  authenticate,
  authorize("SPESIFIKASI_PRODUK_CREATE", "MANAGE_ALL_CABANG"),
  validate(createSpesifikasiProdukSchema),
  spesifikasiProdukController.create
);

router.post(
  "/:uuid/update",
  authenticate,
  authorize("SPESIFIKASI_PRODUK_UPDATE", "MANAGE_ALL_CABANG"),
  validate(updateSpesifikasiProdukSchema),
  spesifikasiProdukController.update
);

router.post("/:uuid/delete", 
    authenticate, 
    authorize("SPESIFIKASI_PRODUK_DELETE", "MANAGE_ALL_CABANG"), 
    spesifikasiProdukController.delete);

export default router;