import { createBaseController } from "./baseCrud.controller";

export const pajakProdukPesananController = {
  ...createBaseController(
    {
      name: "pajakProdukPesanan",
      fields: { nama: true },
    }
  ),
};