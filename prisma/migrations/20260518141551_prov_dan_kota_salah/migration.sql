/*
  Warnings:

  - You are about to drop the column `kotaDomisiliUuid` on the `Senior` table. All the data in the column will be lost.
  - You are about to drop the column `provinsiUuid` on the `Senior` table. All the data in the column will be lost.
  - You are about to drop the `MasterKota` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MasterProvinsi` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "MasterKota" DROP CONSTRAINT "MasterKota_provinsiUuid_fkey";

-- DropForeignKey
ALTER TABLE "Senior" DROP CONSTRAINT "Senior_kotaDomisiliUuid_fkey";

-- DropForeignKey
ALTER TABLE "Senior" DROP CONSTRAINT "Senior_provinsiUuid_fkey";

-- AlterTable
ALTER TABLE "Senior" DROP COLUMN "kotaDomisiliUuid",
DROP COLUMN "provinsiUuid";

-- DropTable
DROP TABLE "MasterKota";

-- DropTable
DROP TABLE "MasterProvinsi";
