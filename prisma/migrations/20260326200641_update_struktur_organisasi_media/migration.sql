/*
  Warnings:

  - You are about to drop the column `bidang` on the `StrukturOrganisasi` table. All the data in the column will be lost.
  - You are about to drop the column `namaJabatan` on the `StrukturOrganisasi` table. All the data in the column will be lost.
  - Made the column `albumUuid` on table `MediaGaleri` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `jabatanUuid` to the `StrukturOrganisasi` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "MediaGaleri" DROP CONSTRAINT "MediaGaleri_albumUuid_fkey";

-- AlterTable
ALTER TABLE "MediaGaleri" ALTER COLUMN "albumUuid" SET NOT NULL;

-- AlterTable
ALTER TABLE "StrukturOrganisasi" DROP COLUMN "bidang",
DROP COLUMN "namaJabatan",
ADD COLUMN     "bidangUuid" UUID,
ADD COLUMN     "jabatanUuid" UUID NOT NULL;

-- CreateTable
CREATE TABLE "Jabatan" (
    "uuid" UUID NOT NULL,
    "namaJabatan" TEXT NOT NULL,
    "levelJabatan" INTEGER NOT NULL,
    "insert_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "insert_by" UUID,
    "update_at" TIMESTAMP(3) NOT NULL,
    "update_by" UUID,

    CONSTRAINT "Jabatan_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "Bidang" (
    "uuid" UUID NOT NULL,
    "namaBidang" TEXT NOT NULL,
    "insert_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "insert_by" UUID,
    "update_at" TIMESTAMP(3) NOT NULL,
    "update_by" UUID,

    CONSTRAINT "Bidang_pkey" PRIMARY KEY ("uuid")
);

-- CreateIndex
CREATE UNIQUE INDEX "Jabatan_namaJabatan_key" ON "Jabatan"("namaJabatan");

-- CreateIndex
CREATE UNIQUE INDEX "Bidang_namaBidang_key" ON "Bidang"("namaBidang");

-- AddForeignKey
ALTER TABLE "StrukturOrganisasi" ADD CONSTRAINT "StrukturOrganisasi_jabatanUuid_fkey" FOREIGN KEY ("jabatanUuid") REFERENCES "Jabatan"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StrukturOrganisasi" ADD CONSTRAINT "StrukturOrganisasi_bidangUuid_fkey" FOREIGN KEY ("bidangUuid") REFERENCES "Bidang"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaGaleri" ADD CONSTRAINT "MediaGaleri_albumUuid_fkey" FOREIGN KEY ("albumUuid") REFERENCES "AlbumGaleri"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;
