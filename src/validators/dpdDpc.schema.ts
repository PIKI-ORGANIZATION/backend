import { z } from "zod";

export const dpdDpcSchema = z.object({
  dpd: z.string().optional(),
  dpc: z.string().optional(),
  kode_provinsi: z.string().optional(),
  kode_kabupaten: z.string().optional(),
  pengurus: z.string().optional().nullable(),
  no_handphone: z.string().optional().nullable(),
  keterangan: z.string().optional().nullable(),
  penerbitan_sk: z.string().optional().nullable(),
});

export const updateDpdDpcSchema = dpdDpcSchema.partial();

export type DpdDpcInput = z.infer<typeof dpdDpcSchema>;
export type UpdateDpdDpcInput = z.infer<typeof updateDpdDpcSchema>;
