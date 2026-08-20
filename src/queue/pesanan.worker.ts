import { Worker } from "bullmq";
import bullmqRedis from "../config/bullmqRedis";
import { prisma } from "../config/prisma";
import { getAdminEmailRecipients, getAdminBankAccount } from "../helpers/pageSettingHelper";

import {
  sendAdminOrderNotificationEmail,
  sendAutoCancelNoResiEmail,
  sendFinalInvoiceEmail,
  sendOrderCanceledEmail,
  sendOrderCompletedEmail,
} from "../config/email";

new Worker(
  "order-automation",

  async (job) => {

    // =================================================
    // AUTO ONGKIR GRATIS (2x24 JAM)
    // =================================================
    if (job.name === "AUTO_FREE_ONGKIR") {

      const pesanan = await prisma.pesanan.findUnique({
        where: {
          uuid: job.data.pesananUuid,
        },
      });

      if (!pesanan) return;

      if (
        (!pesanan.ongkir || Number(pesanan.ongkir) <= 0) &&
        pesanan.statusPesanan === "WAITING_ONGKIR"
      ) {

        const total =
          Number(pesanan.subtotal) +
          Number(pesanan.biayaLayanan);

        await prisma.pesanan.update({
          where: {
            uuid: pesanan.uuid,
          },

          data: {
            ongkir: 0,
            total,
          },
        });

        const rekening = await getAdminBankAccount();

        await sendFinalInvoiceEmail(
          pesanan.email,
          pesanan.namaPenerima,
          pesanan.uuid,
          "0",
          total.toFixed(2),
          rekening
        );
      }
    }

    // =================================================
    // AUTO CANCEL BELUM BAYAR
    // =================================================
    if (job.name === "AUTO_CANCEL_UNPAID") {

      const pesanan = await prisma.pesanan.findUnique({
        where: {
          uuid: job.data.pesananUuid,
        },
      });

      if (!pesanan) return;

      if (
        pesanan.statusBayar !== "PAID" &&
        pesanan.statusPesanan !== "COMPLETED" &&
        pesanan.statusPesanan !== "CANCELED"
      ) {

        await prisma.pesanan.update({
          where: {
            uuid: pesanan.uuid,
          },

          data: {
            statusPesanan: "CANCELED",
            alasanPembatalan:
              "Melebihi batas pembayaran 1x24 jam",
          },
        });

        await sendOrderCanceledEmail(
          pesanan.email,
          pesanan.namaPenerima,
          pesanan.uuid,
          "Melebihi batas pembayaran"
        );
      }
    }

    // =================================================
    // AUTO CANCEL TIDAK INPUT RESI
    // =================================================
    if (job.name === "AUTO_CANCEL_NO_RESI") {

    const pesanan = await prisma.pesanan.findUnique({
        where: {
        uuid: job.data.pesananUuid,
        },

        include: {
        senior: true,
        },
    });

    if (!pesanan) return;

    if (
        !pesanan.nomorResi &&
        pesanan.statusBayar === "PAID" &&
        pesanan.statusPesanan !== "COMPLETED" &&
        pesanan.statusPesanan !== "CANCELED"
    ) {

        await prisma.pesanan.update({
        where: {
            uuid: pesanan.uuid,
        },

        data: {
            statusPesanan: "CANCELED",
            alasanPembatalan:
            "Penjual tidak menginput resi",
        },
        });

        // =========================================
        // EMAIL PEMBELI
        // =========================================
        if (pesanan.email) {
        await sendOrderCanceledEmail(
            pesanan.email,
            pesanan.namaPenerima,
            pesanan.uuid,
            "Penjual tidak menginput resi dalam 1x24 jam"
        );

        await sendAutoCancelNoResiEmail(
            pesanan.email,
            pesanan.namaPenerima,
            pesanan.uuid
        );
        }

        // =========================================
        // EMAIL SELLER
        // =========================================
        if (pesanan.senior?.email) {
        await sendAutoCancelNoResiEmail(
            pesanan.senior.email,
            pesanan.senior.nama,
            pesanan.uuid
        );
        }

        // =========================================
        // EMAIL ADMIN
        // =========================================
        try {
        const adminEmails = await getAdminEmailRecipients();

        await sendAdminOrderNotificationEmail(
            adminEmails,
            pesanan.uuid,
            "ORDER_CANCELED",
            "Otomatis dibatalkan karena seller tidak input resi dalam 1x24 jam."
        );
        } catch (err) {
        console.error("ADMIN EMAIL ERROR:", err);
        }
    }
    }

    // =================================================
    // AUTO COMPLETE
    // =================================================
    if (job.name === "AUTO_COMPLETE_ORDER") {

      const pesanan = await prisma.pesanan.findUnique({
        where: {
          uuid: job.data.pesananUuid,
        },
      });

      if (!pesanan) return;

      if (
        pesanan.nomorResi &&
        pesanan.statusPesanan === "DELIVERING"
      ) {

        await prisma.pesanan.update({
          where: {
            uuid: pesanan.uuid,
          },

          data: {
            statusPesanan: "COMPLETED",
          },
        });

        await sendOrderCompletedEmail(
          pesanan.email,
          pesanan.namaPenerima,
          pesanan.uuid
        );
      }
    }

    // =================================================
    // AUTO BINTANG 5
    // =================================================
    if (job.name === "AUTO_GIVE_RATING") {

      const pesanan = await prisma.pesanan.findUnique({
        where: {
          uuid: job.data.pesananUuid,
        },

        include: {
          produkPesanan: true,
        },
      });

      if (!pesanan) return;

      const existingReview =
        await prisma.ulasanProduk.findFirst({
          where: {
            pesananUuid: pesanan.uuid,
          },
        });

      if (!existingReview) {

        for (const item of pesanan.produkPesanan) {

          await prisma.ulasanProduk.create({
            data: {
              pesananUuid: pesanan.uuid,
              produkUuid: item.produkUuid,
              akunUuid: pesanan.akunUuid,
              rating: 5,
              komentar:
                "Auto review karena tidak ada respon pembeli.",
            },
          });
        }
      }
    }
  },

  {
    connection: bullmqRedis,
  }
);