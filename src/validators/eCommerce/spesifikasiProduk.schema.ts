import { z } from "zod";

const baseSchema = z.object({
  namaSpesifikasi: z.string().min(2),
  produkUuid: z.string().uuid(),
});

export const createSpesifikasiProdukSchema = z.any().superRefine((val, ctx) => {
  const schema = z.union([baseSchema, z.array(baseSchema)]);
  const res = schema.safeParse(val);
  if (!res.success) res.error.issues.forEach(i => ctx.addIssue(i));
});

export const updateSpesifikasiProdukSchema = baseSchema.partial();
