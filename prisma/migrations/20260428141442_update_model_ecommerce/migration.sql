/*
  Warnings:

  - You are about to alter the column `totalHarga` on the `KeranjangBelanja` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,2)` to `Decimal(12,5)`.
  - You are about to alter the column `jumlahBayar` on the `Pembayaran` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,2)` to `Decimal(12,5)`.
  - You are about to alter the column `subtotal` on the `Pesanan` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,2)` to `Decimal(12,5)`.
  - You are about to alter the column `diskonTotal` on the `Pesanan` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,2)` to `Decimal(12,5)`.
  - You are about to alter the column `pajakTotal` on the `Pesanan` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,2)` to `Decimal(12,5)`.
  - You are about to alter the column `total` on the `Pesanan` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,2)` to `Decimal(12,5)`.
  - You are about to alter the column `harga` on the `Produk` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,2)` to `Decimal(12,5)`.
  - You are about to alter the column `harga` on the `ProdukPesanan` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,2)` to `Decimal(12,5)`.
  - You are about to alter the column `diskon` on the `ProdukPesanan` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,2)` to `Decimal(12,5)`.
  - You are about to alter the column `subtotal` on the `ProdukPesanan` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,2)` to `Decimal(12,5)`.
  - You are about to alter the column `pajakTotal` on the `ProdukPesanan` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,2)` to `Decimal(12,5)`.
  - You are about to alter the column `total` on the `ProdukPesanan` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,2)` to `Decimal(12,5)`.
  - You are about to drop the `LogStatusPesanan` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "LogStatusPesanan" DROP CONSTRAINT "LogStatusPesanan_pesananUuid_fkey";

-- AlterTable
ALTER TABLE "KeranjangBelanja" ALTER COLUMN "totalHarga" SET DATA TYPE DECIMAL(12,5);

-- AlterTable
ALTER TABLE "Pembayaran" ALTER COLUMN "jumlahBayar" SET DATA TYPE DECIMAL(12,5);

-- AlterTable
ALTER TABLE "Pesanan" ALTER COLUMN "subtotal" SET DATA TYPE DECIMAL(12,5),
ALTER COLUMN "diskonTotal" SET DATA TYPE DECIMAL(12,5),
ALTER COLUMN "pajakTotal" SET DATA TYPE DECIMAL(12,5),
ALTER COLUMN "total" SET DATA TYPE DECIMAL(12,5);

-- AlterTable
ALTER TABLE "Produk" ALTER COLUMN "harga" SET DATA TYPE DECIMAL(12,5);

-- AlterTable
ALTER TABLE "ProdukPesanan" ALTER COLUMN "harga" SET DATA TYPE DECIMAL(12,5),
ALTER COLUMN "diskon" SET DATA TYPE DECIMAL(12,5),
ALTER COLUMN "subtotal" SET DATA TYPE DECIMAL(12,5),
ALTER COLUMN "pajakTotal" SET DATA TYPE DECIMAL(12,5),
ALTER COLUMN "total" SET DATA TYPE DECIMAL(12,5);

-- DropTable
DROP TABLE "LogStatusPesanan";
