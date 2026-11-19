-- Menambahkan cabangUuid (nullable) pada tabel sejarah & galeri untuk mendukung hierarki CMS DPP/DPD/DPC.
-- Data lama tetap utuh (cabangUuid = NULL dianggap milik Pusat/Nasional).

ALTER TABLE "sejarah" ADD COLUMN "cabangUuid" UUID;
ALTER TABLE "galeri" ADD COLUMN "cabangUuid" UUID;

CREATE INDEX "sejarah_cabangUuid_idx" ON "sejarah"("cabangUuid");
CREATE INDEX "galeri_cabangUuid_idx" ON "galeri"("cabangUuid");

ALTER TABLE "sejarah" ADD CONSTRAINT "sejarah_cabangUuid_fkey"
  FOREIGN KEY ("cabangUuid") REFERENCES "Cabang"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "galeri" ADD CONSTRAINT "galeri_cabangUuid_fkey"
  FOREIGN KEY ("cabangUuid") REFERENCES "Cabang"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;
