/*
  Warnings:

  - You are about to drop the column `status` on the `NewsUtama` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "NewsUtama" DROP COLUMN "status",
ADD COLUMN     "statusNewsUtama" TEXT NOT NULL DEFAULT 'DRAFT';
