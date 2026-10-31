import { z } from "zod";

// Field yang boleh diubah oleh DPC sendiri (nama DPC/DPD & kode provinsi selalu diambil dari data_master_wilayah)
const dataDpcSchema = z.object({
  pengurus: z.string().trim().max(255).optional().nullable(),
  no_handphone: z.string().trim().max(100).optional().nullable(),
  keterangan: z.string().trim().max(255).optional().nullable(),
  penerbitan_sk: z.string().trim().max(50).optional().nullable(),
});

export const createDpdDpcSchema = dataDpcSchema.extend({
  kode_kabupaten: z.string().trim().min(1, "kode_kabupaten wajib diisi"),
});

// Update oleh DPP: boleh ganti kode kabupaten
export const updateDpdDpcSchema = dataDpcSchema.extend({
  kode_kabupaten: z.string().trim().min(1).optional(),
});

// Update oleh DPC sendiri: kode wilayah tidak boleh diubah
export const updateDpdDpcSelfSchema = dataDpcSchema.strict();

export const dpdDpcIdParamSchema = z.coerce.number().int().positive("ID DPC tidak valid");

export type CreateDpdDpcInput = z.infer<typeof createDpdDpcSchema>;
export type UpdateDpdDpcInput = z.infer<typeof updateDpdDpcSchema>;
