import { z } from "zod";

const strictNumber = (minVal?: number) => z.preprocess((val) => {
  if (typeof val === "string" && val.trim() !== "") {
    const parsed = Number(val);
    if (!isNaN(parsed)) return parsed;
  }
  return val;
}, minVal !== undefined 
  ? z.number({ invalid_type_error: "Harus berupa angka" }).int({ message: "Harus berupa angka bulat" }).min(minVal, { message: `Minimal ${minVal}` })
  : z.number({ invalid_type_error: "Harus berupa angka" }).int({ message: "Harus berupa angka bulat" }));


////////////////////////////////////////////////////
// UUID PARAM
////////////////////////////////////////////////////
export const uuidParamSchema = z.object({
  uuid: z.string().uuid(),
});

////////////////////////////////////////////////////
// PERIODE
////////////////////////////////////////////////////
const basePeriodeSchema = z.object({
  namaPeriode: z.string().min(3),
  tahunMulai: strictNumber(),
  tahunSelesai: strictNumber(),
  isAktif: z.boolean().optional(),

  cabangUuid: z.string().uuid().optional().nullable(),
});

export const createPeriodeSchema = basePeriodeSchema;

export const updatePeriodeSchema = basePeriodeSchema.partial();

////////////////////////////////////////////////////
// JABATAN
////////////////////////////////////////////////////
const baseJabatanSchema = z.object({
  namaJabatan: z.string().min(2),
  levelJabatan: strictNumber(0),
});

export const createJabatanSchema = z.any().superRefine((val, ctx) => {
  if (Array.isArray(val)) {
    const res = z.array(baseJabatanSchema).safeParse(val);
    if (!res.success) res.error.issues.forEach(i => ctx.addIssue(i));
  } else {
    const res = baseJabatanSchema.safeParse(val);
    if (!res.success) res.error.issues.forEach(i => ctx.addIssue(i));
  }
});

export const updateJabatanSchema = baseJabatanSchema.partial();

////////////////////////////////////////////////////
// BIDANG
////////////////////////////////////////////////////
const baseBidangSchema = z.object({
  namaBidang: z.string().min(2),
});

export const createBidangSchema = z.any().superRefine((val, ctx) => {
  if (Array.isArray(val)) {
    const res = z.array(baseBidangSchema).safeParse(val);
    if (!res.success) res.error.issues.forEach(i => ctx.addIssue(i));
  } else {
    const res = baseBidangSchema.safeParse(val);
    if (!res.success) res.error.issues.forEach(i => ctx.addIssue(i));
  }
});

export const updateBidangSchema = baseBidangSchema.partial();

////////////////////////////////////////////////////
// TYPES
////////////////////////////////////////////////////
export type CreatePeriodeInput = z.infer<typeof createPeriodeSchema>;
export type UpdatePeriodeInput = z.infer<typeof updatePeriodeSchema>;

export type CreateJabatanInput = z.infer<typeof createJabatanSchema>;
export type UpdateJabatanInput = z.infer<typeof updateJabatanSchema>;

export type CreateBidangInput = z.infer<typeof createBidangSchema>;
export type UpdateBidangInput = z.infer<typeof updateBidangSchema>;