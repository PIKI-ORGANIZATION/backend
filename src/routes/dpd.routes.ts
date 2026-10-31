import { Router } from "express";
import * as dpdController from "../controllers/dpd.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/authorize.middleware";
import { scope } from "../middlewares/scope.middleware";

const router = Router();

// Semua endpoint wajib login. Hak lihat/ubah per hierarki (DPP/DPD) dicek di service.
router.use(authenticate, scope);

router.get("/", dpdController.getDpdListHandler);
router.get("/:id", dpdController.getDpdByIdHandler);

// Hanya DPP
router.post("/", authorize("MANAGE_ALL_CABANG"), dpdController.createDpdHandler);
router.delete("/:id", authorize("MANAGE_ALL_CABANG"), dpdController.deleteDpdHandler); // soft delete

// DPP: semua DPD, DPD: dirinya sendiri
router.patch("/:id", authorize("MANAGE_ALL_CABANG", "CABANG_UPDATE"), dpdController.updateDpdHandler);

export default router;
