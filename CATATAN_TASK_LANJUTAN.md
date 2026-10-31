# Catatan Task Lanjutan (Backend PIKI)

Daftar pekerjaan yang sudah disepakati untuk **ditunda**. Kerjakan berurutan sesuai prioritas.

---

## 1. Verifikasi registrasi anggota per wilayah (DPP / DPD / DPC)

**Status sekarang (production):** registrasi baru langsung berstatus `PENDING_VERIFIKASI_DPP`, satu kali ACC langsung mengaktifkan KTA. Belum ada pembagian wilayah.

**Yang disepakati:**
- Tetap **satu kali ACC** (bukan berjenjang).
- Hak ACC:
  - **DPP (superadmin)**: semua pendaftar.
  - **DPD**: pendaftar di provinsinya (`registrasi.kode_provinsi`).
  - **DPC**: pendaftar di kabupaten/kotanya (`registrasi.kode_kabupaten`).
- **List pendaftar** (`GET /api/v1/registrasi`) ikut difilter per wilayah dengan aturan yang sama. Saat ini filter memakai `cabangUuid` yang selalu kosong di data registrasi.
- Status hasil ACC (`APPROVED_DPC` / `APPROVED_DPD` / `APPROVED_DPP`) ditentukan otomatis sesuai level verifikator.

**Celah keamanan di endpoint verifikasi** (`PATCH /api/v1/registrasi/:id/verifikasi`, `src/controllers/registrasi.controller.ts`) yang ikut diperbaiki:
- `status` hasil verifikasi dikirim dari body (frontend), bisa diisi bebas.
- `verifikatorUuid` dan `actorNama` diambil dari body, bukan dari token login.
- Tidak ada pengecekan wilayah: semua akun dengan permission `REGISTRASI_APPROVE` (termasuk 10 akun demo PNPS `ADMIN_CABANG`/`KETUA_CABANG`) bisa ACC registrasi mana pun.

**Catatan data:** di production hanya 29/65 registrasi punya `kode_provinsi` dan 21/65 punya `kode_kabupaten`. Registrasi tanpa kode hanya bisa di-ACC DPP. Registrasi baru sudah otomatis dilengkapi kodenya oleh backend (`lengkapiKodeWilayah` di `src/services/registrasi.service.ts`).

Hierarki akun DPD/DPC (`Akun.cabangUuid` → `Cabang.dpdId` / `Cabang.dpcId`, token `tingkat`/`dpdId`/`dpcId`) **sudah tersedia** dari task CRUD DPD/DPC dan bisa langsung dipakai.

---

## 2. CMS Sejarah PIKI (khusus admin DPP)

- CRUD konten sejarah PIKI, hanya untuk DPP.
- API publik untuk tampilan web. Saat ini `GET /api/v1/page/history` dan bagian `history` di `GET /api/v1/page/home` masih mengembalikan array kosong (stub di `src/controllers/page.controller.ts`).
- Opsi yang pernah dibahas: memakai ulang `SejarahCabang` milik cabang "DPP Pusat", kemungkinan perlu kolom `urutan`.

---

## 3. Integrasi beranda dengan Instagram & YouTube (CRUD admin pusat)

- **YouTube** sudah berjalan: `GET /api/v1/youtube/videos` membaca channel dari page setting `land-youtube`.
- **Instagram** belum ada. Opsi yang pernah dibahas:
  - **Manual (disarankan):** admin DPP menyimpan link post IG, frontend menampilkan sebagai embed.
  - **Otomatis:** Instagram Graph API (butuh akun Business/Creator, Meta App, token diperbarui tiap 60 hari).
- Perlu diputuskan apakah YouTube juga butuh fitur video pilihan (pinned) oleh admin.

---

## Temuan lain (belum dijadwalkan)

- Tabel `Cabang` di production berisi data bawaan proyek lain (duplikat Jakarta/Surabaya/Yogyakarta/Bandung/Kupang dan "PNPS Pusat"). **Dibiarkan**, jangan dihapus.
- Endpoint `POST /api/v1/akuns/:uuid/update` mengganti seluruh role (replace). Frontend wajib mengirim daftar role lengkap, contoh `[USER, KETUA_CABANG]`.
