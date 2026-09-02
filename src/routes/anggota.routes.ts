import { Router } from "express";
import {
  getAnggotas,
  getAnggotaById,
  updateAnggota,
  getAnggotaSearch,
  createAnggota,
  approve,
  generatePublicLink,
  getAnggotaByToken,
  updateAnggotaByToken,
} from "../controllers/anggota.controller";

import {
  exportAnggotas,
  downloadExport,
  downloadTemplate,
  parseHeaders,
  previewImport,
  confirmImport,
  getJobStatus,
} from "../controllers/anggota-io.controller";

import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/authorize.middleware";
import { validate } from "../middlewares/validate.middleware";

import { optionalAuthenticate } from '../middlewares/optionalAuthenticate.middleware';
import { scope } from "../middlewares/scope.middleware";

import {
  uuidParamSchema,
  updateAnggotaSchema,
  createAnggotaSchema,
} from "../validators/anggota.schema";

import multer from "multer";

const excelUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Hanya file Excel (.xlsx / .xls) yang diperbolehkan"));
    }
  },
});

const router = Router();

////////////////////////////////////////////////////
// PUBLIC: GET ANGGOTA BY TOKEN (no auth)
// Must be BEFORE /:uuid to avoid parameter collision
////////////////////////////////////////////////////
router.get(
  "/public/by-token",
  getAnggotaByToken
);

////////////////////////////////////////////////////
// PUBLIC: UPDATE ANGGOTA BY TOKEN (no auth)
////////////////////////////////////////////////////
router.post(
  "/public/update-by-token",
  updateAnggotaByToken
);

////////////////////////////////////////////////////
// EXPORT: Queue export job
////////////////////////////////////////////////////
router.get(
  "/export",
  authenticate,
  authorize("ANGGOTA_READ", "MANAGE_ALL_CABANG"),
  scope,
  exportAnggotas
);

////////////////////////////////////////////////////
// EXPORT: Download template
////////////////////////////////////////////////////
router.get(
  "/export/template",
  authenticate,
  authorize("ANGGOTA_READ", "MANAGE_ALL_CABANG"),
  downloadTemplate
);

////////////////////////////////////////////////////
// EXPORT: Download completed file
////////////////////////////////////////////////////
router.get(
  "/export/download/:filename",
  authenticate,
  authorize("ANGGOTA_READ", "MANAGE_ALL_CABANG"),
  downloadExport
);

////////////////////////////////////////////////////
// IMPORT: Parse file headers for mapping step
////////////////////////////////////////////////////
router.post(
  "/import/parse-headers",
  authenticate,
  authorize("ANGGOTA_CREATE", "MANAGE_ALL_CABANG"),
  excelUpload.single("file"),
  parseHeaders
);

////////////////////////////////////////////////////
// IMPORT: Preview uploaded file
////////////////////////////////////////////////////
router.post(
  "/import/preview",
  authenticate,
  authorize("ANGGOTA_CREATE", "MANAGE_ALL_CABANG"),
  excelUpload.single("file"),
  previewImport
);

////////////////////////////////////////////////////
// IMPORT: Confirm & enqueue import job
////////////////////////////////////////////////////
router.post(
  "/import/confirm",
  authenticate,
  authorize("ANGGOTA_CREATE", "MANAGE_ALL_CABANG"),
  scope,
  confirmImport
);

////////////////////////////////////////////////////
// JOB STATUS (export & import)
////////////////////////////////////////////////////
router.get(
  "/job/:jobId",
  authenticate,
  authorize("ANGGOTA_READ", "MANAGE_ALL_CABANG"),
  getJobStatus
);

////////////////////////////////////////////////////
// CREATE ANGGOTA
////////////////////////////////////////////////////
router.post(
  "/",
  authenticate,
  authorize("ANGGOTA_CREATE"),
  validate(createAnggotaSchema), // default body
  createAnggota
);

////////////////////////////////////////////////////
// GET ALL ANGGOTAS
////////////////////////////////////////////////////
router.get(
  "/",
  optionalAuthenticate,
  scope,
  getAnggotas
);

////////////////////////////////////////////////////
// SEARCH ANGGOTA
////////////////////////////////////////////////////
router.get(
  "/search",
  authenticate,
  authorize("ANGGOTA_READ", "MANAGE_ALL_CABANG"),
  getAnggotaSearch
);

////////////////////////////////////////////////////
// GET BY UUID
////////////////////////////////////////////////////
router.get(
  "/:uuid",
  authenticate,
  authorize("ANGGOTA_READ", "MANAGE_ALL_CABANG"),
  getAnggotaById
);

////////////////////////////////////////////////////
// UPDATE
////////////////////////////////////////////////////
router.post(
  "/:uuid",
  authenticate,
  authorize("ANGGOTA_UPDATE", "MANAGE_ALL_CABANG"),
  validate(uuidParamSchema, "params"),
  validate(updateAnggotaSchema),
  updateAnggota
);

////////////////////////////////////////////////////
// APPROVE
////////////////////////////////////////////////////
router.post(
  "/:uuid/approve",
  authenticate,
  authorize("ANGGOTA_APPROVE", "MANAGE_ALL_CABANG"),
  validate(uuidParamSchema, "params"),
  approve
);

////////////////////////////////////////////////////
// GENERATE PUBLIC LINK
////////////////////////////////////////////////////
router.post(
  "/:uuid/public-link",
  authenticate,
  authorize("ANGGOTA_UPDATE", "ANGGOTA_APPROVE", "MANAGE_ALL_CABANG"),
  validate(uuidParamSchema, "params"),
  generatePublicLink
);

export default router;
