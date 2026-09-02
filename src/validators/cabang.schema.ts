import { z } from "zod";

////////////////////////////////////////////////////
// UUID PARAM
////////////////////////////////////////////////////
export const uuidParamSchema = z.object({
  uuid: z.string().uuid(),
});

////////////////////////////////////////////////////
// BASE CABANG SCHEMA
////////////////////////////////////////////////////
const baseCabangSchema = z.object({
  namaCabang: z.string().trim().min(3),

  alamat: z.string().trim().nullable().optional(),

  kabupatenKota: z.string().trim().min(3),

  provinsi: z.string().trim().min(3),

  wilayah: z.string().trim().nullable().optional(),

  statusCabang: z.string().trim().optional(),

  isCabang: z.boolean().optional(),

  deskripsiCabang: z.string().trim().min(5),

  ////////////////////////////////////////////////////
  // VISI MISI
  ////////////////////////////////////////////////////
  visi: z.string().trim().min(5),

  misi: z.array(z.string().trim().min(1)).min(1),

  ////////////////////////////////////////////////////
  // KONTAK CABANG
  ////////////////////////////////////////////////////
  noWa: z.string().regex(/^[0-9+]+$/),

  instagram: z.string().trim(),

  facebook: z.string().trim(),

  youtube: z.string().trim(),

  email: z.string().email(),

  ////////////////////////////////////////////////////
  // HOME HERO SECTION
  ////////////////////////////////////////////////////
  urlBannerImg: z.string().url().optional().nullable(),

  titleHomeHero: z.string().trim().optional().nullable(),

  headlineHomeHero: z.string().trim().optional().nullable(),

  ////////////////////////////////////////////////////
  // COUNTDOWN
  ////////////////////////////////////////////////////
  isCountdownActive: z.boolean().optional(),

  endTimeCountdown: z.coerce.date().optional().nullable(),

  keteranganCountdown: z.string().trim().optional().nullable(),

  ////////////////////////////////////////////////////
  // KETUA CABANG
  ////////////////////////////////////////////////////
  ketuaUuid: z.string().uuid().nullable().optional(),
});

////////////////////////////////////////////////////
// CREATE
////////////////////////////////////////////////////
export const createCabangSchema = z.any().superRefine((val, ctx) => {
  if (Array.isArray(val)) {
    const res = z.array(baseCabangSchema).min(1).safeParse(val);
    if (!res.success) res.error.issues.forEach(i => ctx.addIssue(i));
  } else {
    const res = baseCabangSchema.safeParse(val);
    if (!res.success) res.error.issues.forEach(i => ctx.addIssue(i));
  }
});

////////////////////////////////////////////////////
// UPDATE
////////////////////////////////////////////////////
export const updateCabangSchema = baseCabangSchema.partial();

////////////////////////////////////////////////////
// TYPES
////////////////////////////////////////////////////
export type CreateCabangInput = z.infer<typeof createCabangSchema>;
export type UpdateCabangInput = z.infer<typeof updateCabangSchema>;
