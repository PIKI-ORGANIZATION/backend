import { Router } from "express";
import {
    getAkuns,
    getAkunById,
    getAkunByIdentifier,
    createAkun,
    updateAkun,
    deleteAkun
} from "../controllers/akun.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize, authorizeAll } from "../middlewares/authorize.middleware";
import { validate } from "../middlewares/validate.middleware";
import { createAkunSchema, updateAkunSchema } from "../validators/akun.schema.js";
import { scope } from "../middlewares/scope.middleware";
import { optionalAuthenticate } from '../middlewares/optionalAuthenticate.middleware';

const router = Router();

router.get("/", optionalAuthenticate, scope, authorize("AKUN_READ"), getAkuns);
router.get("/:uuid", authenticate, authorize("AKUN_READ"), getAkunById);
router.get("/identifier/:identifier", authenticate, authorize("AKUN_READ"), getAkunByIdentifier);

// untuk admin atau super admin DPP bisa create 1 atau beberapa akun baru dengan role USER,
// misal untuk anggota baru yang belum punya akun, atau untuk admin lain 
// yang butuh akses ke dashboard admin. Jadi endpoint ini tidak untuk self register, tapi untuk create akun oleh admin. 
// Untuk self register tetap di auth.controller.ts dengan endpoint /register tanpa perlu authenticate jsonwebtoken, 
// karena untuk self register kan belum punya akun.
router.post("/", authenticate, authorize("AKUN_CREATE"), validate(createAkunSchema), createAkun);

router.post("/:uuid/update", authenticate, authorize("AKUN_UPDATE"), validate(updateAkunSchema), updateAkun);
router.post("/:uuid/delete", authenticate, authorize("AKUN_DELETE"), deleteAkun);

export default router;
