import { createBaseController } from "./baseCrud.controller";
import { prisma } from "../../config/prisma";
import { Request, Response } from "express";
import { ApiResponse } from "../../utils/apiResponse";

const base = createBaseController(
  {
    name: "ulasanProduk",
    fields: {},
  },
  {
    akun: true,
    produkPesanan: true,
  }
);

export const ulasanProdukController = {
  ...base,

  // ================= CUSTOM CREATE =================
  create: async (req: Request, res: Response) => {
    try {
      const payload = req.body;

      const dataArray = Array.isArray(payload) ? payload : [payload];

      // VALIDASI 1 REVIEW PER PESANAN
      for (const item of dataArray) {
        const existing = await prisma.ulasanProduk.findUnique({
          where: {
            produkPesananUuid: item.produkPesananUuid,
          },
        });

        if (existing) {
          return res.status(400).json({
            message: `Produk pesanan ${item.produkPesananUuid} sudah direview`,
          });
        }
      }

      // OPTIONAL: override akunUuid dari token (lebih aman)
      const userUuid = req.user?.sub;

      const finalData = dataArray.map((item) => ({
        ...item,
        akunUuid: userUuid || item.akunUuid,
      }));

      const created = await prisma.ulasanProduk.createMany({
        data: finalData,
      });

      return res.status(201).json(
        ApiResponse.success({
          message: "Ulasan berhasil dibuat",
          result: created,
        })
      );
    } catch (error: any) {

      // HANDLE UNIQUE ERROR (fallback)
      if (error.code === "P2002") {
        return res.status(400).json({
          message: "Produk pesanan sudah direview",
        });
      }

      return res.status(500).json({
        message: "Gagal membuat ulasan",
        error: error.message,
      });
    }
  },
};