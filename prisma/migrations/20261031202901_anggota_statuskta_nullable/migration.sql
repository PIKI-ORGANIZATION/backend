-- Samakan riwayat migration dengan DB: statusKta di DB (lokal & production) sudah nullable.
-- Jika kolom sudah nullable, perintah ini tidak mengubah apa pun.
ALTER TABLE "Anggota" ALTER COLUMN "statusKta" DROP NOT NULL;
