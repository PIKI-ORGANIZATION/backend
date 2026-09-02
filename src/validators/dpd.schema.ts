import { z } from "zod";

export const dpdSchema = z.object({
  kodeProvinsi: z.string().optional(),
  dpd: z.string().optional(),
  pengurus: z.string().optional().nullable(),
  noHandphone: z.string().optional().nullable(),
  keterangan: z.string().optional().nullable(),
  penerbitanSk: z.string().optional().nullable(),
});

export const updateDpdSchema = dpdSchema.partial();

export type DpdInput = z.infer<typeof dpdSchema>;
export type UpdateDpdInput = z.infer<typeof updateDpdSchema>;
