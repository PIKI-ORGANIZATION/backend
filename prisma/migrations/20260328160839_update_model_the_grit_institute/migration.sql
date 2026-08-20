/*
  Warnings:

  - You are about to drop the column `deskripsi` on the `Kelas` table. All the data in the column will be lost.
  - You are about to drop the column `layananUuid` on the `Kelas` table. All the data in the column will be lost.
  - You are about to drop the column `mentorUuid` on the `Kelas` table. All the data in the column will be lost.
  - You are about to drop the `LayananEdukasi` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[kelasUuid]` on the table `NewsUtama` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Kelas" DROP CONSTRAINT "Kelas_layananUuid_fkey";

-- DropForeignKey
ALTER TABLE "Kelas" DROP CONSTRAINT "Kelas_mentorUuid_fkey";

-- DropForeignKey
ALTER TABLE "LayananEdukasi" DROP CONSTRAINT "LayananEdukasi_insert_by_fkey";

-- AlterTable
ALTER TABLE "Kelas" DROP COLUMN "deskripsi",
DROP COLUMN "layananUuid",
DROP COLUMN "mentorUuid",
ADD COLUMN     "deskripsiKelas" TEXT,
ALTER COLUMN "harga" SET DEFAULT 0.0;

-- AlterTable
ALTER TABLE "NewsUtama" ADD COLUMN     "kelasUuid" UUID;

-- DropTable
DROP TABLE "LayananEdukasi";

-- CreateTable
CREATE TABLE "TopikEdukasi" (
    "uuid" UUID NOT NULL,
    "namaTopikEdukasi" TEXT NOT NULL,
    "deskripsiTopikEdukasi" TEXT,
    "targetPeserta" TEXT,
    "thumbnailTopikEdukasi" TEXT,
    "statusTopikEdukasi" TEXT NOT NULL DEFAULT 'ACTIVE',
    "insert_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "insert_by" UUID,
    "update_at" TIMESTAMP(3) NOT NULL,
    "update_by" UUID,

    CONSTRAINT "TopikEdukasi_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "KelasMentor" (
    "uuid" UUID NOT NULL,
    "kelasUuid" UUID NOT NULL,
    "mentorUuid" UUID NOT NULL,
    "role" TEXT,
    "insert_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KelasMentor_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "KelasTopikEdukasi" (
    "uuid" UUID NOT NULL,
    "kelasUuid" UUID NOT NULL,
    "topikEdukasiUuid" UUID NOT NULL,
    "insert_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KelasTopikEdukasi_pkey" PRIMARY KEY ("uuid")
);

-- CreateIndex
CREATE UNIQUE INDEX "KelasMentor_kelasUuid_mentorUuid_key" ON "KelasMentor"("kelasUuid", "mentorUuid");

-- CreateIndex
CREATE UNIQUE INDEX "KelasTopikEdukasi_kelasUuid_topikEdukasiUuid_key" ON "KelasTopikEdukasi"("kelasUuid", "topikEdukasiUuid");

-- CreateIndex
CREATE UNIQUE INDEX "NewsUtama_kelasUuid_key" ON "NewsUtama"("kelasUuid");

-- AddForeignKey
ALTER TABLE "TopikEdukasi" ADD CONSTRAINT "TopikEdukasi_insert_by_fkey" FOREIGN KEY ("insert_by") REFERENCES "Akun"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KelasMentor" ADD CONSTRAINT "KelasMentor_kelasUuid_fkey" FOREIGN KEY ("kelasUuid") REFERENCES "Kelas"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KelasMentor" ADD CONSTRAINT "KelasMentor_mentorUuid_fkey" FOREIGN KEY ("mentorUuid") REFERENCES "Mentor"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KelasTopikEdukasi" ADD CONSTRAINT "KelasTopikEdukasi_kelasUuid_fkey" FOREIGN KEY ("kelasUuid") REFERENCES "Kelas"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KelasTopikEdukasi" ADD CONSTRAINT "KelasTopikEdukasi_topikEdukasiUuid_fkey" FOREIGN KEY ("topikEdukasiUuid") REFERENCES "TopikEdukasi"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsUtama" ADD CONSTRAINT "NewsUtama_kelasUuid_fkey" FOREIGN KEY ("kelasUuid") REFERENCES "Kelas"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;
