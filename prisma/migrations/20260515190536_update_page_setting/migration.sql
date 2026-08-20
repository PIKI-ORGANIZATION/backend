/*
  Warnings:

  - The `deskripsi` column on the `LogAktivitas` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `keyPage` on the `pageSetting` table. All the data in the column will be lost.
  - You are about to drop the column `namaPage` on the `pageSetting` table. All the data in the column will be lost.
  - You are about to drop the column `statusPageSetting` on the `pageSetting` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[key]` on the table `pageSetting` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `key` to the `pageSetting` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nama` to the `pageSetting` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "pageSetting_keyPage_key";

-- AlterTable
ALTER TABLE "LogAktivitas" DROP COLUMN "deskripsi",
ADD COLUMN     "deskripsi" JSONB;

-- AlterTable
ALTER TABLE "pageSetting" DROP COLUMN "keyPage",
DROP COLUMN "namaPage",
DROP COLUMN "statusPageSetting",
ADD COLUMN     "key" TEXT NOT NULL,
ADD COLUMN     "nama" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "pageSetting_key_key" ON "pageSetting"("key");
