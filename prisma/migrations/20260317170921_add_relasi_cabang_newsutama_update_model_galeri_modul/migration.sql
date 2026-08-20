/*
  Warnings:

  - You are about to drop the `AlbumFoto` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `FotoKegiatan` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `VideoDokumentasi` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "AlbumFoto" DROP CONSTRAINT "AlbumFoto_insert_by_fkey";

-- DropForeignKey
ALTER TABLE "FotoKegiatan" DROP CONSTRAINT "FotoKegiatan_albumUuid_fkey";

-- DropForeignKey
ALTER TABLE "VideoDokumentasi" DROP CONSTRAINT "VideoDokumentasi_insert_by_fkey";

-- AlterTable
ALTER TABLE "AgendaKegiatan" ALTER COLUMN "statusAgenda" SET DEFAULT 'SEGERA';

-- AlterTable
ALTER TABLE "NewsUtama" ADD COLUMN     "cabangUuid" UUID;

-- DropTable
DROP TABLE "AlbumFoto";

-- DropTable
DROP TABLE "FotoKegiatan";

-- DropTable
DROP TABLE "VideoDokumentasi";

-- CreateTable
CREATE TABLE "AlbumGaleri" (
    "uuid" UUID NOT NULL,
    "namaAlbum" TEXT NOT NULL,
    "deskripsi" TEXT,
    "tanggalKegiatan" TIMESTAMP(3) NOT NULL,
    "coverMedia" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "statusAlbum" TEXT NOT NULL DEFAULT 'ACTIVE',
    "cabangUuid" UUID,
    "insert_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "insert_by" UUID,
    "update_at" TIMESTAMP(3) NOT NULL,
    "update_by" UUID,

    CONSTRAINT "AlbumGaleri_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "MediaGaleri" (
    "uuid" UUID NOT NULL,
    "tipeMedia" TEXT NOT NULL,
    "urlMedia" TEXT NOT NULL,
    "thumbnail" TEXT,
    "keterangan" TEXT,
    "urutan" INTEGER NOT NULL DEFAULT 0,
    "durasi" TEXT,
    "albumUuid" UUID,
    "insert_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "insert_by" UUID,
    "update_at" TIMESTAMP(3) NOT NULL,
    "update_by" UUID,

    CONSTRAINT "MediaGaleri_pkey" PRIMARY KEY ("uuid")
);

-- CreateIndex
CREATE INDEX "AlbumGaleri_cabangUuid_idx" ON "AlbumGaleri"("cabangUuid");

-- CreateIndex
CREATE INDEX "MediaGaleri_albumUuid_idx" ON "MediaGaleri"("albumUuid");

-- AddForeignKey
ALTER TABLE "AlbumGaleri" ADD CONSTRAINT "AlbumGaleri_cabangUuid_fkey" FOREIGN KEY ("cabangUuid") REFERENCES "Cabang"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlbumGaleri" ADD CONSTRAINT "AlbumGaleri_insert_by_fkey" FOREIGN KEY ("insert_by") REFERENCES "Akun"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaGaleri" ADD CONSTRAINT "MediaGaleri_albumUuid_fkey" FOREIGN KEY ("albumUuid") REFERENCES "AlbumGaleri"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaGaleri" ADD CONSTRAINT "MediaGaleri_insert_by_fkey" FOREIGN KEY ("insert_by") REFERENCES "Akun"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsUtama" ADD CONSTRAINT "NewsUtama_cabangUuid_fkey" FOREIGN KEY ("cabangUuid") REFERENCES "Cabang"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;
