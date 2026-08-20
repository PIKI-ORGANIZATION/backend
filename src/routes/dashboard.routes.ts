import { Router } from "express";
import { getDashboardStats } from "../controllers/dashboard.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { scope } from "../middlewares/scope.middleware";

const router = Router();

router.get("/stats", authenticate, scope, getDashboardStats);

export default router;
