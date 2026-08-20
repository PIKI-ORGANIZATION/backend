import { Router } from "express";
import {
  getSeniors,
  getSeniorById,
  updateSenior,
  getSeniorSearch,
  createSenior,
  approve,
  generatePublicLink,
  getSeniorByToken,
  updateSeniorByToken,
} from "../controllers/senior.controller";

import {
  exportSeniors,
  downloadExport,
  downloadTemplate,
  parseHeaders,
  previewImport,
  confirmImport,
  getJobStatus,
} from "../controllers/senior-io.controller";

import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/authorize.middleware";
import { validate } from "../middlewares/validate.middleware";

import { optionalAuthenticate } from '../middlewares/optionalAuthenticate.middleware';
import { scope } from "../middlewares/scope.middleware";

import {
  uuidParamSchema,
  updateSeniorSchema,
  createSeniorSchema,
} from "../validators/senior.schema";

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
// PUBLIC: GET SENIOR BY TOKEN (no auth)
// Must be BEFORE /:uuid to avoid parameter collision
////////////////////////////////////////////////////
router.get(
  "/public/by-token",
  getSeniorByToken
);

////////////////////////////////////////////////////
// PUBLIC: UPDATE SENIOR BY TOKEN (no auth)
////////////////////////////////////////////////////
router.post(
  "/public/update-by-token",
  updateSeniorByToken
);

////////////////////////////////////////////////////
// EXPORT: Queue export job
////////////////////////////////////////////////////
router.get(
  "/export",
  authenticate,
  authorize("SENIOR_READ", "MANAGE_ALL_CABANG"),
  scope,
  exportSeniors
);

////////////////////////////////////////////////////
// EXPORT: Download template
////////////////////////////////////////////////////
router.get(
  "/export/template",
  authenticate,
  authorize("SENIOR_READ", "MANAGE_ALL_CABANG"),
  downloadTemplate
);

////////////////////////////////////////////////////
// EXPORT: Download completed file
////////////////////////////////////////////////////
router.get(
  "/export/download/:filename",
  authenticate,
  authorize("SENIOR_READ", "MANAGE_ALL_CABANG"),
  downloadExport
);

////////////////////////////////////////////////////
// IMPORT: Parse file headers for mapping step
////////////////////////////////////////////////////
router.post(
  "/import/parse-headers",
  authenticate,
  authorize("SENIOR_CREATE", "MANAGE_ALL_CABANG"),
  excelUpload.single("file"),
  parseHeaders
);

////////////////////////////////////////////////////
// IMPORT: Preview uploaded file
////////////////////////////////////////////////////
router.post(
  "/import/preview",
  authenticate,
  authorize("SENIOR_CREATE", "MANAGE_ALL_CABANG"),
  excelUpload.single("file"),
  previewImport
);

////////////////////////////////////////////////////
// IMPORT: Confirm & enqueue import job
////////////////////////////////////////////////////
router.post(
  "/import/confirm",
  authenticate,
  authorize("SENIOR_CREATE", "MANAGE_ALL_CABANG"),
  scope,
  confirmImport
);

////////////////////////////////////////////////////
// JOB STATUS (export & import)
////////////////////////////////////////////////////
router.get(
  "/job/:jobId",
  authenticate,
  authorize("SENIOR_READ", "MANAGE_ALL_CABANG"),
  getJobStatus
);

////////////////////////////////////////////////////
// CREATE SENIOR
////////////////////////////////////////////////////
router.post(
  "/",
  authenticate,
  authorize("SENIOR_CREATE"),
  validate(createSeniorSchema), // default body
  createSenior
);

////////////////////////////////////////////////////
// GET ALL SENIORS
////////////////////////////////////////////////////
router.get(
  "/",
  optionalAuthenticate,
  scope,
  getSeniors
);

////////////////////////////////////////////////////
// SEARCH SENIOR
////////////////////////////////////////////////////
router.get(
  "/search",
  authenticate,
  authorize("SENIOR_READ", "MANAGE_ALL_CABANG"),
  getSeniorSearch
);

////////////////////////////////////////////////////
// GET BY UUID
////////////////////////////////////////////////////
router.get(
  "/:uuid",
  authenticate,
  authorize("SENIOR_READ", "MANAGE_ALL_CABANG"),
  getSeniorById
);

////////////////////////////////////////////////////
// UPDATE
////////////////////////////////////////////////////
router.post(
  "/:uuid",
  authenticate,
  authorize("SENIOR_UPDATE", "MANAGE_ALL_CABANG"),
  validate(uuidParamSchema, "params"),
  validate(updateSeniorSchema),
  updateSenior
);

////////////////////////////////////////////////////
// APPROVE
////////////////////////////////////////////////////
router.post(
  "/:uuid/approve",
  authenticate,
  authorize("SENIOR_APPROVE", "MANAGE_ALL_CABANG"),
  validate(uuidParamSchema, "params"),
  approve
);

////////////////////////////////////////////////////
// GENERATE PUBLIC LINK
////////////////////////////////////////////////////
router.post(
  "/:uuid/public-link",
  authenticate,
  authorize("SENIOR_UPDATE", "SENIOR_APPROVE", "MANAGE_ALL_CABANG"),
  validate(uuidParamSchema, "params"),
  generatePublicLink
);

export default router;