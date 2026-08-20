import { createBaseController } from "./baseCrud.controller";

export const produkPesananSpesifikasiController = {
  ...createBaseController(
    {
      name: "produkPesananSpesifikasi",
      fields: {},
    }
  ),
};