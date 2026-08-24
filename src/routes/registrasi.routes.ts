import { Router } from "express";
import multer from "multer";
import {
  createRegistrasiHandler,
  getRegistrasiListHandler,
  getRegistrasiByIdHandler,
  updateRegistrasiHandler,
  verifikasiRegistrasiHandler,
  checkSlaHandler,
  prosesPembayaranHandler,
  aktivasiKtaHandler,
  deleteRegistrasiHandler,
  scanKtpHandler,
} from "../controllers/registrasi.controller";

import { validate } from "../middlewares/validate.middleware";
import { createRegistrasiSchema } from "../validators/registrasi.schema";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// 0. Scan KTP OCR (Tahap paling awal sebelum mengisi form)
router.post("/scan-ktp", upload.single("ktp"), scanKtpHandler);

// 1. Submit Pendaftaran Tahap 1 (Identitas, Kualifikasi, PDP, Pembuatan Akun)
router.post("/", validate(createRegistrasiSchema), createRegistrasiHandler);

// 2. Ambil Daftar Registrasi (dengan filter status/search/pagination)
router.get("/", getRegistrasiListHandler);

// 3. Trigger Manual Pengecekan SLA Auto-Bypass 3 Hari Kerja ke DPP
router.post("/check-sla", checkSlaHandler);

// 4. Detail Registrasi berdasarkan ID/UUID
router.get("/:id", getRegistrasiByIdHandler);

// 5. Update/Edit Data Registrasi
router.put("/:id", updateRegistrasiHandler);

// 6. Verifikasi DPC / DPP (Tahap 2 & 3)
router.patch("/:id/verifikasi", verifikasiRegistrasiHandler);

// 7. Process / Konfirmasi Pembayaran Iuran (Tahap 4)
router.patch("/:id/pembayaran", prosesPembayaranHandler);

// 8. Penerbitan & Aktivasi KTA Digital (Tahap 5)
router.patch("/:id/aktivasi-kta", aktivasiKtaHandler);

// 9. Hapus Data Registrasi
router.delete("/:id", deleteRegistrasiHandler);

export default router;
