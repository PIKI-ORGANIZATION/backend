import { createBaseController } from "./baseCrud.controller";

export const produkPesananController = {
  ...createBaseController(
    {
      name: "produkPesanan",
      fields: {},
    },
    {
      produk: true,
      spesifikasi: true,
      pajak: true,
    }
  ),
};
