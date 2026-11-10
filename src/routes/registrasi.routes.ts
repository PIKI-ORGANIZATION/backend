import { Router } from "express";
// import multer from "multer"; // OCR dinonaktifkan - multer tidak lagi dipakai di route ini
import {
  createRegistrasiHandler,
  getRegistrasiListHandler,
  getRegistrasiByIdHandler,
  updateRegistrasiHandler,
  verifikasiRegistrasiHandler,
  // checkSlaHandler, // dinonaktifkan (tidak dipakai frontend)
  // prosesPembayaranHandler, // dinonaktifkan (tidak dipakai frontend)
  // aktivasiKtaHandler, // dinonaktifkan (tidak dipakai frontend)
  // deleteRegistrasiHandler, // dinonaktifkan (tidak dipakai frontend)
  // scanKtpHandler, // OCR dinonaktifkan
} from "../controllers/registrasi.controller";

import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/authorize.middleware";

import { validate } from "../middlewares/validate.middleware";
import { createRegistrasiSchema } from "../validators/registrasi.schema";
import { scope } from "../middlewares/scope.middleware";

const router = Router();
// const upload = multer({ storage: multer.memoryStorage() }); // OCR dinonaktifkan

// 0. Scan KTP OCR (Dinonaktifkan - fitur OCR tidak lagi diperlukan)
// router.post("/scan-ktp", upload.single("ktp"), scanKtpHandler);

// 1. Submit Pendaftaran Tahap 1 (Identitas, Kualifikasi, PDP, Pembuatan Akun)
router.post("/", validate(createRegistrasiSchema), createRegistrasiHandler);

// 2. Ambil Daftar Registrasi (dengan filter status/search/pagination)
router.get(
  "/",
  authenticate,
  authorize("REGISTRASI_READ", "REGISTRASI_APPROVE"),
  scope,
  getRegistrasiListHandler
);

// Tidak dipakai frontend — dinonaktifkan 2026-11-05 (lihat CATATAN_TASK_LANJUTAN.md §5.1). Hapus komentar untuk mengaktifkan kembali.
// // 3. Trigger Manual Pengecekan SLA Auto-Bypass 3 Hari Kerja ke DPD
// router.post("/check-sla", authenticate, checkSlaHandler);

// 4. Detail Registrasi berdasarkan ID/UUID
router.get(
  "/:id",
  authenticate,
  authorize("REGISTRASI_READ", "REGISTRASI_APPROVE"),
  scope,
  getRegistrasiByIdHandler
);

// 5. Update/Edit Data Registrasi
router.put(
  "/:id",
  authenticate,
  authorize("REGISTRASI_APPROVE"),
  scope,
  updateRegistrasiHandler
);

// 6. Verifikasi DPC / DPD / DPP (Tahap 2 & 3)
router.patch(
  "/:id/verifikasi",
  authenticate,
  authorize("REGISTRASI_APPROVE"),
  scope,
  verifikasiRegistrasiHandler
);

// Tidak dipakai frontend — dinonaktifkan 2026-11-05 (lihat CATATAN_TASK_LANJUTAN.md §5.1). Hapus komentar untuk mengaktifkan kembali.
// // 7. Process / Konfirmasi Pembayaran Iuran (Tahap 4)
// router.patch(
//   "/:id/pembayaran",
//   authenticate,
//   authorize("REGISTRASI_APPROVE"),
//   scope,
//   prosesPembayaranHandler
// );

// Tidak dipakai frontend — dinonaktifkan 2026-11-05 (lihat CATATAN_TASK_LANJUTAN.md §5.1). Hapus komentar untuk mengaktifkan kembali.
// // 8. Penerbitan & Aktivasi KTA Digital (Tahap 5)
// router.patch(
//   "/:id/aktivasi-kta",
//   authenticate,
//   authorize("REGISTRASI_APPROVE"),
//   scope,
//   aktivasiKtaHandler
// );

// Tidak dipakai frontend — dinonaktifkan 2026-11-05 (lihat CATATAN_TASK_LANJUTAN.md §5.1). Hapus komentar untuk mengaktifkan kembali.
// // 9. Hapus Data Registrasi
// router.delete(
//   "/:id",
//   authenticate,
//   authorize("REGISTRASI_APPROVE"),
//   scope,
//   deleteRegistrasiHandler
// );

export default router;
