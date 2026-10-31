-- Task 1: Manajemen DPD & DPC (hierarki DPD/DPC via Cabang)
-- Hanya menambah kolom nullable + unique index; data lama tidak diubah.

-- AlterTable: tautan akun admin langsung ke Cabang
ALTER TABLE "Akun" ADD COLUMN     "cabangUuid" UUID;

-- AlterTable: Cabang ditautkan ke DPD (dpdId) atau DPC (dpcId)
ALTER TABLE "Cabang" ADD COLUMN     "dpcId" INTEGER,
ADD COLUMN     "dpdId" UUID;

-- AlterTable: soft delete DPD
ALTER TABLE "dpd" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "deletedBy" UUID;

-- AlterTable: audit & soft delete DPC
ALTER TABLE "dpd_dpc" ADD COLUMN     "created_by" UUID,
ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "deleted_by" UUID,
ADD COLUMN     "updated_by" UUID;

-- CreateIndex
CREATE UNIQUE INDEX "Cabang_dpdId_key" ON "Cabang"("dpdId");

-- CreateIndex
CREATE UNIQUE INDEX "Cabang_dpcId_key" ON "Cabang"("dpcId");

-- CreateIndex
CREATE UNIQUE INDEX "dpd_kodeProvinsi_key" ON "dpd"("kodeProvinsi");

-- CreateIndex
CREATE UNIQUE INDEX "dpd_dpc_kode_kabupaten_key" ON "dpd_dpc"("kode_kabupaten");

-- AddForeignKey
ALTER TABLE "Akun" ADD CONSTRAINT "Akun_cabangUuid_fkey" FOREIGN KEY ("cabangUuid") REFERENCES "Cabang"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cabang" ADD CONSTRAINT "Cabang_dpdId_fkey" FOREIGN KEY ("dpdId") REFERENCES "dpd"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cabang" ADD CONSTRAINT "Cabang_dpcId_fkey" FOREIGN KEY ("dpcId") REFERENCES "dpd_dpc"("id") ON DELETE SET NULL ON UPDATE CASCADE;
