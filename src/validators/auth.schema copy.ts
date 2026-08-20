import { z } from "zod";
import is from "zod/v4/locales/is.js";

export const loginSchema = z.object({
  identifier: z.string().min(1, "Email atau username wajib diisi"),
  password: z.string().min(8, "Password minimal 8 karakter"),
  isFromAdmin: z.boolean().optional(), // Tambahkan field isFromAdmin sebagai string opsional
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  email: z.string().email("Format email tidak valid"),

  username: z
    .string()
    .min(4)
    .max(20)
    .regex(/^[a-zA-Z0-9._]+$/, "Username tidak valid"),

  password: z.string().min(8, "Password minimal 8 karakter"),

  namaLengkap: z.string().min(3, "Nama lengkap wajib diisi"),
  namaPanggil: z.string().optional(),
  tempatLahir: z.string().optional(),
  tanggalLahir: z.string().datetime().or(z.string()).optional(), // allow ISO string or normal string
  alamat: z.string().optional(),
  pendidikan: z.string().optional(),
  pekerjaan: z.string().optional(),
  pesanKesan: z.string().max(1000).optional(),

  cabangUuid: z.string().uuid("Cabang tidak valid"),

  angkatan: z.string().optional(),
  bidangStudi: z.string().optional(),
  bidangMinat: z.string().optional(),

  profileImg: z.string().url().optional(),
  noWa: z.string().optional(),
  instagram: z.string().optional(),
  facebook: z.string().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const verifyEmailSchema = z.object({
  token: z.string().min(1, "Token wajib diisi"),
});
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;

export const resendEmailSchema = z.object({
  email: z.string().email("Format email tidak valid"),
});
export type ResendEmailInput = z.infer<typeof resendEmailSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email("Format email tidak valid"),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token wajib diisi"),
  password: z.string().min(8, "Password minimal 8 karakter"),
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;