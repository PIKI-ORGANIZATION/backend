import { createBaseController } from "./baseCrud.controller";

export const pembayaranController = {
  ...createBaseController(
    {
      name: "pembayaran",
      fields: {},
    },
    {
      pesanan: true,
    }
  ),
};
