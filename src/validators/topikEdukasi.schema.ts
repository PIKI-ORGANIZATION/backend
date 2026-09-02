import { z } from "zod";

////////////////////////////////////////////////////
// UUID PARAM
////////////////////////////////////////////////////
export const uuidParamSchema = z.object({
  uuid: z.string().uuid(),
});

////////////////////////////////////////////////////
// BASE TOPIK EDUKASI
////////////////////////////////////////////////////
const baseTopikEdukasiSchema = z.object({
  namaTopikEdukasi: z.string().min(1),

  deskripsiTopikEdukasi: z.string().optional().nullable(),
  targetPeserta: z.string().optional().nullable(),
  thumbnailTopikEdukasi: z.string().optional().nullable(),

  statusTopikEdukasi: z
    .enum(["ACTIVE", "INACTIVE"])
    .optional(),
});

////////////////////////////////////////////////////
// CREATE
////////////////////////////////////////////////////
export const createTopikEdukasiSchema = z.any().superRefine((val, ctx) => {
  if (Array.isArray(val)) {
    const res = z.array(baseTopikEdukasiSchema).min(1).safeParse(val);
    if (!res.success) res.error.issues.forEach(i => ctx.addIssue(i));
  } else {
    const res = baseTopikEdukasiSchema.safeParse(val);
    if (!res.success) res.error.issues.forEach(i => ctx.addIssue(i));
  }
});

////////////////////////////////////////////////////
// UPDATE
////////////////////////////////////////////////////
export const updateTopikEdukasiSchema =
  baseTopikEdukasiSchema.partial();

////////////////////////////////////////////////////
// TYPES
////////////////////////////////////////////////////
export type CreateTopikEdukasiInput = z.infer<
  typeof createTopikEdukasiSchema
>;

export type UpdateTopikEdukasiInput = z.infer<
  typeof updateTopikEdukasiSchema
>;
