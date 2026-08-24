-- AlterTable
ALTER TABLE "registrasi" ADD COLUMN "nik" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "registrasi_nik_key" ON "registrasi"("nik");

-- CreateTable
CREATE TABLE "registrasi_pengurus" (
    "id" UUID NOT NULL,
    "namaLengkap" TEXT NOT NULL,
    "noWa" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "tingkat" TEXT NOT NULL,
    "jabatan" TEXT NOT NULL,
    "kode_provinsi" TEXT,
    "kode_kabupaten" TEXT,
    "cabangUuid" UUID,
    "skKepengurusanUrl" TEXT NOT NULL,
    "statusVerifikasi" TEXT NOT NULL DEFAULT 'PENDING_VERIFIKASI',
    "verifikatorUuid" UUID,
    "catatanVerifikasi" TEXT,
    "tglVerifikasi" TIMESTAMP(3),
    "akunUuid" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" UUID,

    CONSTRAINT "registrasi_pengurus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "registrasi_pengurus_akunUuid_key" ON "registrasi_pengurus"("akunUuid");

-- AddForeignKey
ALTER TABLE "registrasi_pengurus" ADD CONSTRAINT "registrasi_pengurus_cabangUuid_fkey" FOREIGN KEY ("cabangUuid") REFERENCES "Cabang"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registrasi_pengurus" ADD CONSTRAINT "registrasi_pengurus_akunUuid_fkey" FOREIGN KEY ("akunUuid") REFERENCES "Akun"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;
