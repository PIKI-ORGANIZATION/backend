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

## 2. ~~CMS Sejarah PIKI~~ ✅ Selesai

Modul `/api/v1/sejarah` (tabel `sejarah`). Sisa pekerjaan di luar backend:
- Frontend `HistorySection.tsx` masih memakai timeline hardcoded, perlu diganti memanggil `GET /api/v1/sejarah` atau `GET /api/v1/page/history`.
- Setelah deploy, tabel `sejarah` di production kosong. Admin DPP perlu mengisi timeline lewat CMS.

---

## 3. ~~Integrasi beranda dengan Instagram & YouTube~~ ✅ Selesai

Modul `/api/v1/sosmed` (tabel `sosmed`). Endpoint lama `/api/v1/youtube/videos` sudah dihapus. Sisa pekerjaan di luar backend:
- Frontend menampilkan konten dari `GET /api/v1/sosmed?platform=YOUTUBE|INSTAGRAM&penempatan=BERANDA|GALERI` (iframe `embedUrl`). Tab YouTube di halaman Galeri masih placeholder.
- CMS frontend: form input link + pratinjau via `POST /api/v1/sosmed/preview`.
- Page setting `land-youtube` (di DB & `prisma/seedPageSetting.ts`) sudah tidak dipakai backend, dibiarkan agar data/seed tidak berubah.

---

## ⚠️ Checklist deploy production

Urutan perintah di server (`/var/www/backend/backend`, proses pm2 `piki-backend`):

```bash
git pull                                                  # branch yang di-deploy
bun install
bun scripts/with-db-url.ts bunx prisma migrate deploy     # DB dulu
bun run db:generate
bun run build
pm2 restart piki-backend                                  # kode baru terakhir
```

1. **Migrate lalu langsung build & restart.** Migration `sejarah_piki` me-rename tabel `SejarahCabang` → `sejarah`, sehingga di antara `migrate deploy` dan `pm2 restart` endpoint cabang & sejarah pada kode lama akan error. Jangan pakai `migrate dev` / `bun run db:migrate` di server.
2. **Ubah `.env` server sebelum restart:** `JWT_EXPIRES_IN=1d` (sebelumnya `7d`). `.env` tidak ikut git, jadi harus diubah manual di server. Token lama tetap berlaku sampai kedaluwarsa; token baru berlaku 1 hari.
3. **Akun demo PNPS.** Di production ada 10 akun demo PNPS (`admin_<kota>@pnps.id`, `ketua_<kota>@pnps.id`) dengan role `ADMIN_CABANG`/`KETUA_CABANG` dan password default dari seed. Sejak permission `SEJARAH_MANAGE` & `SOSMED_MANAGE` diberikan ke kedua role tersebut, akun-akun ini **bisa mengubah Sejarah PIKI dan konten sosmed di landing page nasional**. Tim perlu menonaktifkan (`statusAkun = INACTIVE`) atau mengganti password akun tersebut.
4. **Setelah deploy:** tabel `sejarah` & `sosmed` kosong, admin mengisi lewat CMS. Semua user perlu login ulang agar token memuat permission & data cabang terbaru.

Catatan: `prisma/seed.ts` belum memuat permission `SEJARAH_MANAGE` & `SOSMED_MANAGE` (seed sengaja tidak diubah); permission diberikan lewat migration `permission_sejarah_sosmed`. Di environment yang dibuat dari nol, migration berjalan sebelum role dibuat seed, sehingga kedua permission belum tertaut ke role.

---

## Temuan lain (belum dijadwalkan)

- Tabel `Cabang` di production berisi data bawaan proyek lain (duplikat Jakarta/Surabaya/Yogyakarta/Bandung/Kupang dan "PNPS Pusat"). **Dibiarkan**, jangan dihapus.
- Endpoint `POST /api/v1/akuns/:uuid/update` mengganti seluruh role (replace). Frontend wajib mengirim daftar role lengkap, contoh `[USER, KETUA_CABANG]`.
- Penyeragaman status: Sejarah masih `ACTIVE`/`NON_ACTIVE`, sedangkan Berita & Sosmed memakai `DRAFT`/`PUBLISHED`/`ARCHIVED`. Seragamkan nanti jika diperlukan.
