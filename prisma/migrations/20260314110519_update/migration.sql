/*
  Warnings:

  - You are about to drop the column `tipeOrganisasi` on the `PeriodeKepengurusan` table. All the data in the column will be lost.
  - You are about to drop the column `asalCabang` on the `StrukturOrganisasi` table. All the data in the column will be lost.
  - You are about to drop the column `tipeJabatan` on the `StrukturOrganisasi` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "PeriodeKepengurusan" DROP COLUMN "tipeOrganisasi",
ADD COLUMN     "cabangUuid" UUID;

-- AlterTable
ALTER TABLE "StrukturOrganisasi" DROP COLUMN "asalCabang",
DROP COLUMN "tipeJabatan";

-- AddForeignKey
ALTER TABLE "PeriodeKepengurusan" ADD CONSTRAINT "PeriodeKepengurusan_cabangUuid_fkey" FOREIGN KEY ("cabangUuid") REFERENCES "Cabang"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;
