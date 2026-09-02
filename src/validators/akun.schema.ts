import { z } from "zod";

const akunSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  username: z.string().min(3, "Username minimal 3 karakter"),
  password: z.string().min(8, "Password minimal 8 karakter"),
  anggotaUuid: z.string().uuid("Anggota UUID tidak valid"),
  roleUuids: z.array(z.string().uuid()).optional(),
});

export const createAkunSchema = akunSchema;

export type CreateAkunInput = z.infer<typeof createAkunSchema>;

export const updateAkunSchema = z.object({
  email: z.string().email("Format email tidak valid").optional(),
  username: z.string().min(3).optional(),
  password: z.string().min(8).optional(),
  statusAkun: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  roleUuids: z.array(z.string().uuid()).optional(),
});

export type UpdateAkunInput = z.infer<typeof updateAkunSchema>;
