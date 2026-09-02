import { z } from "zod";

////////////////////////////////////////////////////
// UUID PARAM
////////////////////////////////////////////////////
export const uuidParamSchema = z.object({
  uuid: z.string().uuid(),
});

////////////////////////////////////////////////////
// BASE PENDAFTARAN
////////////////////////////////////////////////////
const basePendaftaranSchema = z.object({
  kelasUuid: z.string().uuid(),

  namaPeserta: z.string().min(1),

  emailPeserta: z.string().email(),

  noWaPeserta: z.string().optional().nullable(),

  catatanPeserta: z.string().optional().nullable(),

  statusPendaftaran: z
    .enum(["PENDING", "DITERIMA", "DITOLAK", "HADIR"])
    .optional(),
});

////////////////////////////////////////////////////
// CREATE
////////////////////////////////////////////////////
export const createPendaftaranSchema = z.any().superRefine((val, ctx) => {
  if (Array.isArray(val)) {
    const res = z.array(basePendaftaranSchema).min(1).safeParse(val);
    if (!res.success) res.error.issues.forEach(i => ctx.addIssue(i));
  } else {
    const res = basePendaftaranSchema.safeParse(val);
    if (!res.success) res.error.issues.forEach(i => ctx.addIssue(i));
  }
});

////////////////////////////////////////////////////
// UPDATE
////////////////////////////////////////////////////
export const updatePendaftaranSchema =
  basePendaftaranSchema.partial();

////////////////////////////////////////////////////
// TYPES
////////////////////////////////////////////////////
export type CreatePendaftaranInput = z.infer<
  typeof createPendaftaranSchema
>;

export type UpdatePendaftaranInput = z.infer<
  typeof updatePendaftaranSchema
>;
