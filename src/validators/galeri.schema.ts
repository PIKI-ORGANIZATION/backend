import { z } from "zod";

////////////////////////////////////////////////////
// ID PARAM
////////////////////////////////////////////////////
export const idParamSchema = z.object({
  id: z.string().uuid(),
});

////////////////////////////////////////////////////
// ENUM
////////////////////////////////////////////////////
export const typeGaleriEnum = z.enum(["PHOTO", "VIDEO", "INSTAGRAM"]);

export const penempatanGaleriEnum = z.enum(["BERANDA", "GALERI"]);

export const statusGaleriEnum = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);

// Tanggal kegiatan format YYYY-MM-DD (contoh: 2024-10-15)
const tanggalSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD, contoh 2024-10-15")
  .refine((val) => {
    const d = new Date(`${val}T00:00:00.000Z`);
    return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === val;
  }, "Tanggal tidak valid");

////////////////////////////////////////////////////
// BASE GALERI SCHEMA
// title boleh kosong untuk video YouTube (diisi otomatis dari judul asli video)
////////////////////////////////////////////////////
const baseGaleriSchema = z.object({
  type: typeGaleriEnum,

  title: z.string().trim().nullable().optional(),

  deskripsi: z.string().trim().nullable().optional(),

  url: z.string().trim().min(1),

  thumbnailUrl: z.string().trim().nullable().optional(),

  kategoriKegiatan: z.string().trim().max(100).nullable().optional(),

  tanggal: tanggalSchema.nullable().optional(),

  lokasi: z.string().trim().max(255).nullable().optional(),

  duration: z.string().trim().max(20).nullable().optional(),

  penempatan: z.array(penempatanGaleriEnum).min(1).optional(),

  featured: z.boolean().optional(),

  urutan: z.coerce.number().int().nullable().optional(),
});

////////////////////////////////////////////////////
// CREATE (satu data atau banyak sekaligus)
////////////////////////////////////////////////////
const createItemSchema = baseGaleriSchema.extend({
  status: z.enum(["DRAFT", "PUBLISHED"]).optional(),
});

export const createGaleriSchema = z.union([
  createItemSchema,
  z.array(createItemSchema).min(1),
]);

////////////////////////////////////////////////////
// UPDATE
////////////////////////////////////////////////////
export const updateGaleriSchema = baseGaleriSchema.partial().extend({
  status: statusGaleriEnum.optional(),
});

////////////////////////////////////////////////////
// PREVIEW LINK (YouTube / Instagram)
////////////////////////////////////////////////////
export const previewGaleriSchema = z.object({
  type: z.enum(["VIDEO", "INSTAGRAM"]),
  url: z.string().trim().min(1),
});

////////////////////////////////////////////////////
// TYPES
////////////////////////////////////////////////////
export type CreateGaleriInput = z.infer<typeof createItemSchema>;

export type UpdateGaleriInput = z.infer<typeof updateGaleriSchema>;
