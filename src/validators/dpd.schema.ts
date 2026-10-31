import { z } from "zod";

// Field yang boleh diubah oleh DPD sendiri (nama DPD selalu diambil dari data_master_wilayah)
const dataDpdSchema = z.object({
  pengurus: z.string().trim().max(255).optional().nullable(),
  noHandphone: z.string().trim().max(100).optional().nullable(),
  keterangan: z.string().trim().max(255).optional().nullable(),
  penerbitanSk: z.string().trim().max(50).optional().nullable(),
});

export const createDpdSchema = dataDpdSchema.extend({
  kodeProvinsi: z.string().trim().min(1, "kodeProvinsi wajib diisi"),
});

// Update oleh DPP: boleh ganti kode provinsi
export const updateDpdSchema = dataDpdSchema.extend({
  kodeProvinsi: z.string().trim().min(1).optional(),
});

// Update oleh DPD sendiri: kode wilayah tidak boleh diubah
export const updateDpdSelfSchema = dataDpdSchema.strict();

export const dpdIdParamSchema = z.string().uuid("ID DPD tidak valid");

export type CreateDpdInput = z.infer<typeof createDpdSchema>;
export type UpdateDpdInput = z.infer<typeof updateDpdSchema>;
