/*
  Migration: Pindahkan atribut KTA dari tabel registrasi ke tabel Anggota secara aman.
  Perubahan ini menyalin data KTA yang ada sebelum kolom lama dihapus untuk mencegah kehilangan data di Production.
*/

-- 1. Tambah kolom baru di tabel Anggota
ALTER TABLE "Anggota" ADD COLUMN IF NOT EXISTS "fileKtaUrl" TEXT,
ADD COLUMN IF NOT EXISTS "fileKtpUrl" TEXT,
ADD COLUMN IF NOT EXISTS "noKta" TEXT,
ADD COLUMN IF NOT EXISTS "statusKta" TEXT NOT NULL DEFAULT 'INACTIVE',
ADD COLUMN IF NOT EXISTS "tglAktivasiKta" TIMESTAMP(3);

-- 2. SALIN DATA KTA (Jalan otomatis sebelum kolom lama di-drop)
UPDATE "Anggota" a
SET 
  "noKta" = r."noKta",
  "statusKta" = COALESCE(r."statusKta", 'INACTIVE'),
  "fileKtaUrl" = r."fileKtaUrl",
  "tglAktivasiKta" = r."tglAktivasiKta",
  "fileKtpUrl" = r."fileKtpUrl"
FROM "registrasi" r
WHERE a."uuid" = r."anggotaUuid"
  AND r."noKta" IS NOT NULL;

-- 3. Hapus index lama di registrasi
DROP INDEX IF EXISTS "registrasi_noKta_key";

-- 4. Hapus kolom lama di registrasi (SETELAH data berhasil disalin)
ALTER TABLE "registrasi" DROP COLUMN IF EXISTS "fileKtaUrl",
DROP COLUMN IF EXISTS "noKta",
DROP COLUMN IF EXISTS "statusKta",
DROP COLUMN IF EXISTS "tglAktivasiKta";

-- 5. Buat unique index di Anggota
CREATE UNIQUE INDEX IF NOT EXISTS "Anggota_noKta_key" ON "Anggota"("noKta");
