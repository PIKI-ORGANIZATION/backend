/*
  Warnings:

  - You are about to drop the column `angkatan` on the `Akun` table. All the data in the column will be lost.
  - You are about to drop the column `asalCabang` on the `Akun` table. All the data in the column will be lost.
  - You are about to drop the column `bidangMinat` on the `Akun` table. All the data in the column will be lost.
  - You are about to drop the column `bidangStudi` on the `Akun` table. All the data in the column will be lost.
  - You are about to drop the column `bio` on the `Akun` table. All the data in the column will be lost.
  - You are about to drop the column `facebook` on the `Akun` table. All the data in the column will be lost.
  - You are about to drop the column `instagram` on the `Akun` table. All the data in the column will be lost.
  - You are about to drop the column `jabatan` on the `Akun` table. All the data in the column will be lost.
  - You are about to drop the column `namaLengkap` on the `Akun` table. All the data in the column will be lost.
  - You are about to drop the column `namaPanggil` on the `Akun` table. All the data in the column will be lost.
  - You are about to drop the column `noWa` on the `Akun` table. All the data in the column will be lost.
  - You are about to drop the column `profileImg` on the `Akun` table. All the data in the column will be lost.
  - You are about to drop the column `statusKeanggotaan` on the `Akun` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[seniorUuid]` on the table `Akun` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `seniorUuid` to the `Akun` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Akun" DROP COLUMN "angkatan",
DROP COLUMN "asalCabang",
DROP COLUMN "bidangMinat",
DROP COLUMN "bidangStudi",
DROP COLUMN "bio",
DROP COLUMN "facebook",
DROP COLUMN "instagram",
DROP COLUMN "jabatan",
DROP COLUMN "namaLengkap",
DROP COLUMN "namaPanggil",
DROP COLUMN "noWa",
DROP COLUMN "profileImg",
DROP COLUMN "statusKeanggotaan",
ADD COLUMN     "seniorUuid" UUID NOT NULL;

-- CreateTable
CREATE TABLE "Senior" (
    "uuid" UUID NOT NULL,
    "namaLengkap" TEXT NOT NULL,
    "namaPanggil" TEXT,
    "bio" TEXT,
    "angkatan" TEXT,
    "jabatan" TEXT,
    "bidangStudi" TEXT,
    "bidangMinat" TEXT,
    "profileImg" TEXT,
    "noWa" TEXT,
    "instagram" TEXT,
    "facebook" TEXT,
    "statusKeanggotaan" TEXT NOT NULL DEFAULT 'NON_MEMBER',
    "cabangUuid" UUID,
    "insert_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "insert_by" UUID,
    "update_at" TIMESTAMP(3) NOT NULL,
    "update_by" UUID,

    CONSTRAINT "Senior_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "Cabang" (
    "uuid" UUID NOT NULL,
    "namaCabang" TEXT NOT NULL,
    "alamat" TEXT,
    "kabupatenKota" TEXT NOT NULL,
    "provinsi" TEXT NOT NULL,
    "wilayah" TEXT,
    "statusCabang" TEXT NOT NULL DEFAULT 'ACTIVE',
    "isCabang" BOOLEAN NOT NULL DEFAULT true,
    "ketuaUuid" UUID,
    "insert_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "insert_by" UUID,
    "update_at" TIMESTAMP(3) NOT NULL,
    "update_by" UUID,

    CONSTRAINT "Cabang_pkey" PRIMARY KEY ("uuid")
);

-- CreateIndex
CREATE UNIQUE INDEX "Cabang_ketuaUuid_key" ON "Cabang"("ketuaUuid");

-- CreateIndex
CREATE UNIQUE INDEX "Akun_seniorUuid_key" ON "Akun"("seniorUuid");

-- AddForeignKey
ALTER TABLE "Akun" ADD CONSTRAINT "Akun_seniorUuid_fkey" FOREIGN KEY ("seniorUuid") REFERENCES "Senior"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Senior" ADD CONSTRAINT "Senior_cabangUuid_fkey" FOREIGN KEY ("cabangUuid") REFERENCES "Cabang"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Senior" ADD CONSTRAINT "Senior_insert_by_fkey" FOREIGN KEY ("insert_by") REFERENCES "Senior"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Senior" ADD CONSTRAINT "Senior_update_by_fkey" FOREIGN KEY ("update_by") REFERENCES "Senior"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cabang" ADD CONSTRAINT "Cabang_ketuaUuid_fkey" FOREIGN KEY ("ketuaUuid") REFERENCES "Akun"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;
