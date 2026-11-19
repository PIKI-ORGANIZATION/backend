-- Samakan status Sejarah menjadi DRAFT | PUBLISHED | ARCHIVED (default DRAFT)
-- serta tambahkan soft delete (deleted_at, deleted_by) seperti Galeri.

-- 1. Konversi data lama: ACTIVE -> PUBLISHED, NON_ACTIVE -> ARCHIVED
UPDATE "sejarah"
SET "statusSejarah" = CASE
  WHEN "statusSejarah" = 'ACTIVE' THEN 'PUBLISHED'
  WHEN "statusSejarah" = 'NON_ACTIVE' THEN 'ARCHIVED'
  ELSE "statusSejarah"
END
WHERE "statusSejarah" IN ('ACTIVE', 'NON_ACTIVE');

-- 2. Ubah default statusSejarah menjadi DRAFT & tambahkan kolom soft delete
ALTER TABLE "sejarah"
  ALTER COLUMN "statusSejarah" SET DEFAULT 'DRAFT',
  ADD COLUMN "deleted_at" TIMESTAMP(3),
  ADD COLUMN "deleted_by" UUID;
