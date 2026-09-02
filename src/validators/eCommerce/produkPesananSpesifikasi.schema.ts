import { z } from "zod";

////////////////////////////////////////////////////
// BASE SCHEMA
////////////////////////////////////////////////////
const baseProdukPesananSpesifikasiSchema = z.object({
  produkPesananUuid: z.string().uuid(),

  spesifikasiUuid: z.string().uuid(),
  valueUuid: z.string().uuid(),

  // SNAPSHOT (WAJIB)
  namaSpesifikasi: z.string().min(1, "Nama spesifikasi wajib diisi"),
  namaValue: z.string().min(1, "Nama value wajib diisi"),
});

////////////////////////////////////////////////////
// CREATE (SUPPORT SINGLE & BULK)
////////////////////////////////////////////////////
export const createProdukPesananSpesifikasiSchema = z
  .any()
  .superRefine((val, ctx) => {
    const schema = z.union([
      baseProdukPesananSpesifikasiSchema,
      z.array(baseProdukPesananSpesifikasiSchema).min(1),
    ]);

    const res = schema.safeParse(val);
    if (!res.success) {
      res.error.issues.forEach((i) => ctx.addIssue(i));
    }
  });

////////////////////////////////////////////////////
// UPDATE (PARTIAL)
////////////////////////////////////////////////////
export const updateProdukPesananSpesifikasiSchema =
  baseProdukPesananSpesifikasiSchema.partial();
