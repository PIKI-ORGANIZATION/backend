// import { z } from "zod";

// const decimal = z.union([z.string(), z.number()]);

// const baseSchema = z.object({
//   seniorUuid: z.string().uuid(),
//   akunUuid: z.string().uuid().optional().nullable(),

//   namaPenerima: z.string().min(3),
//   alamat: z.string().min(5),
//   noHp: z.string().min(8),
//   email: z.string().email(),
//   kodePos: z.string(),
//   kota: z.string(),

//   statusPesanan: z.enum([
//     "WAITING_PAYMENT",
//     "WAITING_CONFIRMATION",
//     "SENDING",
//     "SENT",
//     "COMPLETED",
//     "CANCELED",
//   ]),

//   statusBayar: z.enum(["PENDING", "PAID"]),

//   ////////////////////////////////////////////////////
//   // USER INPUT (BOLEH)
//   ////////////////////////////////////////////////////
//   subtotal: decimal,
//   diskonTotal: decimal,
//   pajakTotal: decimal,

//   ////////////////////////////////////////////////////
//   // ONGKIR (BOLEH DIISI SELLER / OPTIONAL)
//   ////////////////////////////////////////////////////
//   ongkir: decimal.optional().default(0),

//   produkPesanan: z.array(
//     z.object({
//       produkUuid: z.string().uuid(),
//       jumlah: z.number().int().min(1),
//       harga: decimal,
//       diskon: decimal,
//     })
//   ).min(1),
// });

// // export const createPesananSchema = z.any().superRefine((val, ctx) => {
// //   const schema = z.union([baseSchema, z.array(baseSchema)]);
// //   const res = schema.safeParse(val);
// //   if (!res.success) res.error.issues.forEach(i => ctx.addIssue(i));
// // });

// export const createPesananSchema = z.union([
//   baseSchema,
//   z.array(baseSchema),
// ]);

// export const updatePesananSchema = baseSchema.partial();



// ////////////////////////////////////////
// ///////////////////////////////////////

import { z } from "zod";

const decimal = z.union([
  z.string(),
  z.number(),
]);

const baseSchema = z.object({
  seniorUuid: z.string().uuid(),

  akunUuid: z.string()
    .uuid()
    .optional()
    .nullable(),

  namaPenerima: z.string().min(3),

  alamat: z.string().min(5),

  noHp: z.string().min(8),

  email: z.string().email(),

  kodePos: z.string(),

  kota: z.string(),

  statusPesanan: z.enum([
    "WAITING_ONGKIR",
    "WAITING_CONFIRMATION",
    "DELIVERING",
    "COMPLETED",
    "CANCELED",
  ]).optional(),

  statusPembayaran: z.enum([
    "PENDING",
    "PAID",
    "CANCELED",
    "REFUNDED",
    "SELLER_PAID",
  ]).optional(),

  nomorResi: z.string().optional().nullable(),
  jasaPengiriman: z.string().optional().nullable(),

  diskonTotal: decimal
    .optional()
    .default(0),

  pajakTotal: decimal
    .optional()
    .default(0),

  ongkir: decimal
    .optional()
    .default(0),

  produkPesanan: z.array(
    z.object({
      produkUuid: z.string().uuid(),

      jumlah: z.number()
        .int()
        .min(1),

      diskon: decimal
        .optional()
        .default(0),
    })
  ).min(1),
});

export const createPesananSchema =
  baseSchema;

export const updatePesananSchema =
  baseSchema.partial();