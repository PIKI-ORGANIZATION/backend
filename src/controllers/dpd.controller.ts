import { Request, Response, NextFunction } from "express";
import * as dpdService from "../services/dpd.service";
import { dpdSchema, updateDpdSchema } from "../validators/dpd.schema";

export const getDpdListHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, skip, take } = req.query;
    const result = await dpdService.getDpdList({
      search: search as string,
      skip: skip ? Number(skip) : undefined,
      take: take ? Number(take) : undefined,
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
    const { id } = req.params;
    const dpd = await dpdService.getDpdById(id);
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
    const validatedData = dpdSchema.parse(req.body);
    const actorUuid = req.user?.uuid; // Assuming you have req.user from auth middleware
    const dpd = await dpdService.createDpd(validatedData, actorUuid);
    res.status(201).json({ success: true, message: "Berhasil membuat data DPD", data: dpd });
  } catch (error) {
    next(error);
  }
};

export const updateDpdHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const validatedData = updateDpdSchema.parse(req.body);
    const actorUuid = req.user?.uuid;
    const updated = await dpdService.updateDpd(id, validatedData, actorUuid);
    res.json({ success: true, message: "Data DPD berhasil diperbarui", data: updated });
  } catch (error) {
    next(error);
  }
};

export const deleteDpdHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await dpdService.deleteDpd(id);
    res.json({ success: true, message: "Data DPD berhasil dihapus" });
  } catch (error) {
    next(error);
  }
};
