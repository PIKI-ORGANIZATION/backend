import { z } from "zod";

////////////////////////////////////////////////////
// UUID PARAM
////////////////////////////////////////////////////
export const uuidParamSchema = z.object({
  uuid: z.string().uuid(),
});

////////////////////////////////////////////////////
// BASE FORM PENGADUAN
////////////////////////////////////////////////////
const baseFormPengaduanSchema = z.object({
  namaPelapor: z.string().min(1),

  emailPelapor: z.string().email(),

  noWaPelapor: z.string().optional().nullable(),

  subjek: z.string().min(1),

  isiBadan: z.string().min(1),

  kategoriAduan: z
    .enum(["UMUM", "ORGANISASI", "PELAYANAN", "LAINNYA"])
    .optional(),

  statusPengaduan: z
    .enum(["MASUK", "DIPROSES", "SELESAI", "DITOLAK"])
    .optional(),

  tanggapan: z.string().optional().nullable(),

  tanggalTanggapan: z.coerce.date().optional().nullable(),

  isAnonymous: z.boolean().optional(),

  ////////////////////////////////////////////////////
  // RELASI OPTIONAL
  ////////////////////////////////////////////////////
  insert_by: z.string().uuid().optional().nullable(),
});

////////////////////////////////////////////////////
// CREATE
////////////////////////////////////////////////////
export const createFormPengaduanSchema = z.any().superRefine((val, ctx) => {
  if (Array.isArray(val)) {
    const res = z.array(baseFormPengaduanSchema).min(1).safeParse(val);
    if (!res.success) res.error.issues.forEach(i => ctx.addIssue(i));
  } else {
    const res = baseFormPengaduanSchema.safeParse(val);
    if (!res.success) res.error.issues.forEach(i => ctx.addIssue(i));
  }
});

////////////////////////////////////////////////////
// UPDATE
////////////////////////////////////////////////////
export const updateFormPengaduanSchema =
  baseFormPengaduanSchema.partial();

////////////////////////////////////////////////////
// TYPES
////////////////////////////////////////////////////
export type CreateFormPengaduanInput = z.infer<
  typeof createFormPengaduanSchema
>;
export type UpdateFormPengaduanInput = z.infer<
  typeof updateFormPengaduanSchema
>;