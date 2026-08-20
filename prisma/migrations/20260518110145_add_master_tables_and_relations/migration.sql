-- AlterTable
ALTER TABLE "Senior" ADD COLUMN     "bidangMinatUuid" UUID,
ADD COLUMN     "bidangStudiUuid" UUID,
ADD COLUMN     "kotaDomisili" TEXT,
ADD COLUMN     "kotaDomisiliUuid" UUID,
ADD COLUMN     "pekerjaanUuid" UUID,
ADD COLUMN     "pendidikanUuid" UUID,
ADD COLUMN     "provinsi" TEXT,
ADD COLUMN     "provinsiUuid" UUID;

-- CreateTable
CREATE TABLE "MasterPendidikan" (
    "uuid" UUID NOT NULL,
    "nama" TEXT NOT NULL,
    "insert_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MasterPendidikan_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "MasterPekerjaan" (
    "uuid" UUID NOT NULL,
    "nama" TEXT NOT NULL,
    "insert_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MasterPekerjaan_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "MasterBidangStudi" (
    "uuid" UUID NOT NULL,
    "nama" TEXT NOT NULL,
    "insert_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MasterBidangStudi_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "MasterBidangMinat" (
    "uuid" UUID NOT NULL,
    "nama" TEXT NOT NULL,
    "insert_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MasterBidangMinat_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "MasterProvinsi" (
    "uuid" UUID NOT NULL,
    "nama" TEXT NOT NULL,
    "insert_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MasterProvinsi_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "MasterKota" (
    "uuid" UUID NOT NULL,
    "nama" TEXT NOT NULL,
    "provinsiUuid" UUID NOT NULL,
    "insert_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MasterKota_pkey" PRIMARY KEY ("uuid")
);

-- CreateIndex
CREATE UNIQUE INDEX "MasterPendidikan_nama_key" ON "MasterPendidikan"("nama");

-- CreateIndex
CREATE UNIQUE INDEX "MasterPekerjaan_nama_key" ON "MasterPekerjaan"("nama");

-- CreateIndex
CREATE UNIQUE INDEX "MasterBidangStudi_nama_key" ON "MasterBidangStudi"("nama");

-- CreateIndex
CREATE UNIQUE INDEX "MasterBidangMinat_nama_key" ON "MasterBidangMinat"("nama");

-- CreateIndex
CREATE UNIQUE INDEX "MasterProvinsi_nama_key" ON "MasterProvinsi"("nama");

-- CreateIndex
CREATE UNIQUE INDEX "MasterKota_nama_provinsiUuid_key" ON "MasterKota"("nama", "provinsiUuid");

-- AddForeignKey
ALTER TABLE "Senior" ADD CONSTRAINT "Senior_pendidikanUuid_fkey" FOREIGN KEY ("pendidikanUuid") REFERENCES "MasterPendidikan"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Senior" ADD CONSTRAINT "Senior_pekerjaanUuid_fkey" FOREIGN KEY ("pekerjaanUuid") REFERENCES "MasterPekerjaan"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Senior" ADD CONSTRAINT "Senior_bidangStudiUuid_fkey" FOREIGN KEY ("bidangStudiUuid") REFERENCES "MasterBidangStudi"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Senior" ADD CONSTRAINT "Senior_bidangMinatUuid_fkey" FOREIGN KEY ("bidangMinatUuid") REFERENCES "MasterBidangMinat"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Senior" ADD CONSTRAINT "Senior_provinsiUuid_fkey" FOREIGN KEY ("provinsiUuid") REFERENCES "MasterProvinsi"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Senior" ADD CONSTRAINT "Senior_kotaDomisiliUuid_fkey" FOREIGN KEY ("kotaDomisiliUuid") REFERENCES "MasterKota"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MasterKota" ADD CONSTRAINT "MasterKota_provinsiUuid_fkey" FOREIGN KEY ("provinsiUuid") REFERENCES "MasterProvinsi"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;
