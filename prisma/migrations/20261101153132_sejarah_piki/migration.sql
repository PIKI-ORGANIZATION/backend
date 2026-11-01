-- CMS Sejarah PIKI: tabel "SejarahCabang" diganti menjadi "sejarah" (nasional, tanpa relasi ke Cabang).
-- Data lama (seed proyek lain) dihapus; sejarah PIKI diisi ulang oleh admin DPP.

-- Hapus data lama
DELETE FROM "SejarahCabang";

-- Lepas relasi ke Cabang
ALTER TABLE "SejarahCabang" DROP CONSTRAINT "SejarahCabang_cabang_uuid_fkey";
ALTER TABLE "SejarahCabang" DROP COLUMN "cabang_uuid";

-- Ganti nama kolom status & tambah kolom baru
ALTER TABLE "SejarahCabang" RENAME COLUMN "statusSejarahCabang" TO "statusSejarah";
ALTER TABLE "SejarahCabang" ADD COLUMN "judul" TEXT NOT NULL;
ALTER TABLE "SejarahCabang" ADD COLUMN "urutan" INTEGER;

-- Ganti nama tabel & primary key
ALTER TABLE "SejarahCabang" RENAME TO "sejarah";
ALTER TABLE "sejarah" RENAME CONSTRAINT "SejarahCabang_pkey" TO "sejarah_pkey";
