import { Router } from "express";
import {
    createRole, 
    getRoleById, 
    getRoleByName,
    getRoles, 
    updateRole,
    deleteRole
} from "../controllers/role.controller";
import { validate } from '../middlewares/validate.middleware';
import { createRoleSchema, updateRoleSchema } from "../validators/role.schema.js";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize, authorizeAll } from "../middlewares/authorize.middleware";

const router = Router();

router.get("/", authenticate, authorize("ROLE_READ"), getRoles);
router.get("/:uuid", authenticate, authorize("ROLE_READ"), getRoleById);
router.get("/nama/:nama", authenticate, authorize("ROLE_READ"), getRoleByName);
router.post("/", authenticate, authorize("ROLE_CREATE"), validate(createRoleSchema), createRole);
router.post("/:uuid/update", authenticate, authorize("ROLE_UPDATE"), validate(updateRoleSchema), updateRole);
router.post("/:uuid/delete", authenticate, authorize("ROLE_DELETE"), deleteRole);

export default router;
