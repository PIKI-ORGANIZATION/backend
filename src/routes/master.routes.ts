import { Router } from "express";
import {
  getMasterPendidikan,
  createMasterPendidikan,
  getMasterPekerjaan,
  createMasterPekerjaan,
  getMasterBidangStudi,
  createMasterBidangStudi,
  getMasterBidangMinat,
  createMasterBidangMinat,
  getWilayahProvinces,
  getWilayahRegencies,
  getAllWilayahRegencies,
} from "../controllers/master.controller";

const router = Router();

router.get("/pendidikan", getMasterPendidikan);
router.post("/pendidikan", createMasterPendidikan);

router.get("/pekerjaan", getMasterPekerjaan);
router.post("/pekerjaan", createMasterPekerjaan);

router.get("/bidang-studi", getMasterBidangStudi);
router.post("/bidang-studi", createMasterBidangStudi);

router.get("/bidang-minat", getMasterBidangMinat);
router.post("/bidang-minat", createMasterBidangMinat);

router.get("/wilayah/provinces", getWilayahProvinces);
router.get("/wilayah/regencies", getAllWilayahRegencies);
router.get("/wilayah/regencies/:provinceId", getWilayahRegencies);

export default router;
