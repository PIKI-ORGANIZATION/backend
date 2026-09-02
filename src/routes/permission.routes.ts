import { Router } from "express";
import { 
    getPermissions,
    getPermissionById,
    getPermissionByName,
    createPermission,
    updatePermission,
    deletePermission
} from "../controllers/permission.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize, authorizeAll } from "../middlewares/authorize.middleware";
// import { validate } from "../middlewares/validate.middleware";
// import { createPermissionSchema, updatePermissionSchema } from "../validators/permission.schema.js";

const router = Router();

router.get("/", authenticate, authorize("ROLE_READ"), getPermissions);
router.get("/:uuid", authenticate, authorize("ROLE_READ"), getPermissionById);
router.get("/nama/:nama", authenticate, authorize("ROLE_READ"), getPermissionByName);
// router.post("/", authenticate, authorize("PERMISSION_CREATE"), /* validate(createPermissionSchema), */ createPermission);
// router.post("/:uuid/update", authenticate, authorize("PERMISSION_UPDATE"), /* validate(updatePermissionSchema), */ updatePermission);
// router.post("/:uuid/delete", authenticate, authorize("PERMISSION_DELETE"), deletePermission);

export default router;
