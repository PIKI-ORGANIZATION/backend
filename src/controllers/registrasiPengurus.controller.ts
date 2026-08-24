import { Request, Response, NextFunction } from "express";
import * as registrasiPengurusService from "../services/registrasiPengurus.service";

export const createHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = req.body;
    const registrasi = await registrasiPengurusService.createRegistrasiPengurus(data);
    res.status(201).json({
      success: true,
      message: "Pendaftaran pengurus berhasil disubmit. Menunggu verifikasi pusat.",
      data: registrasi,
    });
  } catch (error) {
    next(error);
  }
};

export const getListHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const list = await registrasiPengurusService.getRegistrasiPengurus();
    res.json({
      success: true,
      data: list,
    });
  } catch (error) {
    next(error);
  }
};

export const approveHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { verifikatorUuid } = req.body; // Dari decoded token auth middleware nanti
    
    const result = await registrasiPengurusService.approveRegistrasiPengurus(id, verifikatorUuid || "system");
    
    res.json({
      success: true,
      message: "Registrasi Pengurus berhasil di-approve. Akun telah dibuat.",
      data: {
        email: result.akun.email,
        username: result.akun.username,
        defaultPassword: result.defaultPassword
      }
    });
  } catch (error) {
    next(error);
  }
};
