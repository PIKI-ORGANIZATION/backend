import { createBaseController } from "./baseCrud.controller";

export const pengaturanPesananController = {
  ...createBaseController(
    {
      name: "pengaturanPesanan",
      fields: {},
    }
  ),
};
