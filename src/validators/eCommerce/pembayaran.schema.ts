import { z } from "zod";

const decimal = z.union([z.string(), z.number()]);

const baseSchema = z.object({
  pesananUuid: z.string().uuid(),

  metode: z.enum([
    "TRANSFER_BANK",
    "CASH",
    "E_WALLET",
  ]),

  namaPengirim: z.string().optional().nullable(),
  bankPengirim: z.string().optional().nullable(),

  jumlahBayar: decimal,

  urlBuktiPembayaran: z.string().url().optional().nullable(),

  nomorReferensi: z.string().optional().nullable(),

  tanggalBayar: z.coerce.date().optional(),

  status: z.enum(["PENDING", "PAID"]).optional(),
});

export const createPembayaranSchema = z.any().superRefine((val, ctx) => {
  const schema = z.union([baseSchema, z.array(baseSchema)]);
  const res = schema.safeParse(val);
  if (!res.success) res.error.issues.forEach(i => ctx.addIssue(i));
});

export const updatePembayaranSchema =
  baseSchema.partial();