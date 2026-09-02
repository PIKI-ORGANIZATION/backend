import { Router } from "express";
import * as dpdDpcController from "../controllers/dpdDpc.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/rbac.middleware";

const router = Router();

// Endpoint Public/Authenticated
router.get("/", dpdDpcController.getDpdDpcListHandler);
router.get("/:id", dpdDpcController.getDpdDpcByIdHandler);

// Endpoint Protected (CMS)
router.use(authenticate);
// Contoh authorize, sesuaikan nama permission-nya jika perlu
// router.use(authorize("MANAGE_DPD_DPC")); 

router.post("/", dpdDpcController.createDpdDpcHandler);
router.patch("/:id", dpdDpcController.updateDpdDpcHandler);
router.delete("/:id", dpdDpcController.deleteDpdDpcHandler);

export default router;
