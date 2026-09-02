import { Request, Response, NextFunction } from "express";
import * as dpdDpcService from "../services/dpdDpc.service";
import { dpdDpcSchema, updateDpdDpcSchema } from "../validators/dpdDpc.schema";

export const getDpdDpcListHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, skip, take } = req.query;
    const result = await dpdDpcService.getDpdDpcList({
      search: search as string,
      skip: skip ? Number(skip) : undefined,
      take: take ? Number(take) : undefined,
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
    const { id } = req.params;
    const dpdDpc = await dpdDpcService.getDpdDpcById(Number(id));
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
    const validatedData = dpdDpcSchema.parse(req.body);
    const dpdDpc = await dpdDpcService.createDpdDpc(validatedData);
    res.status(201).json({ success: true, message: "Berhasil membuat data DPD-DPC", data: dpdDpc });
  } catch (error) {
    next(error);
  }
};

export const updateDpdDpcHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const validatedData = updateDpdDpcSchema.parse(req.body);
    const updated = await dpdDpcService.updateDpdDpc(Number(id), validatedData);
    res.json({ success: true, message: "Data DPD-DPC berhasil diperbarui", data: updated });
  } catch (error) {
    next(error);
  }
};

export const deleteDpdDpcHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await dpdDpcService.deleteDpdDpc(Number(id));
    res.json({ success: true, message: "Data DPD-DPC berhasil dihapus" });
  } catch (error) {
    next(error);
  }
};
