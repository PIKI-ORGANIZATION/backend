import { z } from "zod";

////////////////////////////////////////////////////
// UUID PARAM
////////////////////////////////////////////////////
export const uuidParamSchema = z.object({
  uuid: z.string().uuid(),
});

////////////////////////////////////////////////////
// BASE SEJARAH SCHEMA
////////////////////////////////////////////////////
const baseSejarahSchema = z.object({
  timeline: z.string().trim().min(1),

  judul: z.string().trim().min(3),

  deskripsiTimeline: z.string().trim().min(5),

  gambar: z.string().trim().nullable().optional(),

  urutan: z.coerce.number().int().nullable().optional(),

  statusSejarah: z.enum(["ACTIVE", "NON_ACTIVE"]).optional(),
});

////////////////////////////////////////////////////
// CREATE (satu data atau banyak sekaligus)
////////////////////////////////////////////////////
export const createSejarahSchema = z.union([
  baseSejarahSchema,
  z.array(baseSejarahSchema).min(1),
]);

////////////////////////////////////////////////////
// UPDATE
////////////////////////////////////////////////////
export const updateSejarahSchema = baseSejarahSchema.partial();

////////////////////////////////////////////////////
// TYPES
////////////////////////////////////////////////////
export type CreateSejarahInput = z.infer<typeof baseSejarahSchema>;

export type UpdateSejarahInput = z.infer<typeof updateSejarahSchema>;
