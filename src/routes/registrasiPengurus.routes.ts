import { Router } from "express";
import {
  createHandler,
  getListHandler,
  approveHandler
} from "../controllers/registrasiPengurus.controller";

const router = Router();

// Pendaftaran pengurus (DPD/DPC)
router.post("/", createHandler);

// Ambil daftar pendaftar pengurus (untuk admin pusat)
router.get("/", getListHandler);

// Approve pendaftaran (verifikasi) -> otomatis buat akun
router.post("/:id/approve", approveHandler);

export default router;
