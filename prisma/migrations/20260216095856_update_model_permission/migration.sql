/*
  Warnings:

  - You are about to drop the column `listPermission` on the `Permission` table. All the data in the column will be lost.
  - You are about to drop the column `modul` on the `Permission` table. All the data in the column will be lost.
  - Added the required column `namaPermission` to the `Permission` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Permission" DROP COLUMN "listPermission",
DROP COLUMN "modul",
ADD COLUMN     "namaPermission" TEXT NOT NULL,
ALTER COLUMN "statusPermission" SET DEFAULT 'ACTIVE';
