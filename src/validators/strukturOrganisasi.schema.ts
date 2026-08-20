import { z } from "zod";

////////////////////////////////////////////////////
// UUID PARAM
////////////////////////////////////////////////////
export const uuidParamSchema = z.object({
  uuid: z.string().uuid(),
});

////////////////////////////////////////////////////
// BASE STRUKTUR ORGANISASI SCHEMA
////////////////////////////////////////////////////
const baseStrukturOrganisasiSchema = z.object({
  periodeUuid: z.union([
    z.string().uuid(),
    z.literal("00000000-0000-0000-0000-000000000001"),
  ]),

  atasanUuid: z.string().uuid().optional().nullable(),

  ////////////////////////////////////////////////////
  // RELASI WAJIB
  ////////////////////////////////////////////////////
  seniorUuid: z.string().uuid(),

  jabatanUuid: z.string().uuid(),

  ////////////////////////////////////////////////////
  // RELASI OPTIONAL
  ////////////////////////////////////////////////////
  bidangUuid: z
    .string()
    .uuid()
    .optional()
    .nullable(),

  ////////////////////////////////////////////////////
  // URUTAN
  ////////////////////////////////////////////////////
  urutan: z
    .number()
    .int()
    .min(0)
    .optional(),

  ////////////////////////////////////////////////////
  // LEVEL VISUAL OVERRIDE
  ////////////////////////////////////////////////////
  levelOverride: z
    .number()
    .int()
    .optional()
    .nullable(),
});

////////////////////////////////////////////////////
// CREATE
////////////////////////////////////////////////////
export const createStrukturOrganisasiSchema = z.any().superRefine((val, ctx) => {
  if (Array.isArray(val)) {
    const res = z.array(baseStrukturOrganisasiSchema).safeParse(val);
    if (!res.success) res.error.issues.forEach(i => ctx.addIssue(i));
  } else {
    const res = baseStrukturOrganisasiSchema.safeParse(val);
    if (!res.success) res.error.issues.forEach(i => ctx.addIssue(i));
  }
});

////////////////////////////////////////////////////
// UPDATE
////////////////////////////////////////////////////
export const updateStrukturOrganisasiSchema =
  baseStrukturOrganisasiSchema.partial();

////////////////////////////////////////////////////
// TYPES
////////////////////////////////////////////////////
export type CreateStrukturOrganisasiInput = z.infer<
  typeof createStrukturOrganisasiSchema
>;

export type UpdateStrukturOrganisasiInput = z.infer<
  typeof updateStrukturOrganisasiSchema
>;