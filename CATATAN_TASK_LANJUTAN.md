# Catatan Backend PIKI — Perubahan, Panduan Tim & Dokumentasi API

Dokumen ini untuk **tim developer** (backend/frontend) dan **tim ops**. Berisi:

1. [Ringkasan perubahan](#1-ringkasan-perubahan)
2. [Panduan developer setelah `git pull`](#2-panduan-developer-setelah-git-pull)
3. [Panduan deploy production (tim ops)](#3-panduan-deploy-production-tim-ops)
4. [Dokumentasi API](#4-dokumentasi-api)
5. [Task lanjutan (ditunda)](#5-task-lanjutan-ditunda)
6. [Temuan lain](#6-temuan-lain)

Production saat dokumen ini ditulis menjalankan commit `8aabe47` (branch `main`). Semua perubahan di bawah ada di branch `dev`.

---

## 1. Ringkasan perubahan

| Commit | Perubahan | Migration |
|---|---|---|
| `96c5e32` | CRUD DPD & DPC dengan hierarki akses DPP/DPD/DPC; akun admin bisa ditautkan ke Cabang; Cabang bisa ditautkan ke DPD/DPC | `20261031192351_dpd_dpc_hierarki` |
| `5d4cc9f` | `Anggota.statusKta` jadi nullable (menyamakan schema dengan DB) | `20261031202901_anggota_statuskta_nullable` |
| `1cf56e0` | Hapus modul & tabel `registrasi_pengurus` | `20261031202902_hapus_registrasi_pengurus` |
| `09b1470` | Role `USER` (anggota) dicabut semua permission-nya: hanya bisa lihat/ubah data diri & KTA | `20261031202903_cabut_permission_user` |
| `cefd928` | Kode wilayah registrasi anggota dilengkapi otomatis | – |
| `bccd299` | CMS Sejarah PIKI (`SejarahCabang` → tabel `sejarah`, tanpa relasi cabang) | `20261101153132_sejarah_piki` |
| `0e33f99` | CMS Sosmed (Instagram & YouTube); hapus `/api/v1/youtube/videos` | `20261101163806_sosmed` |
| `3099777` | Akses CMS Sejarah & Sosmed untuk `ADMIN_CABANG` & `KETUA_CABANG` | `20261101165640_permission_sejarah_sosmed` |
| (galeri) | **CMS Galeri** (foto, video YouTube/upload, post Instagram) **menggantikan Sosmed**; upload video 50MB; `SOSMED_MANAGE` → `GALERI_MANAGE` | `20261102001841_galeri_ganti_sosmed` |

Selain itu, migration lama `20260927142556` (pindah atribut KTA dari `registrasi` ke `Anggota`) **belum pernah dijalankan di production** dan akan ikut jalan saat deploy berikutnya. Datanya sudah diverifikasi aman (semua nomor KTA sudah ada di `Anggota`).

### Endpoint yang dihapus / berubah perilaku

| Endpoint | Perubahan | Dampak frontend |
|---|---|---|
| `/api/v1/registrasi-pengurus/*` | **Dihapus** | Tidak dipakai frontend |
| `/api/v1/sejarah-cabang/*` | **Dihapus**, diganti `/api/v1/sejarah` | Tidak dipakai frontend |
| `/api/v1/youtube/videos` | **Dihapus**, diganti `/api/v1/galeri` | Tidak dipakai frontend |
| `/api/v1/sosmed/*` | Dibuat lalu **dihapus** (belum pernah di production), diganti `/api/v1/galeri` | – |
| `POST /api/v1/upload/video` | **Baru**: upload video galeri (mp4/webm/mov, maks 50MB) | Dipakai form Galeri tab Video |
| `GET /api/v1/dpd`, `GET /api/v1/dpd-dpc` | Sebelumnya publik, sekarang **wajib login** sesuai hierarki | Tidak dipakai frontend (registrasi memakai `/master-wilayah`) |
| `DELETE /api/v1/dpd/:id`, `/dpd-dpc/:id` | Sekarang **soft delete** (data tidak hilang) | – |
| `GET /api/v1/cabang`, `/cabang/:uuid` | Field `sejarahCabang` tidak ada lagi di response | Tidak dipakai frontend |
| `GET /api/v1/page/history`, `history` di `/page/home` | Sekarang berisi data tabel `sejarah` (sebelumnya selalu `[]`) | – |
| Token login (JWT) | Tambahan field `tingkat`, `dpdId`, `dpcId`; masa berlaku menjadi **1 hari** (via `.env`) | User login ulang tiap hari |
| Semua endpoint admin | Akun ber-role `USER` saja sekarang ditolak `403` | Portal anggota tetap jalan (`/auth/me`, `/auth/profile`, `/auth/change-password`, `/kta/download`) |

---

## 2. Panduan developer setelah `git pull`

Proyek memakai **Bun** (lihat `bun.lock`). **Jangan pakai `npm install`** agar tidak muncul `package-lock.json` dan versi dependency tidak berbeda.

```bash
cd backend
git checkout dev
git pull

bun install                                              # 1. dependency (saat ini tidak ada dependency baru)
bun scripts/with-db-url.ts bunx prisma migrate deploy    # 2. jalankan migration baru ke DB lokal
bun run db:generate                                      # 3. generate ulang Prisma Client
bun run dev                                              # 4. jalankan server (port dari .env, default 3000)
```

**Penting:**
- **Pakai `migrate deploy` untuk menerapkan migration dari repo.** Jangan `bun run db:migrate` (`migrate dev`) untuk itu: jika DB lokal berbeda dengan riwayat migration, `migrate dev` akan menawarkan **reset DB (semua data hilang)**.
- `bun run db:migrate` hanya dipakai saat **membuat migration baru** setelah mengubah `schema.prisma` (sebaiknya dengan `--create-only` lalu cek isi SQL-nya).
- **Jangan jalankan `bun run seed` di DB yang sudah berisi data.** Seed menambah data dummy (cabang, akun demo, berita) di atas data yang ada.
- Ubah `.env` lokal: **`JWT_EXPIRES_IN=1d`**. `.env` tidak ikut git.
- Cek status migration kapan saja: `bun run db:migrate:status` (harus "Database schema is up to date!").
- Ingin data lokal sama dengan production? Restore backup ke DB lokal (bukan ke production):
  ```bash
  pg_dump -Fc -d piki_db -f ~/piki_db_lokal_backup.backup     # backup lokal dulu
  pg_restore --clean --if-exists --no-owner --no-privileges -d piki_db <file-backup-production>
  bun scripts/with-db-url.ts bunx prisma migrate deploy
  bun run db:generate
  ```

---

## 3. Panduan deploy production (tim ops)

Server: `/var/www/backend/backend`, dijalankan pm2 dengan nama **`piki-backend`** (`bun dist/server.js`).

### 3.1 Kenapa urutan penting
- Kode baru membaca kolom/tabel baru. **Kode baru + DB lama = crash** (login gagal untuk semua user, endpoint cabang error).
- DB baru + kode lama **sebagian besar aman**, kecuali migration `sejarah_piki` yang me-rename tabel: di antara `migrate deploy` dan `pm2 restart`, endpoint `/cabang` & `/sejarah-cabang` kode lama akan error. Maka **migrate → build → restart harus berurutan tanpa jeda**.
- Selama `bun run build`, server lama tetap jalan memakai `dist/` lama sampai `pm2 restart`.

### 3.2 Sebelum deploy (wajib)

1. **Merge `dev` → `main`** (jika production deploy dari `main`) dan pastikan CI/review sudah OK.
2. **Backup database production** (wajib, karena ada migration yang menghapus data — lihat 3.5):
   ```bash
   pg_dump -Fc -d piki_db -f /root/backup/piki_db_$(date +%Y%m%d_%H%M)_sebelum_deploy.backup
   ```
3. **Catat commit yang sedang jalan** untuk rollback:
   ```bash
   cd /var/www/backend/backend && git log -1 --oneline      # saat ini: 8aabe47
   ```
4. **Cek data aman untuk unique index baru** (hasil harus **0 baris**):
   ```sql
   SELECT "kodeProvinsi", COUNT(*) FROM dpd WHERE "kodeProvinsi" IS NOT NULL GROUP BY 1 HAVING COUNT(*) > 1;
   SELECT kode_kabupaten, COUNT(*) FROM dpd_dpc WHERE kode_kabupaten IS NOT NULL GROUP BY 1 HAVING COUNT(*) > 1;
   ```
   (Sudah dicek pada backup 29-10-2026: 0 duplikat.)
5. **Cek migration yang akan jalan**:
   ```bash
   bun scripts/with-db-url.ts bunx prisma migrate status
   ```
   Harus menampilkan **9 migration belum diterapkan**: `20260927142556` (KTA) + 8 migration di tabel bagian 1.
6. **Upload video Galeri (maks 50MB)** — naikkan batas upload di nginx (blok server API) lalu reload nginx, kalau tidak upload video > 1MB ditolak nginx (`413`):
   ```nginx
   client_max_body_size 50M;
   ```
   Pantau juga kapasitas disk folder `uploads/` (video disimpan di `uploads/video/`). Folder ini tidak ikut git, ikutkan dalam backup server.
7. **Akun demo PNPS** (10 akun `admin_<kota>@pnps.id` & `ketua_<kota>@pnps.id`, password default dari seed) — setelah deploy mereka **bisa mengubah Sejarah & Galeri nasional**. Nonaktifkan atau ganti password sebelum/segera setelah deploy:
   ```sql
   UPDATE "Akun" SET "statusAkun" = 'INACTIVE' WHERE email LIKE '%@pnps.id';
   ```
   (Keputusan ada di tim; query ini tidak dijalankan otomatis.)
8. Jika ada `package-lock.json` tak ter-track di server (bekas `npm install`), jangan dipakai; gunakan `bun install`.

### 3.3 Langkah deploy

```bash
cd /var/www/backend/backend

git fetch origin
git checkout main && git pull origin main          # sesuaikan branch yang di-deploy

bun install                                         # dependency
# ── mulai dari sini jalankan berurutan tanpa jeda ──
bun scripts/with-db-url.ts bunx prisma migrate deploy
bun run db:generate
bun run build
```

Ubah `.env` server **sebelum restart**:
```
JWT_EXPIRES_IN=1d
```

Lalu:
```bash
pm2 restart piki-backend
pm2 logs piki-backend --lines 50                   # pastikan "Server running on port ..." tanpa error
```

⚠️ **Jangan** menjalankan `migrate dev`, `bun run db:migrate`, `prisma db push`, atau `bun run seed` di production.

### 3.4 Verifikasi setelah deploy

```bash
BASE=https://<domain-api>/api/v1     # atau http://localhost:<PORT>/api/v1 di server

curl -s -o /dev/null -w "%{http_code}\n" $BASE/master-wilayah/master-provinsi   # 200
curl -s -o /dev/null -w "%{http_code}\n" $BASE/master-wilayah/dpd              # 200 (dropdown registrasi)
curl -s -o /dev/null -w "%{http_code}\n" $BASE/cabang                          # 200
curl -s -o /dev/null -w "%{http_code}\n" $BASE/sejarah                         # 200
curl -s -o /dev/null -w "%{http_code}\n" $BASE/galeri                          # 200
curl -s -o /dev/null -w "%{http_code}\n" $BASE/news-utama                      # 200
curl -s -o /dev/null -w "%{http_code}\n" $BASE/dpd                             # 401 (wajib login)
bun scripts/with-db-url.ts bunx prisma migrate status                           # "Database schema is up to date!"
```

Lalu cek manual:
- Login sebagai superadmin DPP dan sebagai anggota → berhasil.
- Anggota tetap bisa buka profil & download KTA.
- Halaman registrasi anggota: dropdown DPD/DPC tetap muncul.

Setelah deploy: semua user perlu **login ulang** (token lama tidak membawa field baru). Tabel `sejarah` & `galeri` masih kosong, diisi admin lewat CMS.

### 3.5 Migration yang mengubah/menghapus data

| Migration | Yang terjadi |
|---|---|
| `20260927142556` | Salin data KTA `registrasi` → `Anggota`, lalu **hapus 4 kolom KTA** di `registrasi` |
| `20261031202902_hapus_registrasi_pengurus` | **DROP TABLE** `registrasi_pengurus` (kosong di production) |
| `20261031202903_cabut_permission_user` | **Hapus** semua permission role `USER` dari `PermissionRole` |
| `20261101153132_sejarah_piki` | **Hapus semua data** `SejarahCabang` (data seed proyek lain), rename tabel → `sejarah` |

| `20261102001841_galeri_ganti_sosmed` | **DROP TABLE** `sosmed` (tidak pernah ada di production), buat tabel `galeri`, ganti nama permission `SOSMED_MANAGE` → `GALERI_MANAGE` |

Migration lain hanya menambah kolom/tabel/permission (aman).

### 3.6 Rollback

- **Masalah di kode, DB sudah termigrasi:** kembalikan kode ke commit sebelumnya **tidak disarankan** karena kode lama mencari tabel `SejarahCabang` yang sudah tidak ada. Lebih aman perbaiki maju (hotfix) di branch baru.
- **Perlu kembali total ke kondisi sebelum deploy:**
  ```bash
  pm2 stop piki-backend
  pg_restore --clean --if-exists -d piki_db /root/backup/piki_db_<timestamp>_sebelum_deploy.backup
  git checkout 8aabe47                       # commit sebelum deploy (lihat 3.2 no. 3)
  bun install && bun run db:generate && bun run build
  pm2 restart piki-backend
  ```
  Kembalikan juga `.env` (`JWT_EXPIRES_IN`) jika perlu.

---

## 4. Dokumentasi API

Base URL: `/api/v1`. Autentikasi: header `Authorization: Bearer <accessToken>` (dari `POST /auth/login`).

Format error umum: `{ "success": false, "message": "...", "data": null }` atau `{ "message": "..." }`.
Kode status: `400` validasi/data salah, `401` belum login/token tidak valid, `403` tidak punya akses, `404` tidak ditemukan, `409` data bentrok/duplikat.

### 4.1 Hak akses & token

| Role | Permission kunci | Keterangan |
|---|---|---|
| `SUPER_ADMIN` (DPP) | `MANAGE_ALL_CABANG` + semua | Akses penuh |
| `ADMIN_CABANG` | `SEJARAH_MANAGE`, `GALERI_MANAGE`, `CABANG_UPDATE`, dll | Admin DPD/DPC jika akunnya ditautkan ke Cabang |
| `KETUA_CABANG` | `SEJARAH_MANAGE`, `GALERI_MANAGE`, `CABANG_UPDATE`, dll | Sama seperti admin cabang |
| `USER` (anggota) | – (tidak ada) | Hanya data diri & KTA |

Payload token login (field baru ditandai ★):

```json
{
  "sub": "<uuid akun>",
  "roles": ["USER", "ADMIN_CABANG"],
  "permissions": ["..."],
  "cabangId": "<uuid cabang | null>",
  "cabang": "<nama cabang | null>",
  "tingkat": "DPD | DPC | null",   // ★ dari Cabang.dpdId / Cabang.dpcId
  "dpdId": "<uuid | null>",        // ★
  "dpcId": 12,                     // ★ number | null
  "exp": 0
}
```

`cabangId` diambil dari `Akun.cabangUuid` (akun admin) jika ada, jika tidak dari cabang data Anggota (perilaku lama). Perubahan role/cabang baru berlaku setelah **login ulang**.

### 4.2 Alur menjadikan anggota admin DPD/DPC (oleh DPP)

1. Buat DPD/DPC → `POST /dpd` atau `POST /dpd-dpc`.
2. Buat profil Cabang dan tautkan → `POST /cabang` dengan `dpdId` **atau** `dpcId`.
3. Ubah akun anggota → `POST /akuns/:uuid/update` dengan `roleUuids` lengkap + `cabangUuid`:
   ```json
   { "roleUuids": ["<uuid USER>", "<uuid KETUA_CABANG>"], "cabangUuid": "<uuid cabang>" }
   ```
   ⚠️ `roleUuids` **mengganti seluruh role** (replace), jadi sertakan `USER` agar tidak hilang.
4. Anggota login ulang.

### 4.3 DPD — `/api/v1/dpd`

Satu DPD per provinsi. Nama DPD diisi otomatis dari `data_master_wilayah`.

| Method | Endpoint | Akses |
|---|---|---|
| GET | `/dpd` | DPP: semua · admin DPD: dirinya · lainnya `403` |
| GET | `/dpd/:id` | Sama seperti di atas (di luar scope → `404`) |
| POST | `/dpd` | DPP |
| PATCH | `/dpd/:id` | DPP: semua field · admin DPD: dirinya, field terbatas |
| DELETE | `/dpd/:id` | DPP (soft delete) |

Query list: `search`, `currentPage` (default 1), `pageSize` (default 10, maks 100).

```http
POST /api/v1/dpd
{ "kodeProvinsi": "12", "pengurus": "Nama Ketua", "noHandphone": "0812...", "keterangan": "Definitif", "penerbitanSk": "SK-001" }
```
- `kodeProvinsi` wajib; tidak ada di master → `400`; sudah ada → `409`.
- PATCH oleh DPD sendiri hanya boleh: `pengurus`, `noHandphone`, `keterangan`, `penerbitanSk` (field lain → `400`).

Response list:
```json
{ "success": true, "message": "Berhasil mengambil data DPD", "data": [ { "id": "uuid", "kodeProvinsi": "12", "dpd": "Sumatera Utara", "pengurus": "...", "noHandphone": "...", "keterangan": "...", "penerbitanSk": "...", "createdAt": "...", "updatedAt": "...", "deletedAt": null } ], "meta": { "total": 38, "page": 1, "limit": 10 } }
```

### 4.4 DPC — `/api/v1/dpd-dpc`

Satu DPC per kabupaten/kota. `dpc`, `dpd`, `kode_provinsi` diisi otomatis dari `data_master_wilayah`. `id` berupa angka.

| Method | Endpoint | Akses |
|---|---|---|
| GET | `/dpd-dpc` | DPP: semua · admin DPD: DPC se-provinsinya · admin DPC: dirinya |
| GET | `/dpd-dpc/:id` | Sama seperti di atas (di luar scope → `404`) |
| POST | `/dpd-dpc` | DPP |
| PATCH | `/dpd-dpc/:id` | DPP: semua field · admin DPC: dirinya, field terbatas · admin DPD: `403` |
| DELETE | `/dpd-dpc/:id` | DPP (soft delete) |

Query list: `search`, `kode_provinsi`, `currentPage`, `pageSize`.

```http
POST /api/v1/dpd-dpc
{ "kode_kabupaten": "12.71", "pengurus": "Nama Ketua", "no_handphone": "0812...", "keterangan": "Caretaker", "penerbitan_sk": "SK-002" }
```
- `kode_kabupaten` wajib; tidak ada di master → `400`; sudah ada (termasuk yang pernah dihapus) → `409`.
- PATCH oleh DPC sendiri hanya boleh: `pengurus`, `no_handphone`, `keterangan`, `penerbitan_sk`.
- Format response sama seperti DPD (`data` + `meta`).

### 4.5 Master wilayah (publik) — `/api/v1/master-wilayah`

| Method | Endpoint | Sumber | Kegunaan |
|---|---|---|---|
| GET | `/master-provinsi` | `data_master_wilayah` | Dropdown provinsi di form tambah DPD/DPC |
| GET | `/master-kabupaten?kode_provinsi=12` | `data_master_wilayah` | Dropdown kab/kota di form tambah DPC |
| GET | `/dpd` | `dpd_dpc` | Dropdown DPD di registrasi anggota |
| GET | `/dpc?dpd=Sumatera Utara` atau `?kode_provinsi=12` | `dpd_dpc` | Dropdown DPC di registrasi anggota |

Format response tidak berubah; DPD/DPC yang di-soft delete tidak muncul.

### 4.6 Akun — `/api/v1/akuns` (perubahan)

| Endpoint | Perubahan |
|---|---|
| `POST /akuns` | Field baru `cabangUuid` (opsional). `anggotaUuid` boleh kosong **jika** `cabangUuid` diisi (akun admin yang bukan anggota). Cabang tidak ada → `404` |
| `POST /akuns/:uuid/update` | Field baru `cabangUuid` (uuid, atau `null` untuk melepas tautan). Hanya akun dengan `AKUN_UPDATE` (DPP) |

### 4.7 Cabang — `/api/v1/cabang` (perubahan)

Field opsional baru di `POST /cabang` dan `POST /cabang/:uuid/update`:

| Field | Tipe | Keterangan |
|---|---|---|
| `dpdId` | uuid \| null | Tautkan cabang ke DPD |
| `dpcId` | number \| null | Tautkan cabang ke DPC |

Aturan: isi salah satu saja (keduanya → `400`); DPD/DPC harus ada & belum dihapus (`404`); satu DPD/DPC hanya untuk satu cabang (`409`).

### 4.8 Sejarah PIKI — `/api/v1/sejarah`

| Method | Endpoint | Akses |
|---|---|---|
| GET | `/sejarah` | Publik (hanya `ACTIVE`). Pengelola + `?fixed=all`: semua status |
| GET | `/sejarah/:uuid` | Pengelola CMS |
| POST | `/sejarah` | Pengelola CMS — satu objek atau array |
| POST | `/sejarah/:uuid/update` | Pengelola CMS |
| POST | `/sejarah/:uuid/delete` | Pengelola CMS — set `statusSejarah = NON_ACTIVE` |

Pengelola CMS = `MANAGE_ALL_CABANG` atau `SEJARAH_MANAGE` (DPP, admin cabang, ketua cabang).
Query list: `search`, `currentPage`, `pageSize`, `fixed=all`. Urutan: `urutan` (kosong di akhir) → tahun → waktu input.

```http
POST /api/v1/sejarah
{ "timeline": "1963", "judul": "Lahirnya PIKI", "deskripsiTimeline": "Berdiri di Jakarta ...", "gambar": "/footage/image1.webp", "urutan": 1 }
```
Wajib: `timeline`, `judul` (min 3), `deskripsiTimeline` (min 5). Opsional: `gambar`, `urutan`, `statusSejarah` (`ACTIVE`/`NON_ACTIVE`).

Response list:
```json
{ "success": true, "message": "Success", "data": { "result": [ { "uuid": "...", "timeline": "1963", "judul": "...", "deskripsiTimeline": "...", "gambar": "...", "urutan": 1, "statusSejarah": "ACTIVE" } ], "pagination": { "currentPage": 1, "pageSize": 10, "total": 5 } } }
```

Untuk tampilan web juga tersedia `GET /page/history` (array sejarah aktif) dan `history.items` di `GET /page/home`. Cache halaman otomatis dibersihkan setiap data berubah.

### 4.9 Galeri (foto, video, Instagram) — `/api/v1/galeri`

Satu modul untuk 3 tab CMS Galeri. Konten tampil di halaman galeri dan/atau landing page (`penempatan`).

| `type` | Tab CMS | `url` berisi | Wajib | Diolah backend |
|---|---|---|---|---|
| `PHOTO` | Dokumentasi Foto | URL foto (hasil `POST /upload` atau link gambar) | `title`, `url` | `thumbnailUrl` = `url` jika kosong |
| `VIDEO` | Video Kegiatan | **Link YouTube** atau **URL file video** hasil `POST /upload/video` | `url`; `title` (boleh kosong untuk YouTube); `thumbnailUrl` untuk video upload | YouTube: `youtubeVideoId`, `embedUrl`, thumbnail & judul otomatis. Upload: diputar dari file |
| `INSTAGRAM` | Instagram Post | Link post/reel Instagram | `title`, `url`, `thumbnailUrl` (cover) | `instagramUrl`, `embedUrl` |

Link yang dikenali:

| Jenis | Contoh link | `embedUrl` |
|---|---|---|
| YouTube | `youtube.com/watch?v=ID`, `youtu.be/ID`, `/shorts/ID`, `/embed/ID`, `/live/ID` | `https://www.youtube.com/embed/ID` |
| Instagram | `instagram.com/p/KODE`, `/reel/KODE`, `/tv/KODE`, `instagram.com/<user>/p/KODE` | `https://www.instagram.com/p\|reel/KODE/embed` |
| Video upload | URL berakhiran `.mp4`, `.webm`, `.mov` | – |

| Method | Endpoint | Akses | Fungsi |
|---|---|---|---|
| GET | `/galeri` | Publik | Hanya `PUBLISHED`. Pengelola: `?status=` atau `?fixed=all` |
| GET | `/galeri/stats` | Pengelola | Statistik kartu dashboard |
| POST | `/galeri/preview` | Pengelola | Cek link YouTube/Instagram tanpa menyimpan |
| GET | `/galeri/:id` | Pengelola | Detail |
| POST | `/galeri` | Pengelola | Tambah (satu objek atau array). `status` `DRAFT`/`PUBLISHED`, default `DRAFT` |
| POST | `/galeri/:id/update` | Pengelola | Ubah data &/atau status |
| POST | `/galeri/:id/toggle-status` | Pengelola | `PUBLISHED` ⇄ `DRAFT` (`ARCHIVED` → `PUBLISHED`) |
| POST | `/galeri/:id/toggle-featured` | Pengelola | Spotlight on/off; hanya **satu** item spotlight (item lain otomatis dilepas) |
| POST | `/galeri/:id/archive` | Pengelola | Arsipkan (spotlight dilepas), bisa dikembalikan ke `PUBLISHED` |
| POST | `/galeri/:id/delete` | Pengelola | Hapus = **soft delete**, hilang dari CMS & publik |

Pengelola = `MANAGE_ALL_CABANG` atau `GALERI_MANAGE` (DPP, admin cabang, ketua cabang).
Query list: `type` (`PHOTO`/`VIDEO`/`INSTAGRAM`), `kategori`, `penempatan` (`BERANDA`/`GALERI`), `search` (judul, deskripsi, lokasi, kategori), `currentPage`, `pageSize`, `fixed=all`, `status`.
Urutan: `urutan` (kosong di akhir) → `tanggal` terbaru → terbaru dibuat.

```http
POST /api/v1/galeri
{
  "type": "VIDEO",
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "title": null,
  "deskripsi": "Rekaman pembukaan kongres",
  "kategoriKegiatan": "Kongres & Pelantikan",
  "tanggal": "2024-10-15",
  "lokasi": "Jakarta",
  "duration": "14:32",
  "penempatan": ["BERANDA", "GALERI"],
  "featured": false,
  "urutan": null,
  "status": "PUBLISHED"
}
```
- `tanggal` wajib format **`YYYY-MM-DD`** (contoh `2024-10-15`); format lain / tanggal tidak valid → `400`. Response juga `YYYY-MM-DD`, tampilan "15 Oktober 2024" diformat di frontend.
- `penempatan` default `["GALERI"]`. `kategoriKegiatan` teks bebas (maks 100), mengikuti pilihan di frontend.
- Video YouTube / post Instagram yang sama sudah ada → `409`. Lebih dari satu `featured` dalam satu request → `400`.
- Status: `DRAFT` → `PUBLISHED` (mengisi `publishedAt`) → `ARCHIVED` → bisa kembali ke `PUBLISHED`; `ARCHIVED` → `DRAFT` ditolak `400`; item arsip tidak bisa dijadikan spotlight.
- Mengganti `url` menghitung ulang `embedUrl`/`youtubeVideoId`; thumbnail otomatis (foto / YouTube) ikut diperbarui, cover yang diisi admin tetap dipertahankan.

Bentuk item (response list, detail, create, update) — sama dengan `GaleriItem` di frontend:
```json
{
  "id": "uuid", "title": "...", "deskripsi": "...", "type": "VIDEO",
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ", "thumbnailUrl": "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
  "embedUrl": "https://www.youtube.com/embed/dQw4w9WgXcQ", "kategoriKegiatan": "Kongres & Pelantikan",
  "tanggal": "2024-10-15", "lokasi": "Jakarta", "duration": "14:32",
  "youtubeVideoId": "dQw4w9WgXcQ", "instagramUrl": null, "sumberVideo": "YOUTUBE",
  "penempatan": ["BERANDA", "GALERI"], "featured": false, "urutan": null,
  "status": "PUBLISHED", "publishedAt": "...", "createdAt": "...", "updatedAt": "..."
}
```
`sumberVideo`: `YOUTUBE` / `UPLOAD` untuk `VIDEO`, `null` untuk tipe lain.

Response list: `{ "data": { "result": [ ...item ], "pagination": { "currentPage": 1, "pageSize": 10, "total": 3 } } }`

Response stats:
```json
{ "data": { "total": 3, "photoCount": 1, "videoCount": 1, "instagramCount": 1, "publishedCount": 2, "draftCount": 1, "archivedCount": 0, "spotlightCount": 1 } }
```

#### Upload video — `POST /api/v1/upload/video`
- Akses pengelola galeri. `multipart/form-data`, field `file`.
- Format **mp4 / webm / mov**, maksimal **50MB** (lebih → `413`, format salah → `400`).
- Response: `{ "url": "https://<host>/uploads/video/<nama-file>.mp4", "filename": "...", "originalName": "...", "size": 123, "mimetype": "video/mp4" }` → pakai `url` sebagai `url` item galeri `VIDEO`, plus `thumbnailUrl` (cover, upload via `POST /upload`).
- Upload foto tetap lewat `POST /api/v1/upload` (JPEG/PNG/WebP/GIF, maks 5MB).

Catatan frontend: embed Instagram hanya tampil untuk akun **publik**. Modul `album-galeri` / `media-galeri` tetap ada (dipakai album di modul Berita), bukan untuk CMS Galeri.

### 4.10 Anggota (role USER)

Anggota tanpa role admin hanya dapat memakai endpoint berikut (cukup login, tanpa permission):
`GET /auth/me`, `POST /auth/profile`, `POST /auth/change-password`, `GET /kta/download`, serta semua endpoint publik.

### 4.11 Registrasi anggota (perubahan kecil)

`POST /api/v1/registrasi`: jika `kode_provinsi` / `kode_kabupaten` kosong, backend mencarinya dari nama `dpc`/`dpd` (tabel `dpd_dpc`, lalu `data_master_wilayah`). Kode yang dikirim frontend tetap dipakai apa adanya.

---

## 5. Task lanjutan (ditunda)

### 5.1 Verifikasi registrasi anggota per wilayah (DPP / DPD / DPC) — ✅ SUDAH TEREALISASI (2026-11-05, branch `dev`, belum di-deploy)

> **Status:** dikerjakan & diuji end-to-end di DB lokal (semua skenario lulus). Detail di bawah; teks "Status sekarang" dan "Celah keamanan" adalah kondisi **sebelum** perbaikan.
>
> | Item | Status |
> |---|---|
> | List pendaftar `GET /registrasi` difilter wilayah (DPP semua, DPD per `kode_provinsi`, DPC per `kode_kabupaten`) — **dikerjakan CanSaragih** (`scope.middleware.ts`), plus `counts` status & filter `PENDING`/`APPROVED`/`REJECTED`/`ALL` | ✅ |
> | Detail `GET /registrasi/:id` di luar wilayah → `403` (CanSaragih) | ✅ |
> | Status awal registrasi dinamis dari wilayah pendaftar: `PENDING_VERIFIKASI_DPC` / `_DPD` / `_DPP` (CanSaragih) | ✅ |
> | `PATCH /registrasi/:id/verifikasi`: status hasil ACC ditentukan sistem dari level verifikator (`APPROVED_DPP/DPD/DPC`), `status` dari body hanya dipakai untuk `REJECTED` | ✅ |
> | `verifikatorUuid` & nama aktor diambil dari token login, bukan body | ✅ |
> | Cek wilayah saat verifikasi (luar wilayah → `403`, versi CanSaragih). Akun selain super admin/DPD/DPC (mis. akun demo PNPS) → `403` untuk approve maupun reject. Status error kini juga diisi `statusCode` karena `error.middleware.ts` membaca `statusCode` (sebelumnya `error.status` saja → keluar sebagai 500) | ✅ |
> | Notif email registrasi baru ke DPP **dan** ke admin DPC pilihan pendaftar | ✅ |
> | Scheduler: belum diverifikasi > 3 hari → email sekali ke admin DPD provinsinya (hanya registrasi baru) | ✅ |
> | Bug lama: notif ke DPP tidak pernah terkirim (kode mencari role `SUPERADMIN`, di DB `SUPER_ADMIN`) | ✅ diperbaiki |
> | Endpoint yang **tidak dipakai frontend** dinonaktifkan (dikomentari di `registrasi.routes.ts` & `registrasi.controller.ts`): `PATCH /:id/pembayaran`, `PATCH /:id/aktivasi-kta`, `DELETE /:id`, `POST /check-sla` → kini menjawab `404`. `GET /:id` dan `PUT /:id` **tetap aktif** karena sudah diberi cek wilayah oleh CanSaragih Service-nya tidak diubah; `aktivasiKta` tetap jalan otomatis saat ACC | ✅ |
>
> **Catatan deploy 5.1:**
> - Tanpa migration. Penanda notif memakai tabel `registrasi_log` (`NOTIF_REGISTRASI_BARU`, `NOTIF_DPD_BELUM_VERIFIKASI`). Registrasi lama tidak punya penanda, jadi **tidak akan** dinotif scheduler.
> - **Perilaku berubah:** email "Pendaftar Baru" kini benar-benar terkirim ke **semua akun role `SUPER_ADMIN`** (sebelumnya tidak ada yang terkirim). Pastikan itu memang akun yang diinginkan.
> - Admin DPD/DPC harus punya akun yang ditautkan ke Cabang (`cabangUuid` → `dpdId`/`dpcId`) dan **login ulang**; tanpa itu list kosong dan tidak ada email.
> - Registrasi tanpa `kode_provinsi`/`kode_kabupaten` hanya terlihat & bisa di-ACC DPP, dan tidak dieskalasi ke DPD.
> - Scheduler berjalan di dalam proses server (`src/jobs/registrasiSla.scheduler.ts`, cek tiap jam). Jalankan **satu instance** `piki-backend` saja agar tidak dobel (aman karena dedupe via log, tapi tetap sebaiknya satu).
> - `checkAndBypassSla` (endpoint manual `/registrasi/check-sla`) tidak diubah.
> - Frontend: lihat **§5.1.1** di bawah (checklist tim frontend).

**Status sekarang (production):** registrasi baru langsung berstatus `PENDING_VERIFIKASI_DPP`, satu kali ACC langsung mengaktifkan KTA. Belum ada pembagian wilayah.

**Yang disepakati:**
- Tetap **satu kali ACC** (bukan berjenjang).
- Hak ACC: **DPP** semua pendaftar; **DPD** pendaftar di provinsinya (`registrasi.kode_provinsi`); **DPC** pendaftar di kab/kotanya (`registrasi.kode_kabupaten`).
- **List pendaftar** (`GET /api/v1/registrasi`) ikut difilter per wilayah. Saat ini filter memakai `cabangUuid` yang selalu kosong di data registrasi.
- Status hasil ACC (`APPROVED_DPC` / `APPROVED_DPD` / `APPROVED_DPP`) ditentukan otomatis sesuai level verifikator.

**Celah keamanan di endpoint verifikasi** (`PATCH /api/v1/registrasi/:id/verifikasi`, `src/controllers/registrasi.controller.ts`) yang ikut diperbaiki:
- `status` hasil verifikasi dikirim dari body (frontend), bisa diisi bebas.
- `verifikatorUuid` dan `actorNama` diambil dari body, bukan dari token login.
- Tidak ada pengecekan wilayah: semua akun dengan `REGISTRASI_APPROVE` (termasuk akun demo PNPS) bisa ACC registrasi mana pun.

**Catatan data:** di production hanya 29/65 registrasi punya `kode_provinsi` dan 21/65 punya `kode_kabupaten`. Registrasi tanpa kode hanya bisa di-ACC DPP.

Hierarki akun DPD/DPC (`Akun.cabangUuid` → `Cabang.dpdId` / `Cabang.dpcId`, token `tingkat`/`dpdId`/`dpcId`) **sudah tersedia** dan bisa langsung dipakai.

### 5.1.1 Checklist tim frontend untuk registrasi & verifikasi (hasil pengecekan repo `frontend`, 2026-11-05)

**Endpoint registrasi yang dipakai frontend hanya 3** (`src/components/auth/register/Step4Pembayaran.tsx`, `src/hooks/api/useVerifikasi.ts`):

| Endpoint | Status setelah perubahan backend |
|---|---|
| `POST /registrasi` | Tidak berubah |
| `GET /registrasi?statusVerifikasi=PENDING_VERIFIKASI_DPP` | Sekarang otomatis difilter wilayah (DPP semua, DPD provinsinya, DPC kab/kotanya). ⚠️ Karena status awal kini dinamis (`PENDING_VERIFIKASI_DPC`/`_DPD`/`_DPP`), filter yang hanya `PENDING_VERIFIKASI_DPP` tidak menampilkan pendaftar berstatus DPC/DPD. Gunakan `statusVerifikasi=PENDING` (semua yang menunggu) — pastikan frontend sudah memakainya |
| `PATCH /registrasi/:id/verifikasi` | Body lama (`status`, `actorNama`, `catatanVerifikasi`) tetap diterima. **Tidak perlu ubah kode** agar jalan |

**Wajib / syarat agar berjalan (bukan perubahan kode):**
1. **Akun admin DPD/DPC harus ditautkan ke Cabang** yang punya `dpdId`/`dpcId` (alur §4.2) lewat menu Akun, dan **login ulang** (token lama tidak membawa `tingkat`). Tanpa itu daftar pendaftar kosong dan tidak ada email notifikasi.
2. Error baru dari backend ditampilkan lewat `errorData.message` yang sudah ada di `useVerifikasi.ts`: `403` (registrasi di luar wilayah). Tidak perlu penanganan baru.

**Disarankan (kosmetik, tidak memblokir):**
3. `useVerifikasi.ts`: hapus `actorNama: "SUPER_ADMIN"` dari body, sekarang diabaikan backend (nama aktor diambil dari token). Tipe `status` boleh dilonggarkan: `APPROVED_*` apa pun dianggap "setuju" sesuai level akun; hanya `REJECTED` yang menolak.
4. Teks toast sukses di `dashboard/verifikasi/page.tsx` ("...KTA diterbitkan") tetap benar untuk DPP/DPD/DPC.
5. `dashboard/verifikasi/page.tsx` baris ~179 membaca `item.dpp` untuk provinsi, padahal backend mengirim field `dpd` (dan tidak mengirim `cabang`). Akibatnya provinsi kosong di tabel. Masalah lama, bukan akibat perubahan ini; perbaikan: baca `item.dpd`.
6. Menu "Verifikasi Pendaftar" di `AppSidebar.tsx` tampil untuk semua pengguna dashboard. Tidak bermasalah (backend yang membatasi), tapi bisa disembunyikan untuk akun tanpa `REGISTRASI_APPROVE`.

**Tidak perlu dilakukan:** tidak ada endpoint pembayaran/aktivasi-kta/hapus/edit yang dipakai frontend, jadi tidak ada yang rusak akibat endpoint tersebut dikomentari. `GET /:id` dan `PUT /:id` tetap aktif.

### 5.2 Frontend (di luar backend)

- `HistorySection.tsx` masih timeline hardcoded → ganti dengan `GET /api/v1/sejarah` atau `GET /api/v1/page/history`.
- `src/features/galeri/hooks/useGaleri.ts` masih menyimpan data di `localStorage` → ganti dengan API `/api/v1/galeri` (bentuk data sudah sama dengan `GaleriItem`). Section galeri di landing page memakai `GET /api/v1/galeri?penempatan=BERANDA`.
- Field `tanggal` dikirim/diterima `YYYY-MM-DD`; format tampilan "15 Oktober 2024" dilakukan di frontend. Upload foto `POST /api/v1/upload`, upload video `POST /api/v1/upload/video`.
- Menu CMS baru: DPD/DPC, tautan Cabang ke DPD/DPC, pilih cabang di form Akun, CMS Sejarah, CMS Galeri (pratinjau link via `POST /galeri/preview`).

---

## 6. Temuan lain

- **Akun demo PNPS** (lihat 3.2 no. 6) — risiko utama sebelum deploy.
- Tabel `Cabang` di production berisi data bawaan proyek lain (duplikat Jakarta/Surabaya/Yogyakarta/Bandung/Kupang dan "PNPS Pusat"). **Dibiarkan**, jangan dihapus.
- `POST /api/v1/akuns/:uuid/update` mengganti seluruh role (replace). Frontend wajib mengirim daftar role lengkap, contoh `[USER, KETUA_CABANG]`.
- Pencabutan role admin baru berlaku setelah token kedaluwarsa (maks 1 hari) atau login ulang. Pembatalan token seketika saat role berubah butuh perubahan di sistem login.
- `prisma/seed.ts` belum memuat permission `SEJARAH_MANAGE` & `GALERI_MANAGE` (seed sengaja tidak diubah). Di environment yang dibuat dari nol, migration berjalan sebelum role dibuat seed, sehingga kedua permission belum tertaut ke role.
- Page setting `land-youtube` (DB & `prisma/seedPageSetting.ts`) sudah tidak dipakai backend, dibiarkan.
- Penyeragaman status: Sejarah masih `ACTIVE`/`NON_ACTIVE`, sedangkan Berita & Galeri memakai `DRAFT`/`PUBLISHED`/`ARCHIVED`.
