import { Router } from "express";
import {
  getFormPengaduan,
  getFormPengaduanById,
  createFormPengaduan,
  updateFormPengaduan,
} from "../controllers/formPengaduan.controller";

import { validate } from "../middlewares/validate.middleware";
import { authenticate } from "../middlewares/auth.middleware";
import { optionalAuthenticate } from "../middlewares/optionalAuthenticate.middleware";
import { authorize } from "../middlewares/authorize.middleware";
import { scope } from "../middlewares/scope.middleware";

import {
  createFormPengaduanSchema,
  updateFormPengaduanSchema,
} from "../validators/formPengaduan.schema";

import rateLimit from "express-rate-limit";

const router = Router();

const pengaduanLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 1, // limit each IP to 1 request per windowMs
  message: {
    success: false,
    message: "Terlalu banyak pengaduan, silakan coba lagi setelah 1 menit.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

////////////////////////////////////////////////////
// ADMIN ONLY (LIST)
////////////////////////////////////////////////////
router.get(
  "/",
  optionalAuthenticate,
  scope,
  authorize("PENGADUAN_READ", "MANAGE_ALL_CABANG"),
  getFormPengaduan
);

////////////////////////////////////////////////////
// ADMIN ONLY (DETAIL)
////////////////////////////////////////////////////
router.get(
  "/:uuid",
  optionalAuthenticate,
  scope,
  authorize("PENGADUAN_READ", "MANAGE_ALL_CABANG"),
  getFormPengaduanById
);

////////////////////////////////////////////////////
// PUBLIC (CREATE - SINGLE & BULK)
////////////////////////////////////////////////////
router.post(
  "/",
  pengaduanLimiter,
  validate(createFormPengaduanSchema),
  createFormPengaduan
);

////////////////////////////////////////////////////
// ADMIN ONLY (UPDATE / RESPOND)
////////////////////////////////////////////////////
router.post(
  "/:uuid/update",
  authenticate,
  authorize("PENGADUAN_UPDATE", "MANAGE_ALL_CABANG", "PENGADUAN_RESPOND"),
  validate(updateFormPengaduanSchema),
  updateFormPengaduan
);

export default router;