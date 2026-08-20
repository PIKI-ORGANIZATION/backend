import { z } from "zod";

export const newsStatusEnum = z.enum(
  ["DRAFT", "PUBLISHED", "ARCHIVED"],
  { message: "Status news tidak valid" }
);

export const uuidSchema = z.string().uuid("Format UUID tidak valid");

const baseNewsUtamaSchema = z.object({
  judul: z.string().min(5, "Judul minimal 5 karakter"),
  ringkasan: z.string().optional(),
  konten: z.string().min(10, "Konten terlalu pendek"),
  slug: z.string()
    .min(5, "Slug minimal 5 karakter")
    .regex(/^[a-z0-9-]+$/, "Slug hanya boleh huruf kecil, angka, dan dash"),
  url_thumbnail_img: z.string().nullable().optional(),

  tags: z.array(uuidSchema)
    .min(1, "Minimal 1 tag")
    .optional(),

  kategori: z.array(uuidSchema)
    .min(1, "Minimal 1 kategori")
    .optional(),

  durasi_baca: z.number().min(1).optional(),

  // DYNAMIC GALERI
  albumList: z.array(z.object({
    namaAlbum: z.string().min(3),
    deskripsi: z.string().optional().nullable(),
    tanggalKegiatan: z.string().or(z.date()), // Accepts ISO strings
    mediaList: z.array(z.object({
      tipeMedia: z.enum(["FOTO", "VIDEO"]),
      urlMedia: z.string().url(),
      thumbnail: z.string().optional().nullable(),
      keterangan: z.string().optional().nullable(),
    })).optional(),
  })).optional(),
});

export const createNewsUtamaSchema = baseNewsUtamaSchema;

export const createNewsUtamaBulkSchema = createNewsUtamaSchema;

export type CreateNewsUtamaInput =
  z.infer<typeof createNewsUtamaBulkSchema>;


// Untuk update, semua field optional kecuali uuid
export const updateNewsUtamaSchema = z.object({
  judul: z.string().min(5).optional(),
  ringkasan: z.string().optional(),
  konten: z.string().min(10).optional(),
  slug: z.string()
    .min(5, "Slug minimal 5 karakter")
    .regex(/^[a-z0-9-]+$/, "Slug hanya boleh huruf kecil, angka, dan dash")
    .optional(),
  url_thumbnail_img: z.string().nullable().optional(),

  statusNewsUtama: newsStatusEnum.optional(),

  tags: z.array(uuidSchema).optional(),
  kategori: z.array(uuidSchema).optional(),

  durasi_baca: z.number().min(1).optional(),

  albumList: z.array(z.object({
    uuid: z.string().uuid().optional(), // For identifying existing updates
    namaAlbum: z.string().min(3),
    deskripsi: z.string().optional().nullable(),
    tanggalKegiatan: z.string().or(z.date()),
    mediaList: z.array(z.object({
      uuid: z.string().uuid().optional(), // For identifying existing
      tipeMedia: z.enum(["FOTO", "VIDEO"]),
      urlMedia: z.string().url(),
      thumbnail: z.string().optional().nullable(),
      keterangan: z.string().optional().nullable(),
    })).optional(),
  })).optional(),
});

export type UpdateNewsUtamaInput =
  z.infer<typeof updateNewsUtamaSchema>;