/*
  Warnings:

  - The values [SENDING,SENT] on the enum `StatusOrder` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "StatusOrder_new" AS ENUM ('WAITING_ONGKIR', 'WAITING_PAYMENT', 'WAITING_SHIPPING_CONFIRMATION', 'WAITING_CONFIRMATION', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'COMPLETED', 'CANCELED');
ALTER TABLE "public"."Pesanan" ALTER COLUMN "statusPesanan" DROP DEFAULT;
ALTER TABLE "Pesanan" ALTER COLUMN "statusPesanan" TYPE "StatusOrder_new" USING ("statusPesanan"::text::"StatusOrder_new");
ALTER TYPE "StatusOrder" RENAME TO "StatusOrder_old";
ALTER TYPE "StatusOrder_new" RENAME TO "StatusOrder";
DROP TYPE "public"."StatusOrder_old";
ALTER TABLE "Pesanan" ALTER COLUMN "statusPesanan" SET DEFAULT 'WAITING_PAYMENT';
COMMIT;

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "StatusPembayaran" ADD VALUE 'FAILED';
ALTER TYPE "StatusPembayaran" ADD VALUE 'REFUNDED';
