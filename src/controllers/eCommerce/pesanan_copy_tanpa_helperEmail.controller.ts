import { Request, Response } from "express";
import { prisma } from "../../config/prisma";
import { ApiResponse } from "../../utils/apiResponse";

export const pesananController = {

  // ================= GET ALL =================
  async getAll(req: Request, res: Response) {
    try {
      const data = await prisma.pesanan.findMany({
        include: {
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
        return res.status(404).json({ message: "Not found" });
      }

      return res.json(ApiResponse.success({ result: data }));
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  },

  // ================= GET BY ANGGOTA =================
    async getByAnggota(req: Request, res: Response) {
    try {
        const { anggotaUuid } = req.params;

        const { status, currentPage, pageSize } = req.query as any;

        const page = Number(currentPage) || 1;
        const size = Number(pageSize) || 10;
        const skip = (page - 1) * size;

        let where: any = {
        anggotaUuid,
        };

        // optional filter status pesanan
        if (status) {
        where.statusPesanan = status;
        }

        const total = await prisma.pesanan.count({ where });

        const data = await prisma.pesanan.findMany({
        where,
        include: {
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
                where: { uuid: item.produkUuid },
            });

            if (!produk) throw new Error("Produk tidak ditemukan");

            const harga = Number(produk.harga);
            const jumlah = Number(item.jumlah);
            const diskon = Number(item.diskon || 0);

            const subtotalItem = harga * jumlah - diskon;

            return {
                produkUuid: item.produkUuid,
                jumlah,
                harga,
                diskon,
                subtotal: subtotalItem,
                pajakTotal: 0,
                total: subtotalItem,
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
        const biayaLayanan = subtotal * 0.1;

        const total =
            subtotal - diskonTotal + pajakTotal + ongkir + biayaLayanan;

        // ================= CREATE =================
        const created = await tx.pesanan.create({
            data: {
            anggotaUuid: body.anggotaUuid,
            akunUuid: body.akunUuid,

            namaPenerima: body.namaPenerima,
            alamat: body.alamat,
            noHp: body.noHp,
            email: body.email,
            kodePos: body.kodePos,
            kota: body.kota,

            statusPesanan: body.statusPesanan,
            statusBayar: body.statusBayar,

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
        });

        return created;
        });

        return res.status(201).json(
        ApiResponse.success({
            message: "Pesanan created",
            result,
        })
        );
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
    },

    // ================= UPDATE =================
    async update(req: Request, res: Response) {
        try {
            const { uuid } = req.params;
            const body = req.body;

            const existing = await prisma.pesanan.findUnique({
                where: { uuid },
            });

            if (!existing) {
            return res.status(404).json({ message: "Not found" });
            }

            // ================= HITUNG ULANG =================
            const subtotal = Number(body.subtotal ?? existing.subtotal);
            const diskonTotal = Number(body.diskonTotal ?? existing.diskonTotal);
            const pajakTotal = Number(body.pajakTotal ?? existing.pajakTotal);

            const biayaLayanan = subtotal * 0.1;

            const ongkir = Number(body.ongkir ?? existing.ongkir ?? 0);

            const total = subtotal - diskonTotal + pajakTotal + biayaLayanan + ongkir;

            const data = await prisma.pesanan.update({
                where: { uuid },
                data: {
                    ...body,

                    biayaLayanan,
                    ongkir,
                    total,
                },
            });

            return res.json(
                ApiResponse.success({
                    message: "Pesanan updated",
                    result: data,
                })
            );
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
    }
};
