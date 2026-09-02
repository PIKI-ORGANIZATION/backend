import { z } from "zod";

export const uuidParamSchema = z.object({
  uuid: z.string().uuid(),
});

const baseProdukKategoriSchema = z.object({
  namaKategori: z.string().min(3),
  tipeProduk: z.enum(["JASA", "PRODUK_FISIK"]).optional(),
});

export const createProdukKategoriSchema = z.any().superRefine((val, ctx) => {
  const schema = z.union([
    baseProdukKategoriSchema,
    z.array(baseProdukKategoriSchema).min(1),
  ]);

  const res = schema.safeParse(val);
  if (!res.success) res.error.issues.forEach(i => ctx.addIssue(i));
});

export const updateProdukKategoriSchema =
  baseProdukKategoriSchema.partial();

export type CreateProdukKategoriInput =
  z.infer<typeof createProdukKategoriSchema>;
