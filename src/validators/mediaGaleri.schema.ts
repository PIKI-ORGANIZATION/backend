import { z } from "zod";

////////////////////////////////////////////////////
// BASE SCHEMA
////////////////////////////////////////////////////
const baseMediaGaleriSchema = z.object({
  tipeMedia: z.enum(["FOTO", "VIDEO"]),

  urlMedia: z.string().min(1),

  thumbnail: z.string().optional().nullable(),

  keterangan: z.string().optional().nullable(),

//   urutan: z.number().int().min(0).optional(),

  durasi: z.string().optional().nullable(),

  ////////////////////////////////////////////////////
  // WAJIB ADA
  ////////////////////////////////////////////////////
  albumUuid: z.string().uuid(),
});

////////////////////////////////////////////////////
// CUSTOM VALIDATION
////////////////////////////////////////////////////
const mediaWithRules = baseMediaGaleriSchema.superRefine(
  (data, ctx) => {
    // THUMBNAIL WAJIB UNTUK VIDEO
    if (data.tipeMedia === "VIDEO" && !data.thumbnail) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Thumbnail wajib untuk video",
        path: ["thumbnail"],
      });
    }
  }
);

export const createMediaGaleriSchema = z.any().superRefine((val, ctx) => {
  if (Array.isArray(val)) {
    const res = z.array(mediaWithRules).min(1).safeParse(val);
    if (!res.success) res.error.issues.forEach(i => ctx.addIssue(i));
  } else {
    const res = mediaWithRules.safeParse(val);
    if (!res.success) res.error.issues.forEach(i => ctx.addIssue(i));
  }
});

export const updateMediaGaleriSchema =
  baseMediaGaleriSchema.partial();

export type CreateMediaGaleriInput = z.infer<
  typeof baseMediaGaleriSchema
>;

export type CreateMediaGaleriBulkInput =
  | CreateMediaGaleriInput
  | CreateMediaGaleriInput[];