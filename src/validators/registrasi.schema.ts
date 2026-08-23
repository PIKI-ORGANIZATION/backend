import { z } from "zod";

export const createRegistrasiSchema = z
  .object({
    namaLengkap: z
      .string({ required_error: "Nama lengkap wajib diisi" })
      .min(2, "Nama lengkap minimal 2 karakter"),

    tanggalLahir: z
      .string({ required_error: "Tanggal lahir wajib diisi" })
      .min(1, "Tanggal lahir wajib diisi"),

    noWa: z
      .string({ required_error: "Nomor WhatsApp wajib diisi" })
      .min(8, "Nomor WhatsApp minimal 8 digit")
      .max(20, "Nomor WhatsApp maksimal 20 digit")
      .regex(/^[0-9+]+$/, "Nomor WhatsApp harus berupa angka (contoh: 081234567890)"),

    email: z
      .string({ required_error: "Email wajib diisi" })
      .email("Format email tidak valid (contoh: user@gmail.com)"),

    confirmEmail: z
      .string({ required_error: "Konfirmasi email wajib diisi" })
      .email("Format konfirmasi email tidak valid"),

    password: z
      .string({ required_error: "Password wajib diisi" })
      .min(6, "Password minimal 6 karakter"),

    alamatDomisili: z
      .string({ required_error: "Alamat domisili wajib diisi" })
      .min(3, "Alamat domisili wajib diisi"),

    fileKtpUrl: z
      .string({ required_error: "Upload KTP wajib diisi" })
      .min(1, "Upload KTP wajib diisi"),

    dpp: z.string().optional(),
    dpc: z.string().optional(),
    kode_provinsi: z.string().optional(),
    kode_kabupaten: z.string().optional(),
    cabangUuid: z.string().optional(),
    kotaDomisili: z.string().optional(),
    tingkatPendidikan: z.string().optional(),
    pendidikanUuid: z.string().optional(),
    pekerjaan: z.string().optional(),
    pekerjaanUuid: z.string().optional(),
    minatBidang: z.string().optional(),
    bidangMinatUuid: z.string().optional(),
    motivasiBergabung: z.string().optional(),

    setujuKebenaranData: z
      .boolean({ required_error: "Persetujuan kebenaran data wajib diisi" })
      .refine((val) => val === true, "Anda harus menyetujui pernyataan kebenaran data"),

    setujuPengelolaanData: z
      .boolean({ required_error: "Persetujuan pengelolaan data UU PDP wajib diisi" })
      .refine((val) => val === true, "Anda harus menyetujui pengelolaan data pribadi (UU PDP)"),

    setujuKerahasiaanData: z
      .boolean({ required_error: "Persetujuan kerahasiaan data wajib diisi" })
      .refine((val) => val === true, "Anda harus menyetujui jaminan kerahasiaan data"),
  })
  .refine((data) => data.email.toLowerCase() === data.confirmEmail.toLowerCase(), {
    message: "Email konfirmasi akun tidak cocok dengan email pendaftaran",
    path: ["confirmEmail"],
  });

export type CreateRegistrasiInput = z.infer<typeof createRegistrasiSchema>;
