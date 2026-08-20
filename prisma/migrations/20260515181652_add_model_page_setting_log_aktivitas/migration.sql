-- CreateEnum
CREATE TYPE "JenisAktivitas" AS ENUM ('CREATE', 'UPDATE', 'DELETE');

-- CreateTable
CREATE TABLE "pageSetting" (
    "uuid" UUID NOT NULL,
    "keyPage" TEXT NOT NULL,
    "namaPage" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "insert_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "insert_by" UUID,
    "update_at" TIMESTAMP(3) NOT NULL,
    "update_by" UUID,

    CONSTRAINT "pageSetting_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "LogAktivitas" (
    "uuid" UUID NOT NULL,
    "akunUuid" UUID,
    "aktivitas" "JenisAktivitas" NOT NULL,
    "table" TEXT NOT NULL,
    "deskripsi" TEXT NOT NULL,
    "uuidReferensi" TEXT NOT NULL,
    "insert_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LogAktivitas_pkey" PRIMARY KEY ("uuid")
);

-- CreateIndex
CREATE UNIQUE INDEX "pageSetting_keyPage_key" ON "pageSetting"("keyPage");

-- AddForeignKey
ALTER TABLE "LogAktivitas" ADD CONSTRAINT "LogAktivitas_akunUuid_fkey" FOREIGN KEY ("akunUuid") REFERENCES "Akun"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;
