import { z } from "zod";

////////////////////////////////////////////////////
// UUID PARAM
////////////////////////////////////////////////////
export const uuidParamSchema = z.object({
  uuid: z.string().uuid(),
});

////////////////////////////////////////////////////
// BASE FAQ
////////////////////////////////////////////////////
const baseFAQSchema = z.object({
  pertanyaan: z.string().min(1),

  jawaban: z.string().min(1),

  kategori: z
    .enum(["UMUM", "KEANGGOTAAN", "PROGRAM", "ORGANISASI"])
    .optional(),

  urutan: z.number().int().optional(),

  isPublish: z.boolean().optional(),

  statusFAQ: z.enum(["ACTIVE", "ARCHIVED"]).optional(),

  ////////////////////////////////////////////////////
  // RELASI OPTIONAL
  ////////////////////////////////////////////////////
  insert_by: z.string().uuid().optional().nullable(),
});

////////////////////////////////////////////////////
// CREATE
////////////////////////////////////////////////////
export const createFAQSchema = z.any().superRefine((val, ctx) => {
  if (Array.isArray(val)) {
    const res = z.array(baseFAQSchema).min(1).safeParse(val);
    if (!res.success) res.error.issues.forEach(i => ctx.addIssue(i));
  } else {
    const res = baseFAQSchema.safeParse(val);
    if (!res.success) res.error.issues.forEach(i => ctx.addIssue(i));
  }
});

////////////////////////////////////////////////////
// UPDATE
////////////////////////////////////////////////////
export const updateFAQSchema = baseFAQSchema.partial();

////////////////////////////////////////////////////
// TYPES
////////////////////////////////////////////////////
export type CreateFAQInput = z.infer<typeof createFAQSchema>;
export type UpdateFAQInput = z.infer<typeof updateFAQSchema>;