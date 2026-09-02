-- DropForeignKey
ALTER TABLE "Akun" DROP CONSTRAINT "Akun_seniorUuid_fkey";

-- DropForeignKey
ALTER TABLE "Senior" DROP CONSTRAINT "Senior_approvedByPCPSUuid_fkey";

-- DropForeignKey
ALTER TABLE "Senior" DROP CONSTRAINT "Senior_approvedByPNPSUuid_fkey";

-- DropForeignKey
ALTER TABLE "Senior" DROP CONSTRAINT "Senior_bidangMinatUuid_fkey";

-- DropForeignKey
ALTER TABLE "Senior" DROP CONSTRAINT "Senior_bidangStudiUuid_fkey";

-- DropForeignKey
ALTER TABLE "Senior" DROP CONSTRAINT "Senior_cabangUuid_fkey";

-- DropForeignKey
ALTER TABLE "Senior" DROP CONSTRAINT "Senior_insert_by_fkey";

-- DropForeignKey
ALTER TABLE "Senior" DROP CONSTRAINT "Senior_pekerjaanUuid_fkey";

-- DropForeignKey
ALTER TABLE "Senior" DROP CONSTRAINT "Senior_pendidikanUuid_fkey";

-- DropForeignKey
ALTER TABLE "Senior" DROP CONSTRAINT "Senior_update_by_fkey";

-- DropForeignKey
ALTER TABLE "StrukturOrganisasi" DROP CONSTRAINT "StrukturOrganisasi_seniorUuid_fkey";

-- DropIndex
DROP INDEX "Akun_seniorUuid_key";

-- DropIndex
DROP INDEX "StrukturOrganisasi_seniorUuid_idx";

-- DropIndex
DROP INDEX "registrasi_nik_key";

-- DropIndex
DROP INDEX "registrasi_noTagihan_key";

-- DropIndex
DROP INDEX "registrasi_seniorUuid_key";

-- AlterTable
ALTER TABLE "Akun" DROP COLUMN "seniorUuid",
ADD COLUMN     "anggotaUuid" UUID;

-- AlterTable
ALTER TABLE "StrukturOrganisasi" DROP COLUMN "seniorUuid",
ADD COLUMN     "anggotaUuid" UUID NOT NULL;

-- AlterTable
ALTER TABLE "registrasi" DROP COLUMN "dpp",
DROP COLUMN "nik",
DROP COLUMN "noTagihan",
DROP COLUMN "nominalIuran",
DROP COLUMN "seniorUuid",
DROP COLUMN "tglPembayaran",
ADD COLUMN     "anggotaUuid" UUID,
ADD COLUMN     "dpd" TEXT;

-- DropTable
DROP TABLE "Senior";

-- DropTable
DROP TABLE "dpp_dpc";

-- CreateTable
CREATE TABLE "Anggota" (
    "uuid" UUID NOT NULL,
    "namaLengkap" TEXT NOT NULL,
    "namaPanggil" TEXT,
    "tempatLahir" TEXT,
    "tanggalLahir" DATE,
    "alamat" TEXT,
    "bio" TEXT,
    "pesanKesan" TEXT,
    "angkatan" TEXT,
    "provinsi" TEXT,
    "kotaDomisili" TEXT,
    "pendidikanUuid" UUID,
    "pekerjaanUuid" UUID,
    "bidangStudiUuid" UUID,
    "bidangMinatUuid" UUID,
    "profileImg" TEXT,
    "noWa" TEXT,
    "instagram" TEXT,
    "facebook" TEXT,
    "statusKeanggotaan" TEXT NOT NULL DEFAULT 'NON_MEMBER',
    "isApprovedByPCPS" BOOLEAN NOT NULL DEFAULT false,
    "isApprovedByPNPS" BOOLEAN NOT NULL DEFAULT false,
    "approvedByPCPSUuid" UUID,
    "approvedAtPCPS" TIMESTAMP(3),
    "approvedByPNPSUuid" UUID,
    "approvedAtPNPS" TIMESTAMP(3),
    "cabangUuid" UUID,
    "insert_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "insert_by" UUID,
    "update_at" TIMESTAMP(3) NOT NULL,
    "update_by" UUID,

    CONSTRAINT "Anggota_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "dpd_dpc" (
    "id" SERIAL NOT NULL,
    "dpd" VARCHAR(255),
    "dpc" VARCHAR(255),
    "kode_provinsi" VARCHAR(20),
    "kode_kabupaten" VARCHAR(20),
    "pengurus" VARCHAR(255),
    "no_handphone" VARCHAR(100),
    "keterangan" VARCHAR(255),
    "penerbitan_sk" VARCHAR(50),
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dpd_dpc_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dpd" (
    "id" UUID NOT NULL,
    "kodeProvinsi" VARCHAR(20),
    "dpd" VARCHAR(255),
    "pengurus" VARCHAR(255),
    "noHandphone" VARCHAR(100),
    "keterangan" VARCHAR(255),
    "penerbitanSk" VARCHAR(50),
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID,
    "updatedBy" UUID,

    CONSTRAINT "dpd_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Akun_anggotaUuid_key" ON "Akun"("anggotaUuid");

-- CreateIndex
CREATE INDEX "StrukturOrganisasi_anggotaUuid_idx" ON "StrukturOrganisasi"("anggotaUuid");

-- CreateIndex
CREATE UNIQUE INDEX "registrasi_anggotaUuid_key" ON "registrasi"("anggotaUuid");

-- AddForeignKey
ALTER TABLE "Akun" ADD CONSTRAINT "Akun_anggotaUuid_fkey" FOREIGN KEY ("anggotaUuid") REFERENCES "Anggota"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Anggota" ADD CONSTRAINT "Anggota_approvedByPCPSUuid_fkey" FOREIGN KEY ("approvedByPCPSUuid") REFERENCES "Anggota"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Anggota" ADD CONSTRAINT "Anggota_approvedByPNPSUuid_fkey" FOREIGN KEY ("approvedByPNPSUuid") REFERENCES "Anggota"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Anggota" ADD CONSTRAINT "Anggota_bidangMinatUuid_fkey" FOREIGN KEY ("bidangMinatUuid") REFERENCES "MasterBidangMinat"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Anggota" ADD CONSTRAINT "Anggota_bidangStudiUuid_fkey" FOREIGN KEY ("bidangStudiUuid") REFERENCES "MasterBidangStudi"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Anggota" ADD CONSTRAINT "Anggota_cabangUuid_fkey" FOREIGN KEY ("cabangUuid") REFERENCES "Cabang"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Anggota" ADD CONSTRAINT "Anggota_insert_by_fkey" FOREIGN KEY ("insert_by") REFERENCES "Akun"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Anggota" ADD CONSTRAINT "Anggota_pekerjaanUuid_fkey" FOREIGN KEY ("pekerjaanUuid") REFERENCES "MasterPekerjaan"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Anggota" ADD CONSTRAINT "Anggota_pendidikanUuid_fkey" FOREIGN KEY ("pendidikanUuid") REFERENCES "MasterPendidikan"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Anggota" ADD CONSTRAINT "Anggota_update_by_fkey" FOREIGN KEY ("update_by") REFERENCES "Akun"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StrukturOrganisasi" ADD CONSTRAINT "StrukturOrganisasi_anggotaUuid_fkey" FOREIGN KEY ("anggotaUuid") REFERENCES "Anggota"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

