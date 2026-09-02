import { createBaseController } from "./baseCrud.controller";

export const keranjangSpesifikasiController = createBaseController(
  {
    name: "keranjangSpesifikasi",
    fields: {},
  },
  {
    spesifikasi: true,
    value: true,
  }
);
