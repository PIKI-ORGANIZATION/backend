import { createBaseController } from "./baseCrud.controller";

export const produkKategoriController = createBaseController(
  {
    name: "produkKategori",
    fields: {
      namaKategori: true,
    },
  },
  {
    produk: true,
  }
);
