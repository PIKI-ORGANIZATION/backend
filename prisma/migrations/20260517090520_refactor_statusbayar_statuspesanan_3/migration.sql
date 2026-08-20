/*
  Warnings:

  - You are about to drop the column `statusBayar` on the `Pesanan` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Pesanan" DROP COLUMN "statusBayar",
ADD COLUMN     "statusPembayaran" "StatusPembayaran" NOT NULL DEFAULT 'PENDING';
