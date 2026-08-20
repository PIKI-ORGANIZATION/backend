/*
  Warnings:

  - The values [CANCELLED] on the enum `StatusOrder` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "StatusOrder_new" AS ENUM ('WAITING_ONGKIR', 'WAITING_CONFIRMATION', 'DELIVERING', 'COMPLETED', 'CANCELED');
ALTER TABLE "public"."Pesanan" ALTER COLUMN "statusPesanan" DROP DEFAULT;
ALTER TABLE "Pesanan" ALTER COLUMN "statusPesanan" TYPE "StatusOrder_new" USING ("statusPesanan"::text::"StatusOrder_new");
ALTER TYPE "StatusOrder" RENAME TO "StatusOrder_old";
ALTER TYPE "StatusOrder_new" RENAME TO "StatusOrder";
DROP TYPE "public"."StatusOrder_old";
ALTER TABLE "Pesanan" ALTER COLUMN "statusPesanan" SET DEFAULT 'WAITING_ONGKIR';
COMMIT;
