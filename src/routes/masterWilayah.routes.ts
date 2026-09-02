import { Router } from "express";
import {
  getDpdListHandler,
  getDpcListHandler,
  getMasterProvinsiHandler,
  getMasterKabupatenHandler,
} from "../controllers/masterWilayah.controller";

const router = Router();

// 1. Dropdown 1: Ambil daftar DPD (Provinsi) dari dpd_dpc
router.get("/dpd", getDpdListHandler);

// 2. Dropdown 2: Ambil daftar DPC (Kabupaten/Kota) berantai dari dpd_dpc (Filter by ?dpd=Sumatera Utara / ?kode_provinsi=12)
router.get("/dpc", getDpcListHandler);

// 3. Referensi Master Provinsi Lengkap (dari data_master_wilayah)
router.get("/master-provinsi", getMasterProvinsiHandler);

// 4. Referensi Master Kabupaten Lengkap (dari data_master_wilayah)
router.get("/master-kabupaten", getMasterKabupatenHandler);

export default router;
