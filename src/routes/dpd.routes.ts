import { Router } from "express";
import * as dpdController from "../controllers/dpd.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/rbac.middleware";

const router = Router();

// Endpoint Public/Authenticated
router.get("/", dpdController.getDpdListHandler);
router.get("/:id", dpdController.getDpdByIdHandler);

// Endpoint Protected (CMS)
router.use(authenticate);
// Contoh authorize, sesuaikan nama permission-nya jika perlu
// router.use(authorize("MANAGE_DPD")); 

router.post("/", dpdController.createDpdHandler);
router.patch("/:id", dpdController.updateDpdHandler);
router.delete("/:id", dpdController.deleteDpdHandler);

export default router;
