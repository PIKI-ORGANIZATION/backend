import { z } from "zod";

////////////////////////////////////////////////////
// UUID PARAM
////////////////////////////////////////////////////
export const uuidParamSchema = z.object({
  uuid: z.string().uuid(),
});

////////////////////////////////////////////////////
// BASE KELAS
////////////////////////////////////////////////////
////////////////////////////////////////////////////
// BASE (TANPA superRefine)
////////////////////////////////////////////////////
const baseKelasSchema = z.object({
  namaKelas: z.string().min(1),

  deskripsiKelas: z.string().optional().nullable(),

  jenisKelas: z
    .enum(["WORKSHOP", "KURSUS", "SEMINAR", "BOOTCAMP"])
    .optional(),

  metodePembelajaran: z
    .enum(["OFFLINE", "ONLINE", "HYBRID"])
    .optional(),

  tanggalMulai: z.coerce.date(),
  tanggalSelesai: z.coerce.date().optional().nullable(),

  lokasi: z.string().optional().nullable(),
  linkOnline: z.string().optional().nullable(),

  harga: z.preprocess(
    (val) => {
      if (val === null || val === undefined || val === "") return undefined;
      return Number(val);
    },
    z.number().min(0, "Harga tidak boleh negatif").optional()
  ),

  maxPeserta: z.number().int().optional().nullable(),

  thumbnail: z.string().optional().nullable(),

  statusKelas: z
    .enum(["UPCOMING", "BERLANGSUNG", "SELESAI", "DIBATALKAN"])
    .optional(),

  mentorUuids: z.array(z.string().uuid()).optional(),
  topikUuids: z.array(z.string().uuid()).optional(),

  news: z
    .object({
      judul: z.string(),
      konten: z.string(),
      slug: z.string(),
      ringkasan: z.string().optional(),
      url_thumbnail_img: z.string().optional(),
    })
    .optional(),
});

const kelasWithRefine = baseKelasSchema.superRefine((data, ctx) => {
  if (
    data.tanggalSelesai &&
    data.tanggalMulai &&
    data.tanggalSelesai <= data.tanggalMulai
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "tanggalSelesai harus setelah tanggalMulai",
      path: ["tanggalSelesai"],
    });
  }
});

////////////////////////////////////////////////////
// CREATE
////////////////////////////////////////////////////
export const createKelasSchema = z.any().superRefine((val, ctx) => {
  if (Array.isArray(val)) {
    const res = z.array(kelasWithRefine).min(1).safeParse(val);
    if (!res.success) res.error.issues.forEach(i => ctx.addIssue(i));
  } else {
    const res = kelasWithRefine.safeParse(val);
    if (!res.success) res.error.issues.forEach(i => ctx.addIssue(i));
  }
});

////////////////////////////////////////////////////
// UPDATE
////////////////////////////////////////////////////
export const updateKelasSchema = baseKelasSchema
  .partial()
  .superRefine((data, ctx) => {
    if (
      data.tanggalSelesai &&
      data.tanggalMulai &&
      data.tanggalSelesai <= data.tanggalMulai
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "tanggalSelesai harus setelah tanggalMulai",
        path: ["tanggalSelesai"],
      });
    }
  });

////////////////////////////////////////////////////
// TYPES
////////////////////////////////////////////////////
export type CreateKelasInput = z.infer<
  typeof createKelasSchema
>;

export type UpdateKelasInput = z.infer<
  typeof updateKelasSchema
>;
