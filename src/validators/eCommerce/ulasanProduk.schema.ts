import { z } from "zod";

const baseSchema = z.object({
  akunUuid: z.string().uuid(),
  produkPesananUuid: z.string().uuid(),

  rating: z.number().int().min(1).max(5),
  komentar: z.string().optional().nullable(),
});

export const createUlasanProdukSchema = z.any().superRefine((val, ctx) => {
  const schema = z.union([baseSchema, z.array(baseSchema)]);
  const res = schema.safeParse(val);
  if (!res.success) res.error.issues.forEach(i => ctx.addIssue(i));
});

export const updateUlasanProdukSchema = baseSchema.partial();