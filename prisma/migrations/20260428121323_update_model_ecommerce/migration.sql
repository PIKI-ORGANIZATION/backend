-- CreateEnum
CREATE TYPE "MetodePembayaran" AS ENUM ('TRANSFER_BANK', 'CASH', 'E_WALLET');

-- AlterTable
ALTER TABLE "Produk" ADD COLUMN     "jumlahRating" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "ratingRataRata" DECIMAL(2,1) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "UlasanProduk" (
    "uuid" UUID NOT NULL,
    "akunUuid" UUID NOT NULL,
    "produkPesananUuid" UUID NOT NULL,
    "rating" INTEGER NOT NULL,
    "komentar" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UlasanProduk_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "LogStatusPesanan" (
    "uuid" UUID NOT NULL,
    "pesananUuid" UUID NOT NULL,
    "status" "StatusOrder" NOT NULL,
    "keterangan" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LogStatusPesanan_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "Pembayaran" (
    "uuid" UUID NOT NULL,
    "pesananUuid" UUID NOT NULL,
    "metode" "MetodePembayaran" NOT NULL,
    "namaPengirim" TEXT,
    "bankPengirim" TEXT,
    "jumlahBayar" DECIMAL(12,2) NOT NULL,
    "urlBuktiPembayaran" TEXT,
    "nomorReferensi" TEXT,
    "tanggalBayar" TIMESTAMP(3),
    "status" "StatusPembayaran" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pembayaran_pkey" PRIMARY KEY ("uuid")
);

-- CreateIndex
CREATE UNIQUE INDEX "UlasanProduk_produkPesananUuid_key" ON "UlasanProduk"("produkPesananUuid");

-- CreateIndex
CREATE UNIQUE INDEX "Pembayaran_pesananUuid_key" ON "Pembayaran"("pesananUuid");

-- AddForeignKey
ALTER TABLE "UlasanProduk" ADD CONSTRAINT "UlasanProduk_akunUuid_fkey" FOREIGN KEY ("akunUuid") REFERENCES "Akun"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UlasanProduk" ADD CONSTRAINT "UlasanProduk_produkPesananUuid_fkey" FOREIGN KEY ("produkPesananUuid") REFERENCES "ProdukPesanan"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogStatusPesanan" ADD CONSTRAINT "LogStatusPesanan_pesananUuid_fkey" FOREIGN KEY ("pesananUuid") REFERENCES "Pesanan"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pembayaran" ADD CONSTRAINT "Pembayaran_pesananUuid_fkey" FOREIGN KEY ("pesananUuid") REFERENCES "Pesanan"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;
