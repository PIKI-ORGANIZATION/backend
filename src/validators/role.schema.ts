import { z } from "zod";

export const createRoleSchema = z.object({
  nama: z.string().min(1, "Nama role wajib diisi"),
  deskripsi: z.string().optional(),
  permissionUuids: z.array(z.string().uuid()).optional(),
});

export type CreateRoleInput = z.infer<typeof createRoleSchema>;

export const updateRoleSchema = z.object({
  nama: z.string().min(1, "Nama role wajib diisi").optional(),
  deskripsi: z.string().optional(),
  status: z.string().refine((value) => ["ACTIVE", "INACTIVE", ""].includes(value), {
    message: "Status role harus 'ACTIVE' atau 'INACTIVE'",
  }).optional(),
  permissionUuids: z.array(z.string().uuid()).optional(),
});

export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
