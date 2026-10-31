import { Router } from "express";
import * as dpdDpcController from "../controllers/dpdDpc.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/authorize.middleware";
import { scope } from "../middlewares/scope.middleware";

const router = Router();

// Semua endpoint wajib login. Hak lihat/ubah per hierarki (DPP/DPD/DPC) dicek di service.
router.use(authenticate, scope);

router.get("/", dpdDpcController.getDpdDpcListHandler);
router.get("/:id", dpdDpcController.getDpdDpcByIdHandler);

// Hanya DPP
router.post("/", authorize("MANAGE_ALL_CABANG"), dpdDpcController.createDpdDpcHandler);
router.delete("/:id", authorize("MANAGE_ALL_CABANG"), dpdDpcController.deleteDpdDpcHandler); // soft delete

// DPP: semua DPC, DPC: dirinya sendiri
router.patch("/:id", authorize("MANAGE_ALL_CABANG", "CABANG_UPDATE"), dpdDpcController.updateDpdDpcHandler);

export default router;
