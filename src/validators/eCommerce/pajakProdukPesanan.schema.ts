import { z } from "zod";

const baseSchema = z.object({
  produkPesananUuid: z.string().uuid(),
  nama: z.string().min(2),
  rasio: z.number().min(0),
});

export const createPajakProdukPesananSchema = z.any().superRefine((val, ctx) => {
  const schema = z.union([baseSchema, z.array(baseSchema)]);
  const res = schema.safeParse(val);
  if (!res.success) res.error.issues.forEach(i => ctx.addIssue(i));
});

export const updatePajakProdukPesananSchema =
  baseSchema.partial();