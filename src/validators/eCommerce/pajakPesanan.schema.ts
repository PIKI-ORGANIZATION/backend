import { z } from "zod";

const baseSchema = z.object({
  pesananUuid: z.string().uuid(),
  nama: z.string().min(2),
  rasio: z.number().min(0),
});

export const createPajakPesananSchema = z.any().superRefine((val, ctx) => {
  const schema = z.union([baseSchema, z.array(baseSchema)]);
  const res = schema.safeParse(val);
  if (!res.success) res.error.issues.forEach(i => ctx.addIssue(i));
});

export const updatePajakPesananSchema =
  baseSchema.partial();
