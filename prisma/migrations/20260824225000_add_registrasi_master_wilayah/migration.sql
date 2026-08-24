-- AlterTable
ALTER TABLE "Akun" ALTER COLUMN "seniorUuid" DROP NOT NULL;

-- CreateTable
CREATE TABLE "registrasi" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "namaLengkap" TEXT NOT NULL,
    "tanggalLahir" DATE NOT NULL,
    "noWa" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "alamatDomisili" TEXT NOT NULL,
    "fileKtpUrl" TEXT NOT NULL,
    "dpp" TEXT,
    "dpc" TEXT,
    "kode_provinsi" TEXT,
    "kode_kabupaten" TEXT,
    "cabangUuid" UUID,
    "kotaDomisili" TEXT,
    "tingkatPendidikan" TEXT,
    "pendidikanUuid" UUID,
    "pekerjaan" TEXT,
    "pekerjaanUuid" UUID,
    "minatBidang" TEXT,
    "bidangMinatUuid" UUID,
    "motivasiBergabung" TEXT,
    "setujuKebenaranData" BOOLEAN NOT NULL DEFAULT false,
    "setujuPengelolaanData" BOOLEAN NOT NULL DEFAULT false,
    "setujuKerahasiaanData" BOOLEAN NOT NULL DEFAULT false,
    "tglPersetujuanPdp" TIMESTAMP(3),
    "statusVerifikasi" TEXT NOT NULL DEFAULT 'PENDING_VERIFIKASI_DPC',
    "verifikatorUuid" UUID,
    "catatanVerifikasi" TEXT,
    "tglVerifikasi" TIMESTAMP(3),
    "isBypassedSla" BOOLEAN NOT NULL DEFAULT false,
    "tglBypassSla" TIMESTAMP(3),
    "statusPembayaran" TEXT NOT NULL DEFAULT 'UNPAID',
    "noTagihan" TEXT,
    "nominalIuran" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "buktiBayarUrl" TEXT,
    "tglPembayaran" TIMESTAMP(3),
    "statusKta" TEXT NOT NULL DEFAULT 'INACTIVE',
    "noKta" TEXT,
    "fileKtaUrl" TEXT,
    "tglAktivasiKta" TIMESTAMP(3),
    "akunUuid" UUID,
    "seniorUuid" UUID,
    "langkahSekarang" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" UUID,

    CONSTRAINT "registrasi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registrasi_log" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "registrasiId" UUID NOT NULL,
    "aksi" TEXT NOT NULL,
    "keterangan" TEXT,
    "actorUuid" UUID,
    "actorNama" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "registrasi_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_master_wilayah" (
    "id" SERIAL NOT NULL,
    "kode_provinsi" TEXT,
    "nama_provinsi" TEXT,
    "kode_kabupaten" TEXT,
    "nama_kabupaten" TEXT,
    "kode_kecamatan" TEXT,
    "nama_kecamatan" TEXT,
    "kode_kel_desa" VARCHAR(13),
    "nama_kel_desa" VARCHAR(255),

    CONSTRAINT "data_master_wilayah_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dpp_dpc" (
    "id" SERIAL NOT NULL,
    "dpp" VARCHAR(255),
    "dpc" VARCHAR(255),
    "kode_provinsi" VARCHAR(20),
    "kode_kabupaten" VARCHAR(20),
    "pengurus" VARCHAR(255),
    "no_handphone" VARCHAR(100),
    "keterangan" VARCHAR(255),
    "penerbitan_sk" VARCHAR(50),
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dpp_dpc_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "registrasi_noTagihan_key" ON "registrasi"("noTagihan");
CREATE UNIQUE INDEX "registrasi_noKta_key" ON "registrasi"("noKta");
CREATE UNIQUE INDEX "registrasi_akunUuid_key" ON "registrasi"("akunUuid");
CREATE UNIQUE INDEX "registrasi_seniorUuid_key" ON "registrasi"("seniorUuid");

-- CreateIndex
CREATE INDEX "data_master_wilayah_kode_provinsi_idx" ON "data_master_wilayah"("kode_provinsi");
CREATE INDEX "data_master_wilayah_kode_kabupaten_idx" ON "data_master_wilayah"("kode_kabupaten");

-- AddForeignKey
ALTER TABLE "registrasi" ADD CONSTRAINT "registrasi_cabangUuid_fkey" FOREIGN KEY ("cabangUuid") REFERENCES "Cabang"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "registrasi" ADD CONSTRAINT "registrasi_akunUuid_fkey" FOREIGN KEY ("akunUuid") REFERENCES "Akun"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "registrasi_log" ADD CONSTRAINT "registrasi_log_registrasiId_fkey" FOREIGN KEY ("registrasiId") REFERENCES "registrasi"("id") ON DELETE CASCADE ON UPDATE CASCADE;
