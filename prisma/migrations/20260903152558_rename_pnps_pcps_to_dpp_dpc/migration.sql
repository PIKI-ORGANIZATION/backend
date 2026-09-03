/*
  Warnings:

  - You are about to drop the column `approvedAtPCPS` on the `Anggota` table. All the data in the column will be lost.
  - You are about to drop the column `approvedAtPNPS` on the `Anggota` table. All the data in the column will be lost.
  - You are about to drop the column `approvedByPCPSUuid` on the `Anggota` table. All the data in the column will be lost.
  - You are about to drop the column `approvedByPNPSUuid` on the `Anggota` table. All the data in the column will be lost.
  - You are about to drop the column `isApprovedByPCPS` on the `Anggota` table. All the data in the column will be lost.
  - You are about to drop the column `isApprovedByPNPS` on the `Anggota` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Anggota" DROP CONSTRAINT "Anggota_approvedByPCPSUuid_fkey";

-- DropForeignKey
ALTER TABLE "Anggota" DROP CONSTRAINT "Anggota_approvedByPNPSUuid_fkey";

-- AlterTable
ALTER TABLE "Anggota" DROP COLUMN "approvedAtPCPS",
DROP COLUMN "approvedAtPNPS",
DROP COLUMN "approvedByPCPSUuid",
DROP COLUMN "approvedByPNPSUuid",
DROP COLUMN "isApprovedByPCPS",
DROP COLUMN "isApprovedByPNPS",
ADD COLUMN     "approvedAtDPC" TIMESTAMP(3),
ADD COLUMN     "approvedAtDPP" TIMESTAMP(3),
ADD COLUMN     "approvedByDPCUuid" UUID,
ADD COLUMN     "approvedByDPPUuid" UUID,
ADD COLUMN     "isApprovedByDPC" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isApprovedByDPP" BOOLEAN NOT NULL DEFAULT false;

-- AddForeignKey
ALTER TABLE "Anggota" ADD CONSTRAINT "Anggota_approvedByDPCUuid_fkey" FOREIGN KEY ("approvedByDPCUuid") REFERENCES "Anggota"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Anggota" ADD CONSTRAINT "Anggota_approvedByDPPUuid_fkey" FOREIGN KEY ("approvedByDPPUuid") REFERENCES "Anggota"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;
