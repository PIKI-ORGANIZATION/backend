import { Router } from "express";
import {
  getBidang,
  getBidangById,
  createBidang,
  updateBidang,
  deleteBidang,
} from "../controllers/bidang.controller";
import { cache } from "../middlewares/cache.middleware.js";
import { validate } from '../middlewares/validate.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize, authorizeAll } from '../middlewares/authorize.middleware';
import { createBidangSchema, updateBidangSchema } from '../validators/periodeJabatanBidang.schema';
import { scope } from "../middlewares/scope.middleware";
import { optionalAuthenticate } from '../middlewares/optionalAuthenticate.middleware';

const router = Router();

router.get("/", optionalAuthenticate, scope, getBidang);

router.get("/:uuid", authenticate, authorize("CABANG_READ"), getBidangById);

router.post("/", authenticate, authorize("CABANG_CREATE"), validate(createBidangSchema), createBidang);
    
router.post("/:uuid/update", authenticate, authorize("CABANG_UPDATE"), validate(updateBidangSchema), updateBidang);

router.post("/:uuid/delete", authenticate, authorize("CABANG_DELETE"), deleteBidang);

export default router;