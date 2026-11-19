import { z } from "zod";

////////////////////////////////////////////////////
// UUID PARAM
////////////////////////////////////////////////////
export const uuidParamSchema = z.object({
  uuid: z.string().uuid(),
});

////////////////////////////////////////////////////
// ENUM
////////////////////////////////////////////////////
export const statusSejarahEnum = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);

////////////////////////////////////////////////////
// BASE SEJARAH SCHEMA
////////////////////////////////////////////////////
const baseSejarahSchema = z.object({
  timeline: z.string().trim().min(1),

  judul: z.string().trim().min(3),

  deskripsiTimeline: z.string().trim().min(5),

  gambar: z.string().trim().nullable().optional(),

  urutan: z.coerce.number().int().nullable().optional(),
});

////////////////////////////////////////////////////
// CREATE (satu data atau banyak sekaligus)
////////////////////////////////////////////////////
const createItemSchema = baseSejarahSchema.extend({
  statusSejarah: z.enum(["DRAFT", "PUBLISHED"]).optional(),
});

export const createSejarahSchema = z.union([
  createItemSchema,
  z.array(createItemSchema).min(1),
]);

////////////////////////////////////////////////////
// UPDATE
////////////////////////////////////////////////////
export const updateSejarahSchema = baseSejarahSchema.partial().extend({
  statusSejarah: statusSejarahEnum.optional(),
});

////////////////////////////////////////////////////
// TYPES
////////////////////////////////////////////////////
export type CreateSejarahInput = z.infer<typeof createItemSchema>;

export type UpdateSejarahInput = z.infer<typeof updateSejarahSchema>;
