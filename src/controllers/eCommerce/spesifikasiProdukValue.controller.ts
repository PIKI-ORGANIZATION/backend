import { createBaseController } from "./baseCrud.controller";

export const spesifikasiProdukValueController = createBaseController(
  {
    name: "spesifikasiProdukValue",
    fields: {
      namaValue: true,
    },
  }
);
