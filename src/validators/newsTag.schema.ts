import { z } from "zod";

////////////////////////////////////////////////////
// UUID
////////////////////////////////////////////////////
export const uuidSchema = z.string().uuid("Format UUID tidak valid");

////////////////////////////////////////////////////
// BASE SCHEMA
////////////////////////////////////////////////////
const baseNewsTagSchema = z.object({
  nama_tag: z
    .string()
    .min(2, "Nama tag minimal 2 karakter")
    .max(50, "Nama tag maksimal 50 karakter")
    .regex(/^[a-zA-Z0-9\s-]+$/, "Nama tag tidak valid")
    .transform((v) => v.trim()),

  jumlah_penggunaan: z
    .number()
    .int("Jumlah penggunaan harus integer")
    .min(0, "Jumlah penggunaan tidak boleh negatif")
    .optional(),

  insert_by: uuidSchema.optional(),
  update_by: uuidSchema.optional(),
});

////////////////////////////////////////////////////
// CREATE
////////////////////////////////////////////////////
export const createNewsTagSchema = baseNewsTagSchema;

export const createNewsTagBulkSchema = createNewsTagSchema;

export type CreateNewsTagInput =
  z.infer<typeof createNewsTagBulkSchema>;

////////////////////////////////////////////////////
// UPDATE
////////////////////////////////////////////////////
export const updateNewsTagSchema = z.object({
  nama_tag: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-zA-Z0-9\s-]+$/)
    .optional(),

  jumlah_penggunaan: z
    .number()
    .int()
    .min(0)
    .optional(),

  update_by: uuidSchema.optional(),
});

export type UpdateNewsTagInput =
  z.infer<typeof updateNewsTagSchema>;