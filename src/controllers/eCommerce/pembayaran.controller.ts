import { Request, Response } from "express";
import { prisma } from "../../config/prisma";
import { ApiResponse } from "../../utils/apiResponse";
import { createBaseController } from "./baseCrud.controller";
import { orderQueue } from "../../queue/pesanan.queue";

import {
  sendPaymentSuccessEmail,
  sendSellerPaymentNotificationEmail,
  sendTrackingStatusEmail,
  sendAdminOrderNotificationEmail,
} from "../../config/email";

import { getAdminEmailRecipients } from "../../helpers/pageSettingHelper";

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

  // =========================================
  // CREATE PEMBAYARAN + EMAIL
  // =========================================
  async create(req: Request, res: Response) {
    try {
      const body = req.body;

      const result = await prisma.pembayaran.create({
        data: body,
        include: {
          pesanan: {
            include: {
              senior: true,
            },
          },
        },
      });

      // =========================================
      // UPDATE STATUS PESANAN
      // =========================================
      await prisma.pesanan.update({
        where: {
          uuid: body.pesananUuid,
        },
        data: {
          statusPembayaran: "PENDING",
          statusPesanan: "WAITING_CONFIRMATION",
        },
      });

      const pesanan = result.pesanan;

      // =========================================
      // EMAIL KE PEMBELI
      // =========================================
      if (pesanan?.email) {
        try {
          await sendPaymentSuccessEmail(
            pesanan.email,
            pesanan.namaPenerima,
            pesanan.uuid,
            Number(result.nominal || 0).toLocaleString("id-ID")
          );
        } catch (emailErr) {
          console.error("EMAIL PEMBELI GAGAL:", emailErr);
        }
      }

      // =========================================
      // EMAIL KE PENJUAL
      // =========================================
      if (pesanan?.senior?.email) {
        try {
          await sendSellerPaymentNotificationEmail(
            pesanan.senior.email,
            pesanan.senior.nama,
            pesanan.uuid
          );
        } catch (emailErr) {
          console.error("EMAIL PENJUAL GAGAL:", emailErr);
        }
      }

      // =========================================
      // EMAIL TRACKING STATUS
      // =========================================
      if (pesanan?.email) {
        try {
          await sendTrackingStatusEmail(
            pesanan.email,
            pesanan.namaPenerima,
            pesanan.uuid,
            "WAITING_CONFIRMATION",
            undefined,
            "Pembayaran sedang diverifikasi oleh admin."
          );
        } catch (emailErr) {
          console.error("EMAIL TRACKING GAGAL:", emailErr);
        }
      }

      // =========================================
      // EMAIL KE ADMIN E-COMMERCE
      // =========================================
      try {
        const adminEmails = await getAdminEmailRecipients();
        await sendAdminOrderNotificationEmail(
          adminEmails,
          pesanan.uuid,
          "PAYMENT_RECEIVED"
        );

        // =================================================
        // AUTO CANCEL JIKA TIDAK INPUT RESI
        // =================================================
        // await orderQueue.add(
        // "AUTO_CANCEL_NO_RESI",
        // {
        //     pesananUuid: pesanan.uuid,
        // },
        // {
        //     jobId: `AUTO_CANCEL_NO_RESI${pesanan.uuid}`,
        //     delay: 1 * 24 * 60 * 60 * 1000,
        //     removeOnComplete: true,
        //     removeOnFail: true,
        // }
        // );
      } catch (adminErr) {
        console.error("ADMIN EMAIL GAGAL:", adminErr);
      }

      return res.status(201).json(
        ApiResponse.success({
          message: "Pembayaran berhasil dibuat",
          result,
        })
      );
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  },

  // =========================================
  // UPDATE PEMBAYARAN
  // =========================================
  async update(req: Request, res: Response) {
    try {
      const { uuid } = req.params;
      const body = req.body;

      const existing = await prisma.pembayaran.findUnique({
        where: { uuid },
        include: {
          pesanan: {
            include: {
              senior: true,
            },
          },
        },
      });

      if (!existing) {
        return res.status(404).json({
          success: false,
          message: "Pembayaran tidak ditemukan",
        });
      }

      const result = await prisma.pembayaran.update({
        where: { uuid },
        data: body,
        include: {
          pesanan: {
            include: {
              senior: true,
            },
          },
        },
      });

      const pesanan = result.pesanan;

      // =========================================
      // JIKA PEMBAYARAN BERHASIL
      // =========================================
      if (
        body.statusPembayaran &&
        body.statusPembayaran !== existing.status
      ) {
        // PAYMENT SUCCESS
        if (body.statusPembayaran === "PAID") {

        // =========================================
        // UPDATE STATUS PESANAN
        // =========================================
        await prisma.pesanan.update({
            where: {
            uuid: pesanan.uuid,
            },
            data: {
            statusPembayaran: "PAID",
            statusPesanan: "DELIVERING",
            },
        });

        // =========================================
        // AUTO CANCEL JIKA TIDAK INPUT RESI 1x24 JAM
        // =========================================
        await orderQueue.add(
            "AUTO_CANCEL_NO_RESI",
            {
            pesananUuid: pesanan.uuid,
            },
            {
            jobId: `AUTO_CANCEL_NO_RESI_${pesanan.uuid}`,
            delay: 1 * 24 * 60 * 60 * 1000,
            removeOnComplete: true,
            removeOnFail: true,
            }
        );

        // =========================================
        // EMAIL PEMBELI
        // =========================================
        if (pesanan?.email) {
            sendPaymentSuccessEmail(
            pesanan.email,
            pesanan.namaPenerima,
            pesanan.uuid,
            Number(result.nominal || 0).toLocaleString("id-ID")
            ).catch((err) =>
            console.error("Payment success email gagal:", err)
            );

            sendTrackingStatusEmail(
            pesanan.email,
            pesanan.namaPenerima,
            pesanan.uuid,
            "DELIVERING",
            undefined,
            "Pembayaran berhasil diterima. Penjual wajib input resi maksimal 1x24 jam."
            ).catch((err) =>
            console.error("Tracking status email gagal:", err)
            );
        }

        // =========================================
        // EMAIL SELLER
        // =========================================
        if (pesanan?.senior?.email) {
            sendSellerPaymentNotificationEmail(
            pesanan.senior.email,
            pesanan.senior.nama,
            pesanan.uuid
            ).catch((err) =>
            console.error("Seller payment notification email gagal:", err)
            );
        }

        // =========================================
        // EMAIL ADMIN
        // =========================================
        try {
            const adminEmails = await getAdminEmailRecipients();

            sendAdminOrderNotificationEmail(
            adminEmails,
            pesanan.uuid,
            "PAYMENT_RECEIVED"
            ).catch((err) =>
            console.error("Admin order notification email gagal:", err)
            );
        } catch (adminErr) {
            console.error("ADMIN EMAIL GAGAL:", adminErr);
        }
        }
      }

      return res.json(
        ApiResponse.success({
          message: "Pembayaran berhasil diupdate",
          result,
        })
      );
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  },
};