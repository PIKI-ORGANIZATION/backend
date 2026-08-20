-- AlterTable
ALTER TABLE "NewsUtama" ADD COLUMN     "durasi_baca" INTEGER,
ADD COLUMN     "jumlah_dibaca" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "jumlah_disukai" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "jumlah_komentar" INTEGER NOT NULL DEFAULT 0;
