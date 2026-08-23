import { Router } from "express";
import {
  getDppListHandler,
  getDpcListHandler,
  getMasterProvinsiHandler,
  getMasterKabupatenHandler,
} from "../controllers/masterWilayah.controller";

const router = Router();

// 1. Dropdown 1: Ambil daftar DPP (Provinsi) dari dpp_dpc
router.get("/dpp", getDppListHandler);

// 2. Dropdown 2: Ambil daftar DPC (Kabupaten/Kota) berantai dari dpp_dpc (Filter by ?dpp=Sumatera Utara / ?kode_provinsi=12)
router.get("/dpc", getDpcListHandler);

// 3. Referensi Master Provinsi Lengkap (dari data_master_wilayah)
router.get("/master-provinsi", getMasterProvinsiHandler);

// 4. Referensi Master Kabupaten Lengkap (dari data_master_wilayah)
router.get("/master-kabupaten", getMasterKabupatenHandler);

export default router;
