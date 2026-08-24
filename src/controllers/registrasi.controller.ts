import { Request, Response, NextFunction } from "express";
import * as registrasiService from "../services/registrasi.service";
import * as ocrService from "../services/ocr.service";

export const createRegistrasiHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = req.body;
    const registrasi = await registrasiService.createRegistrasi(data);
    res.status(201).json({
      success: true,
      message: "Pendaftaran Tahap 1 berhasil di-submit. Berkas masuk antrean verifikasi DPC.",
      data: registrasi,
    });
  } catch (error) {
    next(error);
  }
};

export const scanKtpHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Foto KTP wajib diunggah" });
    }
    
    // Proses OCR dengan buffer dari multer memoryStorage
    const result = await ocrService.scanKtp(req.file.buffer);
    
    res.status(200).json({
      success: true,
      message: "Berhasil membaca KTP",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getRegistrasiListHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, cabangUuid, statusVerifikasi, statusPembayaran, statusKta, langkahSekarang, skip, take } = req.query;
    const result = await registrasiService.getRegistrasiList({
      search: search as string,
      cabangUuid: cabangUuid as string,
      statusVerifikasi: statusVerifikasi as string,
      statusPembayaran: statusPembayaran as string,
      statusKta: statusKta as string,
      langkahSekarang: langkahSekarang ? Number(langkahSekarang) : undefined,
      skip: skip ? Number(skip) : undefined,
      take: take ? Number(take) : undefined,
    });
    res.json({
      success: true,
      data: result.data,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getRegistrasiByIdHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const registrasi = await registrasiService.getRegistrasiById(id);
    if (!registrasi) {
      return res.status(404).json({ success: false, message: "Data registrasi tidak ditemukan" });
    }
    res.json({ success: true, data: registrasi });
  } catch (error) {
    next(error);
  }
};

export const updateRegistrasiHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updated = await registrasiService.updateRegistrasi(id, req.body);
    res.json({ success: true, message: "Data registrasi berhasil diperbarui", data: updated });
  } catch (error) {
    next(error);
  }
};

export const verifikasiRegistrasiHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status, verifikatorUuid, actorNama, catatanVerifikasi } = req.body;
    const result = await registrasiService.verifikasiRegistrasi({
      id,
      status: status || "APPROVED_DPC",
      verifikatorUuid,
      actorNama,
      catatanVerifikasi,
    });
    res.json({
      success: true,
      message: `Status verifikasi pendaftaran berhasil diperbarui menjadi ${result.statusVerifikasi}`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const checkSlaHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { actorNama } = req.body;
    const result = await registrasiService.checkAndBypassSla(actorNama || "System SLA Scheduler");
    res.json({
      success: true,
      message: `Pengecekan SLA selesai. ${result.count} pendaftaran berhasil diekskalasi otomatis ke DPP.`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const prosesPembayaranHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { buktiBayarUrl, statusPembayaran, nominalIuran, actorUuid, actorNama } = req.body;
    const result = await registrasiService.prosesPembayaran({
      id,
      buktiBayarUrl,
      statusPembayaran,
      nominalIuran,
      actorUuid,
      actorNama,
    });
    res.json({
      success: true,
      message: "Status pembayaran iuran berhasil diproses",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const aktivasiKtaHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { actorUuid, actorNama, customNoKta } = req.body;
    const result = await registrasiService.aktivasiKta({
      id,
      actorUuid,
      actorNama,
      customNoKta,
    });
    res.json({
      success: true,
      message: `KTA Digital berhasil diterbitkan (${result.noKta}) dan status keanggotaan aktif resmi.`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteRegistrasiHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await registrasiService.deleteRegistrasi(id);
    res.json({ success: true, message: "Data registrasi berhasil dihapus" });
  } catch (error) {
    next(error);
  }
};
