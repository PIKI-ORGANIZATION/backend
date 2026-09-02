import { Router } from "express";
import {
  getFAQ,
  getFAQById,
  createFAQ,
  updateFAQ,
  archiveFAQ,
} from "../controllers/faq.controller";

import { validate } from "../middlewares/validate.middleware";
import { authenticate } from "../middlewares/auth.middleware";
import { optionalAuthenticate } from "../middlewares/optionalAuthenticate.middleware";
import { authorize } from "../middlewares/authorize.middleware";
import { scope } from "../middlewares/scope.middleware";

import {
  createFAQSchema,
  updateFAQSchema,
} from "../validators/faq.schema";

const router = Router();

////////////////////////////////////////////////////
// PUBLIC + ADMIN (AUTO FILTER VIA SCOPE)
////////////////////////////////////////////////////
router.get("/", optionalAuthenticate, scope, getFAQ);

////////////////////////////////////////////////////
// PUBLIC (DETAIL)
////////////////////////////////////////////////////
router.get("/:uuid", optionalAuthenticate, scope, getFAQById);

////////////////////////////////////////////////////
// ADMIN ONLY (CREATE - SUPPORT SINGLE & BULK)
////////////////////////////////////////////////////
router.post(
  "/",
  authenticate,
  authorize("FAQ_CREATE", "MANAGE_ALL_CABANG"),
  validate(createFAQSchema), // sudah support array
  createFAQ
);

////////////////////////////////////////////////////
// ADMIN ONLY (UPDATE - PARTIAL)
////////////////////////////////////////////////////
router.post(
  "/:uuid/update",
  authenticate,
  authorize("FAQ_UPDATE", "MANAGE_ALL_CABANG"),
  validate(updateFAQSchema),
  updateFAQ
);

////////////////////////////////////////////////////
// ADMIN ONLY (ARCHIVE)
////////////////////////////////////////////////////
router.post(
  "/:uuid/archive",
  authenticate,
  authorize("FAQ_ARCHIVE", "MANAGE_ALL_CABANG"),
  validate(updateFAQSchema),
  archiveFAQ
);

export default router;
