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
export const platformSosmedEnum = z.enum(["YOUTUBE", "INSTAGRAM"]);

export const penempatanSosmedEnum = z.enum(["BERANDA", "GALERI"]);

export const statusSosmedEnum = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);

////////////////////////////////////////////////////
// BASE SOSMED SCHEMA
// Admin cukup paste link biasa, embed URL dibuat otomatis oleh backend
////////////////////////////////////////////////////
const baseSosmedSchema = z.object({
  platform: platformSosmedEnum,

  url: z.string().trim().min(5),

  judul: z.string().trim().nullable().optional(),

  penempatan: z.array(penempatanSosmedEnum).min(1).optional(),

  urutan: z.coerce.number().int().nullable().optional(),
});

////////////////////////////////////////////////////
// CREATE (satu data atau banyak sekaligus, status selalu DRAFT)
////////////////////////////////////////////////////
export const createSosmedSchema = z.union([
  baseSosmedSchema,
  z.array(baseSosmedSchema).min(1),
]);

////////////////////////////////////////////////////
// UPDATE (termasuk ubah status)
////////////////////////////////////////////////////
export const updateSosmedSchema = baseSosmedSchema.partial().extend({
  statusSosmed: statusSosmedEnum.optional(),
});

////////////////////////////////////////////////////
// PREVIEW (validasi link tanpa menyimpan)
////////////////////////////////////////////////////
export const previewSosmedSchema = baseSosmedSchema.pick({
  platform: true,
  url: true,
});

////////////////////////////////////////////////////
// TYPES
////////////////////////////////////////////////////
export type CreateSosmedInput = z.infer<typeof baseSosmedSchema>;

export type UpdateSosmedInput = z.infer<typeof updateSosmedSchema>;
