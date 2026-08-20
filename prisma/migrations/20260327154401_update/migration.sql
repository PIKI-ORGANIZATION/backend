/*
  Warnings:

  - You are about to drop the column `namaperiode` on the `PeriodeKepengurusan` table. All the data in the column will be lost.
  - Added the required column `namaPeriode` to the `PeriodeKepengurusan` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PeriodeKepengurusan" DROP COLUMN "namaperiode",
ADD COLUMN     "namaPeriode" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "StrukturOrganisasi_periodeUuid_idx" ON "StrukturOrganisasi"("periodeUuid");

-- CreateIndex
CREATE INDEX "StrukturOrganisasi_seniorUuid_idx" ON "StrukturOrganisasi"("seniorUuid");
