import { Request, Response, NextFunction } from "express";
import * as masterWilayahService from "../services/masterWilayah.service";

export const getDpdListHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await masterWilayahService.getDpdList();
    res.json({
      success: true,
      message: "Daftar DPD (Provinsi) berhasil diambil",
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getDpcListHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { dpd, kode_provinsi } = req.query;
    const data = await masterWilayahService.getDpcList({
      dpd: dpd as string,
      kode_provinsi: kode_provinsi as string,
    });
    res.json({
      success: true,
      message: "Daftar DPC (Kabupaten/Kota) berhasil diambil",
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getMasterProvinsiHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await masterWilayahService.getMasterProvinsi();
    res.json({
      success: true,
      message: "Data master provinsi berhasil diambil",
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getMasterKabupatenHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { kode_provinsi } = req.query;
    const data = await masterWilayahService.getMasterKabupaten(kode_provinsi as string);
    res.json({
      success: true,
      message: "Data master kabupaten/kota berhasil diambil",
      data,
    });
  } catch (error) {
    next(error);
  }
};
