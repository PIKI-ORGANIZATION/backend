import { createBaseController } from "./baseCrud.controller";

export const spesifikasiProdukController = createBaseController(
  {
    name: "spesifikasiProduk",
    fields: {
      namaSpesifikasi: true,
    },
  },
  {
    values: true,
  }
);