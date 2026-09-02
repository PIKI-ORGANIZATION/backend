import { createBaseController } from "./baseCrud.controller";

export const keranjangBelanjaController = createBaseController(
  {
    name: "keranjangBelanja",
    fields: {},
  },
  {
    produk: true,
    spesifikasi: {
      include: {
        spesifikasi: true,
        value: true,
      },
    },
  }
);
