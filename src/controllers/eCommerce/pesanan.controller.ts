import { Request, Response } from "express";
import { prisma } from "../../config/prisma";
import { ApiResponse } from "../../utils/apiResponse";
import { Prisma, StatusOrder, StatusPembayaran } from "@prisma/client";
import { orderQueue } from "../../queue/pesanan.queue";

import {
  sendCheckoutInvoiceEmail,
  sendSellerNewOrderEmail,
  sendFinalInvoiceEmail,
  sendPaymentSuccessEmail,
  sendSellerPaymentNotificationEmail,
  sendShippingEmail,
  sendOrderCompletedEmail,
  sendOrderCanceledEmail,
  sendTrackingStatusEmail,
  sendAdminOrderNotificationEmail,
} from "../../config/email";

import {
  getAdminFeePercent,
  getAdminEmailRecipients,
  getAdminBankAccount,
} from "../../helpers/pageSettingHelper";

export const pesananController = {

  // ================= GET ALL =================
  async getAll(req: Request, res: Response) {
    try {
      const data = await prisma.pesanan.findMany({
        include: {
          senior: true,
          akun: true,

          produkPesanan: {
            include: {
              produk: true,
              spesifikasi: true,
              pajak: true,
            },
          },

          pembayaran: true,
        },
      });

      return res.json(ApiResponse.success({ result: data }));
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  },

  // ================= GET BY ID =================
  async getById(req: Request, res: Response) {
    try {
      const { uuid } = req.params;

      const data = await prisma.pesanan.findUnique({
        where: { uuid },

        include: {
          senior: true,
          akun: true,

          produkPesanan: {
            include: {
              produk: true,
              spesifikasi: true,
            },
          },

          pembayaran: true,
        },
      });

      if (!data) {
        return res.status(404).json({
          message: "Not found",
        });
      }

      return res.json(ApiResponse.success({ result: data }));
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  },

  // ================= GET BY SENIOR =================
  async getBySenior(req: Request, res: Response) {
    try {
      const { seniorUuid } = req.params;

      const { status, currentPage, pageSize } = req.query as any;

      const page = Number(currentPage) || 1;
      const size = Number(pageSize) || 10;
      const skip = (page - 1) * size;

      let where: any = {
        seniorUuid,
      };

      if (status) {
        where.statusPesanan = status;
      }

      const total = await prisma.pesanan.count({ where });

      const data = await prisma.pesanan.findMany({
        where,

        include: {
          senior: true,
          akun: true,

          produkPesanan: {
            include: {
              produk: true,
              spesifikasi: true,
              pajak: true,
            },
          },

          pembayaran: true,
        },

        orderBy: {
          created_at: "desc",
        },

        skip,
        take: size,
      });

      return res.json(
        ApiResponse.success({
          result: data,

          pagination: {
            currentPage: page,
            pageSize: size,
            total,
          },
        })
      );
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  },

  // ================= CREATE =================
  async create(req: Request, res: Response) {
    try {
      const body = req.body;

      const result = await prisma.$transaction(async (tx) => {

        // ================= BUILD PRODUK PESANAN =================
          const produkPesananData = await Promise.all(
            body.produkPesanan.map(async (item: any) => {

              const produk = await tx.produk.findUnique({
                where: {
                  uuid: item.produkUuid,
                },
              });

              if (!produk) {
                throw new Error("Produk tidak ditemukan");
              }

              const harga = Number(produk.harga);
              const jumlah = Number(item.jumlah);
              const diskon = Number(item.diskon || 0);

              const subtotalItem =
                harga * jumlah - diskon;

              return {
                produkUuid: item.produkUuid,
                jumlah,
                harga,
                diskon,
                subtotal: subtotalItem,
                pajakTotal: 0,
                total: subtotalItem,
                spesifikasi: item.spesifikasi ? {
                  create: item.spesifikasi.map((spec: any) => ({
                    spesifikasiUuid: spec.spesifikasiUuid,
                    valueUuid: spec.valueUuid,
                    namaSpesifikasi: spec.namaSpesifikasi,
                    namaValue: spec.namaValue,
                  }))
                } : undefined
              };
            })
          );

        // ================= HITUNG TOTAL =================
        const subtotal = produkPesananData.reduce(
          (acc, item) => acc + item.subtotal,
          0
        );

        const diskonTotal = Number(body.diskonTotal || 0);
        const pajakTotal = Number(body.pajakTotal || 0);
        const ongkir = Number(body.ongkir || 0);

        // Dynamic admin fee from page settings
        const feeRate = await getAdminFeePercent();
        const biayaLayanan = subtotal * feeRate;

        const total =
          subtotal -
          diskonTotal +
          pajakTotal +
          ongkir +
          biayaLayanan;

        // ================= CREATE PESANAN =================
        const created = await tx.pesanan.create({
          data: {
            seniorUuid: body.seniorUuid,
            akunUuid: body.akunUuid,

            namaPenerima: body.namaPenerima,
            alamat: body.alamat,
            noHp: body.noHp,
            email: body.email,
            kodePos: body.kodePos,
            kota: body.kota,

            statusPesanan:
              body.statusPesanan ?? "WAITING_ONGKIR",

            statusPembayaran:
              body.statusPembayaran ?? "PENDING",

            subtotal,
            diskonTotal,
            pajakTotal,
            ongkir,
            biayaLayanan,
            total,

            produkPesanan: {
              create: produkPesananData,
            },
          },

          include: {
            senior: {
              include: {
                akun: true,
              },
            },

            akun: true,
          },
        });

        return created;
      });

      // =================================================
      // EMAIL KE PEMBELI
      // =================================================
    //   console.log("Result pesanan:", result.email);
      if (result.email) {
        // console.log("EMAIL PEMBELI:", result.email);
        sendCheckoutInvoiceEmail(
            result.email,
            result.namaPenerima,
            result.uuid,
            Number(result.subtotal).toFixed(2),
            Number(result.biayaLayanan).toFixed(2),
            Number(result.pajakTotal).toFixed(2),
            Number(result.total).toFixed(2)
        ).catch((err) =>
            console.error("Checkout email gagal:", err)
        );
      }

      // =================================================
      // EMAIL KE PENJUAL
      // =================================================
      const sellerEmail =
        result?.senior?.akun?.email;

      if (sellerEmail) {
        sendSellerNewOrderEmail(
          sellerEmail,
          result?.senior?.akun?.nama || "Penjual",
          result.uuid
        ).catch((err) =>
          console.error("Seller new order email gagal:", err)
        );

        // =================================================
        // AUTO ONGKIR GRATIS (2x24 JAM)
        // =================================================
        await orderQueue.add(
            "AUTO_FREE_ONGKIR",
            {
                pesananUuid: result.uuid,
            },
            {
                jobId: `AUTO_FREE_ONGKIR${result.uuid}`,
                delay: 2 * 24 * 60 * 60 * 1000, // 2 hari
                removeOnComplete: true,
                removeOnFail: true,
            }
        );
      }

      // =================================================
      // EMAIL KE ADMIN E-COMMERCE
      // =================================================
      try {
        const adminEmails = await getAdminEmailRecipients();
        sendAdminOrderNotificationEmail(
          adminEmails,
          result.uuid,
          "NEW_ORDER"
        ).catch((err) =>
          console.error("Admin order notification email gagal:", err)
        );
      } catch (adminErr) {
        console.error("ADMIN EMAIL GAGAL:", adminErr);
      }

      return res.status(201).json(
        ApiResponse.success({
          message: "Pesanan created",
          result,
        })
      );

    } catch (err: any) {
      res.status(500).json({
        message: err.message,
      });
    }
  },

  // ================= UPDATE =================
  async update(req: Request, res: Response) {
    try {

      const { uuid } = req.params;
      const body = req.body;

      const existing = await prisma.pesanan.findUnique({
        where: { uuid },

        include: {
          senior: {
            include: {
              akun: true,
            },
          },

          akun: true,
        },
      });

      if (!existing) {
        return res.status(404).json({
          message: "Not found",
        });
      }

      // ================= HITUNG ULANG =================
      const subtotal =
        Number(body.subtotal ?? existing.subtotal);

      const diskonTotal =
        Number(body.diskonTotal ?? existing.diskonTotal);

      const pajakTotal =
        Number(body.pajakTotal ?? existing.pajakTotal);

      const ongkir =
        Number(body.ongkir ?? existing.ongkir ?? 0);

      // Dynamic admin fee from page settings
      const feeRate = await getAdminFeePercent();
      const biayaLayanan =
        subtotal * feeRate;

      const total =
        subtotal -
        diskonTotal +
        pajakTotal +
        biayaLayanan +
        ongkir;

      // ================= UPDATE =================
      const data = await prisma.pesanan.update({
        where: { uuid },

        data: {
            ...body,

            statusPesanan: body.statusPesanan
                ? body.statusPesanan
                : (body.ongkir !== undefined && Number(body.ongkir) !== Number(existing.ongkir)
                    ? "WAITING_CONFIRMATION"
                    : existing.statusPesanan),

            biayaLayanan,
            ongkir,
            total,
        },
      });

      // =================================================
      // EMAIL FINAL INVOICE
      // =================================================
      if (
        body.ongkir !== undefined &&
        Number(body.ongkir) !== Number(existing.ongkir)
      ) {

        // Fetch admin bank account for the invoice
        getAdminBankAccount().then((rekening) => {
          sendFinalInvoiceEmail(
            existing.email,
            existing.namaPenerima,
            existing.uuid,
            Number(ongkir).toFixed(2),
            Number(total).toFixed(2),
            rekening
          ).catch((err) =>
            console.error("Final invoice email gagal:", err)
          );
        }).catch((err) => console.error("Failed to get rekening:", err));

        // =================================================
        // AUTO CANCEL JIKA TIDAK BAYAR 1x24 JAM
        // =================================================
        await orderQueue.add(
        "AUTO_CANCEL_UNPAID",
        {
            pesananUuid: existing.uuid,
        },
        {
            jobId: `AUTO_CANCEL_UNPAID${existing.uuid}`,
            delay: 1 * 24 * 60 * 60 * 1000,
            removeOnComplete: true,
            removeOnFail: true,
        }
        );
      }

      // =================================================
      // EMAIL PEMBAYARAN BERHASIL
      // =================================================
      if (
        body.statusPembayaran === "PAID" &&
        existing.statusPembayaran !== "PAID"
      ) {

        sendPaymentSuccessEmail(
          existing.email,
          existing.namaPenerima,
          existing.uuid,
          Number(total).toFixed(2)
        ).catch((err) =>
          console.error("Payment success email gagal:", err)
        );

        // =============================================
        // EMAIL KE PENJUAL
        // =============================================
        const sellerEmail =
          existing?.senior?.akun?.email;

        if (sellerEmail) {

          sendSellerPaymentNotificationEmail(
            sellerEmail,
            existing?.senior?.akun?.nama || "Penjual",
            existing.uuid
          ).catch((err) =>
            console.error("Seller payment notification email gagal:", err)
          );
        }

        // Admin notification
        try {
          const adminEmails = await getAdminEmailRecipients();
          sendAdminOrderNotificationEmail(
            adminEmails,
            existing.uuid,
            "PAYMENT_RECEIVED"
          ).catch((err) =>
            console.error("Admin order notification email gagal:", err)
          );
        } catch (adminErr) {
          console.error("ADMIN EMAIL GAGAL:", adminErr);
        }
      }

      // =================================================
      // EMAIL PENGIRIMAN
      // =================================================
      if (
        body.nomorResi &&
        body.nomorResi !== existing.nomorResi
      ) {

        sendShippingEmail(
          existing.email,
          existing.namaPenerima,
          existing.uuid,
          body.nomorResi
        ).catch((err) =>
          console.error("Shipping email gagal:", err)
        );

        // =================================================
        // AUTO COMPLETE ORDER 3x24 JAM
        // =================================================
        await orderQueue.add(
        "AUTO_COMPLETE_ORDER",
        {
            pesananUuid: existing.uuid,
        },
        {
            jobId: `AUTO_COMPLETE_ORDER_${existing.uuid}`,
            // delay: 3 * 24 * 60 * 60 * 1000,
            delay: 7 * 24 * 60 * 60 * 1000, // 7 hari untuk jaga-jaga kalau pengiriman lama
            removeOnComplete: true,
            removeOnFail: true,
        }
        );
      }

      // =================================================
      // TRACKING STATUS EMAIL
      // =================================================
      if (
        body.statusPesanan &&
        body.statusPesanan !== existing.statusPesanan
      ) {

        sendTrackingStatusEmail(
          existing.email,
          existing.namaPenerima,
          existing.uuid,
          body.statusPesanan,
          body.nomorResi || existing.nomorResi || undefined,
          body.keterangan || undefined
        ).catch((err) =>
          console.error("Tracking status email gagal:", err)
        );
      }

      // =================================================
      // PESANAN SELESAI
      // =================================================
      if (
        body.statusPesanan === "COMPLETED" &&
        existing.statusPesanan !== "COMPLETED"
      ) {

        sendOrderCompletedEmail(
          existing.email,
          existing.namaPenerima,
          existing.uuid
        ).catch((err) =>
          console.error("Order completed email gagal:", err)
        );

        // =================================================
        // AUTO GIVE RATING
        // =================================================
        await orderQueue.add(
        "AUTO_GIVE_RATING",
        {
            pesananUuid: existing.uuid,
        },
        {
            jobId: `AUTO_GIVE_RATING_${existing.uuid}`,
            delay: 3 * 24 * 60 * 60 * 1000,
            removeOnComplete: true,
            removeOnFail: true,
        }
        );

        // Admin notification — transaction complete, process payout
        try {
          const adminEmails = await getAdminEmailRecipients();
          sendAdminOrderNotificationEmail(
            adminEmails,
            existing.uuid,
            "ORDER_COMPLETED"
          ).catch((err) =>
            console.error("Admin order notification email gagal:", err)
          );
        } catch (adminErr) {
          console.error("ADMIN EMAIL GAGAL:", adminErr);
        }
      }

      // =================================================
      // PESANAN DIBATALKAN
      // =================================================
      if (
        body.statusPesanan === "CANCELED" &&
        existing.statusPesanan !== "CANCELED"
      ) {

        sendOrderCanceledEmail(
          existing.email,
          existing.namaPenerima,
          existing.uuid,
          body.alasanPembatalan || "Pesanan dibatalkan"
        ).catch((err) =>
          console.error("Order canceled email gagal:", err)
        );

        // Admin notification
        try {
          const adminEmails = await getAdminEmailRecipients();
          sendAdminOrderNotificationEmail(
            adminEmails,
            existing.uuid,
            "ORDER_CANCELED",
            body.alasanPembatalan || "Pesanan dibatalkan"
          ).catch((err) =>
            console.error("Admin order notification email gagal:", err)
          );
        } catch (adminErr) {
          console.error("ADMIN EMAIL GAGAL:", adminErr);
        }
      }

      return res.json(
        ApiResponse.success({
          message: "Pesanan updated",
          result: data,
        })
      );

    } catch (err: any) {
      res.status(500).json({
        message: err.message,
      });
    }
  },

  // ================= GET MY PESANAN =================
  async getMyPesanan(req: Request, res: Response) {
    try {
      const { status, currentPage, pageSize } = req.query as any;

      const page = Number(currentPage) || 1;
      const size = Number(pageSize) || 10;
      const skip = (page - 1) * size;

      if (!req.user?.sub) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const akun = await prisma.akun.findUnique({
        where: { uuid: req.user.sub },
        select: { seniorUuid: true },
      });

      if (!akun || !akun.seniorUuid) {
        return res.status(403).json({ message: "Akun ini tidak terkait dengan senior" });
      }

      let where: any = {
        seniorUuid: akun.seniorUuid,
      };

      if (status) {
        where.statusPesanan = status;
      }

      const total = await prisma.pesanan.count({ where });

      const data = await prisma.pesanan.findMany({
        where,
        include: {
          senior: true,
          akun: true,
          produkPesanan: {
            include: { produk: true, spesifikasi: true, pajak: true },
          },
          pembayaran: true,
        },
        orderBy: {
          created_at: "desc",
        },
        skip,
        take: size,
      });

      return res.json(
        ApiResponse.success({
          result: data,
          pagination: { currentPage: page, pageSize: size, total },
        })
      );
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  },
};
