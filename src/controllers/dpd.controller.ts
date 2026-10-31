import { Request, Response, NextFunction } from "express";
import * as dpdService from "../services/dpd.service";
import {
  createDpdSchema,
  updateDpdSchema,
  updateDpdSelfSchema,
  dpdIdParamSchema,
} from "../validators/dpd.schema";

export const getDpdListHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, currentPage, pageSize } = req.query;
    const result = await dpdService.getDpdList(req.scope!, {
      search: search as string,
      currentPage: Math.max(Number(currentPage) || 1, 1),
      pageSize: Math.min(Math.max(Number(pageSize) || 10, 1), 100),
    });
    res.json({
      success: true,
      message: "Berhasil mengambil data DPD",
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

export const getDpdByIdHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = dpdIdParamSchema.parse(req.params.id);
    const dpd = await dpdService.getDpdById(req.scope!, id);
    if (!dpd) {
      return res.status(404).json({ success: false, message: "Data DPD tidak ditemukan" });
    }
    res.json({ success: true, data: dpd });
  } catch (error) {
    next(error);
  }
};

export const createDpdHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = createDpdSchema.parse(req.body);
    const dpd = await dpdService.createDpd(validatedData, req.user?.sub);
    res.status(201).json({ success: true, message: "Berhasil membuat data DPD", data: dpd });
  } catch (error) {
    next(error);
  }
};

export const updateDpdHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = dpdIdParamSchema.parse(req.params.id);
    // DPP boleh ubah semua field, DPD hanya field data dirinya sendiri
    const validatedData = req.scope!.isSuperAdmin
      ? updateDpdSchema.parse(req.body)
      : updateDpdSelfSchema.parse(req.body);
    const updated = await dpdService.updateDpd(req.scope!, id, validatedData, req.user?.sub);
    res.json({ success: true, message: "Data DPD berhasil diperbarui", data: updated });
  } catch (error) {
    next(error);
  }
};

export const deleteDpdHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = dpdIdParamSchema.parse(req.params.id);
    await dpdService.softDeleteDpd(id, req.user?.sub);
    res.json({ success: true, message: "Data DPD berhasil dihapus" });
  } catch (error) {
    next(error);
  }
};
