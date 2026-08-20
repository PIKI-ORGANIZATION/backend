import { z } from "zod";

////////////////////////////////////////////////////
// BASE SCHEMA
////////////////////////////////////////////////////
const baseKeranjangSpesifikasiSchema = z.object({
  keranjangUuid: z.string().uuid(),

  spesifikasiUuid: z.string().uuid(),

  valueUuid: z.string().uuid(),
});

////////////////////////////////////////////////////
// CREATE (SUPPORT SINGLE & BULK)
////////////////////////////////////////////////////
export const createKeranjangSpesifikasiSchema = z.any().superRefine((val, ctx) => {
  const schema = z.union([
    baseKeranjangSpesifikasiSchema,
    z.array(baseKeranjangSpesifikasiSchema).min(1),
  ]);

  const res = schema.safeParse(val);
  if (!res.success) {
    res.error.issues.forEach((i) => ctx.addIssue(i));
  }
});

////////////////////////////////////////////////////
// UPDATE (PARTIAL)
////////////////////////////////////////////////////
export const updateKeranjangSpesifikasiSchema =
  baseKeranjangSpesifikasiSchema.partial();