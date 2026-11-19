-- Menambahkan cabangUuid (nullable) pada tabel FAQ untuk mendukung hierarki CMS DPP/DPD/DPC.
-- Data lama tetap utuh (cabangUuid = NULL dianggap milik Pusat/Nasional).

ALTER TABLE "FAQ" ADD COLUMN "cabangUuid" UUID;

CREATE INDEX "FAQ_cabangUuid_idx" ON "FAQ"("cabangUuid");

ALTER TABLE "FAQ" ADD CONSTRAINT "FAQ_cabangUuid_fkey"
  FOREIGN KEY ("cabangUuid") REFERENCES "Cabang"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;
