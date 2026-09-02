import { Router } from "express";
import { pesananController } from "../controllers/eCommerce/pesanan.controller";

import { validate } from "../middlewares/validate.middleware";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/authorize.middleware";

import { optionalAuthenticate } from '../middlewares/optionalAuthenticate.middleware';
import { scope } from "../middlewares/scope.middleware";

import {
  createPesananSchema,
  updatePesananSchema,
} from "../validators/eCommerce/pesanan.schema";

const router = Router();

router.get("/", optionalAuthenticate, scope, pesananController.getAll);

router.get("/me/list", authenticate, authorize("PESANAN_READ", "MANAGE_ALL_CABANG"), pesananController.getMyPesanan);

router.get(
  "/anggota/:anggotaUuid",
  authenticate,
  authorize("PESANAN_READ", "MANAGE_ALL_CABANG"),
  pesananController.getByAnggota
);

router.get("/:uuid", optionalAuthenticate, scope, pesananController.getById);

router.post(
  "/",
  validate(createPesananSchema),
  pesananController.create
);

router.post(
  "/:uuid/update",
  validate(updatePesananSchema),
  pesananController.update
);

// router.post(
//   "/:uuid/delete",
//   optionalAuthenticate,
//   scope,
//   pesananController.delete
// );

export default router;
