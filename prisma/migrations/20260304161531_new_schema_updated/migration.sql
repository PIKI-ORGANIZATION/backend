/*
  Warnings:

  - You are about to drop the `VideoDocumentasi` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "VideoDocumentasi" DROP CONSTRAINT "VideoDocumentasi_insert_by_fkey";

-- DropTable
DROP TABLE "VideoDocumentasi";

-- CreateTable
CREATE TABLE "VideoDokumentasi" (
    "uuid" UUID NOT NULL,
    "judul" TEXT NOT NULL,
    "deskripsi" TEXT,
    "urlVideo" TEXT NOT NULL,
    "thumbnail" TEXT,
    "tanggal" TIMESTAMP(3) NOT NULL,
    "durasi" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "statusVideo" TEXT NOT NULL DEFAULT 'ACTIVE',
    "insert_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "insert_by" UUID,
    "update_at" TIMESTAMP(3) NOT NULL,
    "update_by" UUID,

    CONSTRAINT "VideoDokumentasi_pkey" PRIMARY KEY ("uuid")
);

-- AddForeignKey
ALTER TABLE "VideoDokumentasi" ADD CONSTRAINT "VideoDokumentasi_insert_by_fkey" FOREIGN KEY ("insert_by") REFERENCES "Akun"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;
