/*
  Warnings:

  - You are about to drop the column `status` on the `NewsKategori` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "NewsKategori" DROP COLUMN "status",
ADD COLUMN     "status_kategori" TEXT NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "NewsTag" ADD COLUMN     "status_tag" TEXT NOT NULL DEFAULT 'ACTIVE';
