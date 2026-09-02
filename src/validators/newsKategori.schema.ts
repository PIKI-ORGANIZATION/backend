import { z } from "zod";

////////////////////////////////////////////////////
// UUID PARAM VALIDATOR
////////////////////////////////////////////////////
export const uuidParamSchema = z.object({
  uuid: z.string().uuid("Format UUID tidak valid"),
});

////////////////////////////////////////////////////
// STATUS ENUM
////////////////////////////////////////////////////
export const statusKategoriEnum = z.enum(
  ["ACTIVE", "INACTIVE"]
);

////////////////////////////////////////////////////
// CREATE KATEGORI
////////////////////////////////////////////////////
export const createKategoriSchema = z.object({
  nama: z
    .string()
    .min(3, "Nama kategori minimal 3 karakter")
    .max(100, "Nama kategori terlalu panjang"),

  slug: z
    .string()
    .min(3, "Slug minimal 3 karakter")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug hanya boleh huruf kecil, angka, dan dash"
    ),

  deskripsi: z
    .string()
    .max(300, "Deskripsi maksimal 300 karakter")
    .optional(),
});

////////////////////////////////////////////////////
// UPDATE KATEGORI
////////////////////////////////////////////////////
export const updateKategoriSchema = z.object({
  nama: z
    .string()
    .min(3)
    .max(100)
    .optional(),

  slug: z
    .string()
    .min(3)
    .regex(/^[a-z0-9-]+$/)
    .optional(),

  deskripsi: z
    .string()
    .max(300)
    .optional(),

  status_kategori: statusKategoriEnum.optional(),
});

////////////////////////////////////////////////////
// TYPE EXPORT
////////////////////////////////////////////////////
export type CreateKategoriInput =
  z.infer<typeof createKategoriSchema>;

export type UpdateKategoriInput =
  z.infer<typeof updateKategoriSchema>;
