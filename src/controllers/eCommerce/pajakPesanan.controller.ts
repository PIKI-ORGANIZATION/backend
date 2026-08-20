import { createBaseController } from "./baseCrud.controller";

export const pajakPesananController = createBaseController(
  {
    name: "pajakPesanan",
    fields: {
      nama: true,
    },
  }
);