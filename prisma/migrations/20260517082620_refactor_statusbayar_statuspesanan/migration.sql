/*
  Warnings:

  - The values [WAITING_PAYMENT,WAITING_SHIPPING_CONFIRMATION,PROCESSING,SHIPPED,DELIVERED,CANCELED] on the enum `StatusOrder` will be removed. If these variants are still used in the database, this will fail.
  - The values [FAILED] on the enum `StatusPembayaran` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "StatusOrder_new" AS ENUM ('WAITING_ONGKIR', 'WAITING_CONFIRMATION', 'DELIVERING', 'COMPLETED', 'CANCELLED');
ALTER TABLE "public"."Pesanan" ALTER COLUMN "statusPesanan" DROP DEFAULT;
ALTER TABLE "Pesanan" ALTER COLUMN "statusPesanan" TYPE "StatusOrder_new" USING ("statusPesanan"::text::"StatusOrder_new");
ALTER TYPE "StatusOrder" RENAME TO "StatusOrder_old";
ALTER TYPE "StatusOrder_new" RENAME TO "StatusOrder";
DROP TYPE "public"."StatusOrder_old";
ALTER TABLE "Pesanan" ALTER COLUMN "statusPesanan" SET DEFAULT 'WAITING_ONGKIR';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "StatusPembayaran_new" AS ENUM ('PENDING', 'PAID', 'CANCELED', 'REFUNDED', 'SELLER_PAID');
ALTER TABLE "public"."Pembayaran" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."Pesanan" ALTER COLUMN "statusBayar" DROP DEFAULT;
ALTER TABLE "Pesanan" ALTER COLUMN "statusBayar" TYPE "StatusPembayaran_new" USING ("statusBayar"::text::"StatusPembayaran_new");
ALTER TABLE "Pembayaran" ALTER COLUMN "status" TYPE "StatusPembayaran_new" USING ("status"::text::"StatusPembayaran_new");
ALTER TYPE "StatusPembayaran" RENAME TO "StatusPembayaran_old";
ALTER TYPE "StatusPembayaran_new" RENAME TO "StatusPembayaran";
DROP TYPE "public"."StatusPembayaran_old";
ALTER TABLE "Pembayaran" ALTER COLUMN "status" SET DEFAULT 'PENDING';
ALTER TABLE "Pesanan" ALTER COLUMN "statusBayar" SET DEFAULT 'PENDING';
COMMIT;

-- AlterTable
ALTER TABLE "Pesanan" ALTER COLUMN "statusPesanan" SET DEFAULT 'WAITING_ONGKIR';
