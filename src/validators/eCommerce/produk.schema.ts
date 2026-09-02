import { z } from "zod";

const decimal = z.union([z.string(), z.number()]);

const baseProdukSchema = z.object({
  namaProduk: z.string().min(3),
  deskripsi: z.string().optional().nullable(),
  gambarProduk: z.string().optional().nullable(),

  harga: decimal,
  hargaAsli: decimal.optional().nullable(),
  diskonPersen: z.number().int().min(0).max(100).optional().nullable(),
  stok: z.number().int().min(0),

  statusProduk: z.enum([
    "ACTIVE",
    "INACTIVE",
    "OUT_OF_STOCK",
  ]).optional(),

  produkKategoriUuid: z.string().uuid(),
  anggotaUuid: z.string().uuid(),
});

export const createProdukSchema = z.any().superRefine((val, ctx) => {
  if (Array.isArray(val)) {
    const res = z.array(baseProdukSchema).min(1).safeParse(val);
    if (!res.success) res.error.issues.forEach(i => ctx.addIssue(i));
  } else {
    const res = baseProdukSchema.safeParse(val);
    if (!res.success) res.error.issues.forEach(i => ctx.addIssue(i));
  }
});

export const updateProdukSchema =
  baseProdukSchema.partial();
