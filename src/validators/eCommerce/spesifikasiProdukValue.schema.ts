import { z } from "zod";

const baseSchema = z.object({
  namaValue: z.string().min(1),
  spesifikasiUuid: z.string().uuid(),
});

export const createSpesifikasiProdukValueSchema = z.any().superRefine((val, ctx) => {
  const schema = z.union([baseSchema, z.array(baseSchema)]);
  const res = schema.safeParse(val);
  if (!res.success) res.error.issues.forEach(i => ctx.addIssue(i));
});

export const updateSpesifikasiProdukValueSchema =
  baseSchema.partial();
