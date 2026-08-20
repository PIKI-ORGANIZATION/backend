import { z } from "zod";

const decimal = z.union([z.string(), z.number()]);

const baseSchema = z.object({
  produkUuid: z.string().uuid(),
  akunUuid: z.string().uuid().optional().nullable(),

  jumlah: z.number().int().min(1),
  totalHarga: decimal,

  spesifikasi: z.array(
    z.object({
      spesifikasiUuid: z.string().uuid(),
      valueUuid: z.string().uuid(),
    })
  ).optional(),
});

export const createKeranjangBelanjaSchema = z.any().superRefine((val, ctx) => {
  const schema = z.union([baseSchema, z.array(baseSchema)]);
  const res = schema.safeParse(val);
  if (!res.success) res.error.issues.forEach(i => ctx.addIssue(i));
});

export const updateKeranjangBelanjaSchema = baseSchema.partial();