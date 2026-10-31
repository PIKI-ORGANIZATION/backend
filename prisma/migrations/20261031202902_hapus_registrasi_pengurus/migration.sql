-- Fitur registrasi pengurus dihapus (tidak dipakai frontend, tabel kosong di production).
-- Foreign key ke Akun & Cabang ikut terhapus bersama tabel.
DROP TABLE IF EXISTS "registrasi_pengurus";
