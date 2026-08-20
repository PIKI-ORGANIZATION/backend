import { z } from "zod";

const decimal = z.union([z.string(), z.number()]);

const baseSchema = z.object({
  pesananUuid: z.string().uuid(),
  produkUuid: z.string().uuid(),

  jumlah: z.number().int().min(1),

  harga: decimal,
  diskon: decimal,
  subtotal: decimal,
  pajakTotal: decimal,
  total: decimal,
});

export const createProdukPesananSchema = z.any().superRefine((val, ctx) => {
  const schema = z.union([baseSchema, z.array(baseSchema)]);
  const res = schema.safeParse(val);
  if (!res.success) res.error.issues.forEach(i => ctx.addIssue(i));
});

export const updateProdukPesananSchema =
  baseSchema.partial();