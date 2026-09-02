import { z } from "zod";

////////////////////////////////////////////////////
// UUID PARAM
////////////////////////////////////////////////////
export const uuidParamSchema = z.object({
  uuid: z.string().uuid("UUID tidak valid"),
});

////////////////////////////////////////////////////
// BASE ANGGOTA SCHEMA
////////////////////////////////////////////////////
export const anggotaSchema = z.object({
  namaLengkap: z.string().trim().min(3, "Nama lengkap minimal 3 karakter"),
  namaPanggil: z.string().trim().nullable().optional(),
  tempatLahir: z.string().trim().nullable().optional(),
  tanggalLahir: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? null : val),
    z.string()
      .refine((val) => !isNaN(Date.parse(val)), "Format tanggal lahir tidak valid")
      .nullable()
      .optional(),
  ),
  alamat: z.string().trim().nullable().optional(),
  pendidikanUuid: z.string().uuid("Pendidikan UUID tidak valid").nullable().optional(),
  pekerjaanUuid: z.string().uuid("Pekerjaan UUID tidak valid").nullable().optional(),
  bio: z.string().trim().nullable().optional(),
  pesanKesan: z.string().trim().nullable().optional(),
  angkatan: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? null : String(val)),
    z.string()
      .regex(/^\d{4}$/, "Angkatan harus berupa tahun 4 digit (contoh: 2010)")
      .refine((val) => { const n = Number(val); return n >= 1700 && n <= 2099; }, "Angkatan harus antara 1700–2099")
      .nullable()
      .optional(),
  ),
  // jabatan: z.string().nullable().optional(),
  bidangStudiUuid: z.string().uuid("Bidang Studi UUID tidak valid").nullable().optional(),
  bidangMinatUuid: z.string().uuid("Bidang Minat UUID tidak valid").nullable().optional(),
  provinsi: z.string().nullable().optional(),
  kotaDomisili: z.string().nullable().optional(),
  profileImg: z.string().nullable().optional(),
  noWa: z.preprocess(
    (val) => (val === "" ? null : val),
    z.string()
      .regex(/^\+?[0-9]{8,15}$/, "Format nomor WA tidak valid")
      .nullable()
      .optional(),
  ),
  instagram: z.string().trim().nullable().optional(),
  facebook: z.string().trim().nullable().optional(),
  statusKeanggotaan: z.enum(["NON_MEMBER", "MEMBER"]).optional(),
  cabangUuid: z.string().uuid("Cabang UUID tidak valid").nullable().optional(),
});

////////////////////////////////////////////////////
// CREATE (BISA OBJECT ATAU ARRAY)
////////////////////////////////////////////////////
export const createAnggotaSchema = z.any().superRefine((val, ctx) => {
  if (Array.isArray(val)) {
    const res = z.array(anggotaSchema).safeParse(val);
    if (!res.success) res.error.issues.forEach(i => ctx.addIssue(i));
  } else {
    const res = anggotaSchema.safeParse(val);
    if (!res.success) res.error.issues.forEach(i => ctx.addIssue(i));
  }
});

////////////////////////////////////////////////////
// UPDATE
////////////////////////////////////////////////////
export const updateAnggotaSchema = anggotaSchema.partial();

////////////////////////////////////////////////////
// APPROVAL
////////////////////////////////////////////////////
export const approveAnggotaSchema = z.object({});

////////////////////////////////////////////////////
// TYPES
////////////////////////////////////////////////////
export type CreateAnggotaInput = z.infer<typeof createAnggotaSchema>;
export type UpdateAnggotaInput = z.infer<typeof updateAnggotaSchema>;
export type ApproveAnggotaInput = z.infer<typeof approveAnggotaSchema>;
