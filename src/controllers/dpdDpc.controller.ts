import { Request, Response, NextFunction } from "express";
import * as dpdDpcService from "../services/dpdDpc.service";
import {
  createDpdDpcSchema,
  updateDpdDpcSchema,
  updateDpdDpcSelfSchema,
  dpdDpcIdParamSchema,
} from "../validators/dpdDpc.schema";

export const getDpdDpcListHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, kode_provinsi, currentPage, pageSize } = req.query;
    const result = await dpdDpcService.getDpdDpcList(req.scope!, {
      search: search as string,
      kode_provinsi: kode_provinsi as string,
      currentPage: Math.max(Number(currentPage) || 1, 1),
      pageSize: Math.min(Math.max(Number(pageSize) || 10, 1), 100),
    });
    res.json({
      success: true,
      message: "Berhasil mengambil data DPD-DPC",
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

export const getDpdDpcByIdHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = dpdDpcIdParamSchema.parse(req.params.id);
    const dpdDpc = await dpdDpcService.getDpdDpcById(req.scope!, id);
    if (!dpdDpc) {
      return res.status(404).json({ success: false, message: "Data DPD-DPC tidak ditemukan" });
    }
    res.json({ success: true, data: dpdDpc });
  } catch (error) {
    next(error);
  }
};

export const createDpdDpcHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = createDpdDpcSchema.parse(req.body);
    const dpdDpc = await dpdDpcService.createDpdDpc(validatedData, req.user?.sub);
    res.status(201).json({ success: true, message: "Berhasil membuat data DPD-DPC", data: dpdDpc });
  } catch (error) {
    next(error);
  }
};

export const updateDpdDpcHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = dpdDpcIdParamSchema.parse(req.params.id);
    // DPP boleh ubah semua field, DPC hanya field data dirinya sendiri
    const validatedData = req.scope!.isSuperAdmin
      ? updateDpdDpcSchema.parse(req.body)
      : updateDpdDpcSelfSchema.parse(req.body);
    const updated = await dpdDpcService.updateDpdDpc(req.scope!, id, validatedData, req.user?.sub);
    res.json({ success: true, message: "Data DPD-DPC berhasil diperbarui", data: updated });
  } catch (error) {
    next(error);
  }
};

export const deleteDpdDpcHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = dpdDpcIdParamSchema.parse(req.params.id);
    await dpdDpcService.softDeleteDpdDpc(id, req.user?.sub);
    res.json({ success: true, message: "Data DPD-DPC berhasil dihapus" });
  } catch (error) {
    next(error);
  }
};
