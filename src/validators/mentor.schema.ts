import { z } from "zod";

////////////////////////////////////////////////////
// UUID PARAM
////////////////////////////////////////////////////
export const uuidParamSchema = z.object({
  uuid: z.string().uuid(),
});

////////////////////////////////////////////////////
// BASE MENTOR
////////////////////////////////////////////////////
const baseMentorSchema = z.object({
  namaLengkap: z.string().min(1),

  namaPanggil: z.string().optional().nullable(),
  bio: z.string().optional().nullable(),

  keahlian: z.string().optional().nullable(),
  pendidikan: z.string().optional().nullable(),
  pengalaman: z.string().optional().nullable(),

  profileImg: z.string().optional().nullable(),
  instagram: z.string().optional().nullable(),
  linkedin: z.string().optional().nullable(),

  email: z.string().email().optional().nullable(),

  statusMentor: z
    .enum(["ACTIVE", "INACTIVE"])
    .optional(),
});

////////////////////////////////////////////////////
// CREATE
////////////////////////////////////////////////////
export const createMentorSchema = z.any().superRefine((val, ctx) => {
  if (Array.isArray(val)) {
    const res = z.array(baseMentorSchema).min(1).safeParse(val);
    if (!res.success) res.error.issues.forEach(i => ctx.addIssue(i));
  } else {
    const res = baseMentorSchema.safeParse(val);
    if (!res.success) res.error.issues.forEach(i => ctx.addIssue(i));
  }
});

////////////////////////////////////////////////////
// UPDATE
////////////////////////////////////////////////////
export const updateMentorSchema =
  baseMentorSchema.partial();

////////////////////////////////////////////////////
// TYPES
////////////////////////////////////////////////////
export type CreateMentorInput = z.infer<
  typeof createMentorSchema
>;

export type UpdateMentorInput = z.infer<
  typeof updateMentorSchema
>;
