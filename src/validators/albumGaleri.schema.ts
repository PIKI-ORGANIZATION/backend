import { z } from "zod";

////////////////////////////////////////////////////
// UUID PARAM
////////////////////////////////////////////////////
export const uuidParamSchema = z.object({
  uuid: z.string().uuid(),
});

////////////////////////////////////////////////////
// BASE ALBUM GALERI
////////////////////////////////////////////////////
const baseAlbumGaleriSchema = z.object({
  namaAlbum: z.string().min(1),

  deskripsi: z.string().optional().nullable(),

  tanggalKegiatan: z.coerce.date(),

  coverMedia: z.string().optional().nullable(),

  isPublic: z.boolean().optional(),

  statusAlbum: z.enum(["ACTIVE", "ARCHIVED"]).optional(),

  ////////////////////////////////////////////////////
  // RELASI OPTIONAL
  ////////////////////////////////////////////////////
  cabangUuid: z.string().uuid().optional().nullable(),

  newsUtamaUuid: z.string().uuid().optional().nullable(),

  kelasUuid: z.string().uuid().optional().nullable(),
});

////////////////////////////////////////////////////
// CREATE
////////////////////////////////////////////////////
export const createAlbumGaleriSchema = z.any().superRefine((val, ctx) => {
  if (Array.isArray(val)) {
    const res = z.array(baseAlbumGaleriSchema).min(1).safeParse(val);
    if (!res.success) res.error.issues.forEach(i => ctx.addIssue(i));
  } else {
    const res = baseAlbumGaleriSchema.safeParse(val);
    if (!res.success) res.error.issues.forEach(i => ctx.addIssue(i));
  }
});

////////////////////////////////////////////////////
// UPDATE
////////////////////////////////////////////////////
export const updateAlbumGaleriSchema = baseAlbumGaleriSchema.partial();

////////////////////////////////////////////////////
// TYPES
////////////////////////////////////////////////////
export type CreateAlbumGaleriInput = z.infer<typeof createAlbumGaleriSchema>;
export type UpdateAlbumGaleriInput = z.infer<typeof updateAlbumGaleriSchema>;