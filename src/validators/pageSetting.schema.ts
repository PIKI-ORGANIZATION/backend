import { z } from "zod";

////////////////////////////////////////////////////
// UUID PARAM
////////////////////////////////////////////////////
export const uuidParamSchema = z.object({
  uuid: z.string().uuid(),
});

////////////////////////////////////////////////////
// PAGE SETTING TYPE
////////////////////////////////////////////////////
const pageSettingTypeEnum = z.enum(["TEXT", "NUMBER", "ARRAY", "IMAGE"]);

////////////////////////////////////////////////////
// BASE PAGE SETTING
////////////////////////////////////////////////////
const basePageSettingSchema = z.object({
  key: z
    .string()
    .min(1, "Key wajib diisi"),

  nama: z
    .string()
    .min(1, "Nama wajib diisi"),

  type: pageSettingTypeEnum
    .optional()
    .default("TEXT"),

  value: z
    .string()
    .min(1, "Value wajib diisi"),
});

////////////////////////////////////////////////////
// CREATE
////////////////////////////////////////////////////
export const createPageSettingSchema = z
  .any()
  .superRefine((val, ctx) => {

    // =================================================
    // BULK CREATE
    // =================================================
    if (Array.isArray(val)) {

      const res = z
        .array(basePageSettingSchema)
        .min(1)
        .safeParse(val);

      if (!res.success) {
        res.error.issues.forEach((i) =>
          ctx.addIssue(i)
        );
      }

    } else {

      // =================================================
      // SINGLE CREATE
      // =================================================
      const res =
        basePageSettingSchema.safeParse(val);

      if (!res.success) {
        res.error.issues.forEach((i) =>
          ctx.addIssue(i)
        );
      }
    }
  });

////////////////////////////////////////////////////
// UPDATE
////////////////////////////////////////////////////
export const updatePageSettingSchema =
  basePageSettingSchema.partial();

////////////////////////////////////////////////////
// TYPES
////////////////////////////////////////////////////
export type CreatePageSettingInput =
  z.infer<typeof createPageSettingSchema>;

export type UpdatePageSettingInput =
  z.infer<typeof updatePageSettingSchema>;
