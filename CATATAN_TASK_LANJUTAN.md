# Dokumentasi Backend PIKI — Standarisasi Status, Hierarki Wilayah (DPP > DPD > DPC), & Panduan Tim

Dokumen ini menggantikan catatan sebelumnya dan menjadi **panduan resmi untuk tim Backend, tim Frontend, dan tim Ops/Deploy** terkait seluruh perubahan yang dikerjakan di branch `dev`.

> **Baseline production (`main`) sebelum rangkaian update ini:** `5b70f51`.  
> Seluruh fitur di dokumen ini berada di branch `dev` (termasuk commit `241ff73`, `1cd79b0`, `b6f20a9`, dan implementasi hierarki **FAQ** terbaru).

---

## 1. Ringkasan Perubahan & Daftar Migration

| Tahap / Commit | Ringkasan Perubahan | Migration | Sifat DB |
|---|---|---|---|
| `241ff73` | Hierarki scope `DPP > DPD > DPC` untuk **Anggota** (list, search, detail, export), **Dashboard**, dan **Registrasi** | – | – |
| `1cd79b0` | Penyeragaman status **Sejarah** (`DRAFT` / `PUBLISHED` / `ARCHIVED`, `published_at`) + **soft delete** (`deleted_at`), endpoint `toggle-status` & `archive` | `20261119135200_sejarah_status_soft_delete` | Aman (`ACTIVE` → `PUBLISHED`, non-aktif → `ARCHIVED`, tambah `published_at` & `deleted_at`) |
| `b6f20a9` | Hierarki **`DPP > DPD > DPC`** pada modul CMS: **Profil Cabang**, **Berita (`NewsUtama`)**, **Galeri (`Galeri`)**, **Album Galeri (`AlbumGaleri`)**, **Pengurus (`PeriodeKepengurusan` & `StrukturOrganisasi`)**, dan **Sejarah (`Sejarah`)** | `20261119151000_cabang_scope_galeri_sejarah` | Aditif / aman (tambah `cabangUuid` nullable + index + FK di `sejarah` & `galeri`) |
| Update terbaru | Hierarki **`DPP > DPD > DPC`** pada modul CMS **FAQ** (`/api/v1/faq`) + dukungan filter `?cabangUuid=` | `20261119163000_cabang_scope_faq` | Aditif / aman (tambah `cabangUuid` nullable + index + FK di `FAQ`) |

**Catatan keamanan data existing:**  
Seluruh migration baru **tidak menghapus baris data lama**. Item lama di `sejarah`, `galeri`, maupun `FAQ` yang memiliki `cabangUuid = NULL` otomatis dianggap sebagai konten **Pusat / Nasional (DPP)** dan tetap tampil normal di halaman publik.

---

## 2. Konsep & Aturan Umum Hierarki (`DPP > DPD > DPC`)

Sistem membaca struktur organisasi akun dari relasi:
`Akun.cabangUuid` → `Cabang` (`dpdId` untuk DPD provinsi atau `dpcId` untuk DPC kabupaten/kota) → di-inject ke JWT saat login (`tingkat`, `dpdId`, `dpcId`, `cabangId`) lalu di-resolve pada middleware `scope` (`src/middlewares/scope.middleware.ts`).

### Matriks Hak Akses Wilayah

| Level Akun | Kondisi di Middleware `scope` | Read (List & Detail CMS) | Create (`POST /`) | Update / Archive / Toggle / Delete |
|---|---|---|---|---|
| **DPP / Super Admin** | `permissions.includes("MANAGE_ALL_CABANG")` (`isSuperAdmin: true`) | Semua data (Pusat/`null` + seluruh DPD + seluruh DPC) | Bisa memilih `cabangUuid` mana saja atau `null` (Pusat) | Bebas mengelola semua data Pusat, DPD, dan DPC |
| **Admin / Ketua DPD** | `tingkat === "DPD"` & memiliki `kodeProvinsi` / `cabangId` | Data cabangnya sendiri + seluruh DPC dalam provinsinya (`kodeProvinsi`) | **Otomatis dikunci ke `scope.cabangId` sendiri** (nilai `cabangUuid` dari body diabaikan) | **Hanya data milik cabangnya sendiri** (`targetCabangUuid === scope.cabangId`); lintas cabang/pusat → `403` |
| **Admin / Ketua DPC** | `tingkat === "DPC"` & memiliki `kodeKabupaten` / `cabangId` | **Hanya data milik cabangnya sendiri** (`kodeKabupaten` / `cabangId`) | **Otomatis dikunci ke `scope.cabangId` sendiri** | **Hanya data milik cabangnya sendiri** (`403` untuk cabang lain/pusat) |
| **Publik / Role `USER`** | `!scope?.isAdmin` | Hanya item berstatus `PUBLISHED` / `ACTIVE` (bisa difilter per `?cabangUuid=`) | Ditolak (`401` / `403`) | Ditolak (`401` / `403`) |

> **Prasyarat akun wilayah:** Akun admin DPD/DPC wajib ditautkan ke `Cabang` (`Akun.cabangUuid`) yang sudah terhubung ke `dpdId` / `dpcId`, lalu user harus **login ulang** agar token JWT membawa `tingkat`, `dpdId`, `dpcId`, dan `cabangId`. Jika akun admin cabang belum tertaut ke `Cabang`, endpoint `create`/`update` wilayah akan mengembalikan `403`.

---

## 3. Panduan Untuk Tim Backend

### 3.1 Setup Lokal Setelah `git pull`

Proyek menggunakan **Bun** (jangan pakai `npm install`).

```bash
cd backend
git checkout dev
git pull

bun install
bun scripts/with-db-url.ts bunx prisma migrate deploy
bun run db:generate
bun scripts/with-db-url.ts bunx prisma migrate status   # harus: "Database schema is up to date!"
bun run dev
```

### 3.2 Helper Resmi Hierarki di `src/middlewares/scope.middleware.ts`

Gunakan helper berikut jika mengembangkan atau memperluas modul CMS lain agar konsisten di seluruh backend:

1. **Middleware pada route**: pasang `scope` setelah `authenticate` (atau `optionalAuthenticate` untuk endpoint publik+CMS).
2. **`buildCabangHierarchyWhere(scope)`**: dipakai untuk query langsung pada model `Cabang`.
3. **`buildCabangRelationScopeWhere(scope)`**: dipakai untuk query pada model yang memiliki kolom `cabangUuid` dan relasi `cabang Cabang?`. Mengembalikan `null` untuk Super Admin (DPP), filter `OR` untuk DPD (cabang sendiri + seluruh DPC se-provinsi), dan filter `cabangUuid` untuk DPC.
   - Jika endpoint juga menerima query filter `?cabangUuid=...`, gabungkan dengan `AND: [scopeWhere, { cabangUuid }]` agar DPD/DPC tidak bisa mem-bypass scope lewat query param.
4. **`resolveCreateCabangUuid(scope, bodyCabangUuid)`**: menentukan `cabangUuid` saat `POST /`. Super Admin boleh memakai `bodyCabangUuid` (atau `null`); admin DPD/DPC otomatis dikunci ke `scope.cabangId` dan melempar `403` bila akunnya belum tertaut ke `Cabang`.
5. **`assertCanReadCabangItem(scope, targetCabangUuid, label)`** (async): cek izin baca detail (`GET /:uuid`) untuk DPD (boleh baca cabang sendiri + DPC se-provinsinya) dan DPC (hanya cabang sendiri), melempar `403` jika di luar scope.
6. **`assertCanWriteCabangItem(scope, targetCabangUuid, label)`**: cek izin tulis (`update`, `toggle-status`, `archive`, `delete`) — non-DPP hanya boleh menulis item dengan `targetCabangUuid === scope.cabangId`, selain itu melempar `403`.
7. **Proteksi mutasi `cabangUuid` saat update**: untuk `!req.scope?.isSuperAdmin`, hapus/abaikan `cabangUuid` dari payload `update` agar admin wilayah tidak dapat memindahkan kepemilikan record ke cabang lain.

### 3.3 Catatan Teknis / Backlog Lanjutan untuk Tim Backend

Hal-hal berikut tercatat di codebase saat audit dan belum termasuk dalam scope perubahan CMS saat ini:

- **Endpoint tulis Anggota (`POST /api/v1/anggotas` & `POST /api/v1/anggotas/:uuid`)**:
  - `GET /anggotas`, `GET /anggotas/search`, `GET /anggotas/:uuid`, dan export sudah memakai `scope` (`buildAnggotaScopeWhere`).
  - Namun `createAnggota` & `updateAnggota` di `src/controllers/anggota.controller.ts` **belum** memvalidasi scope wilayah target (`cabangUuid` / `kode_provinsi` / `kode_kabupaten`) bila admin cabang memanggilnya langsung.
- **Batch `createStrukturOrganisasi`**: validasi periode di `src/controllers/strukturOrganisasi.controller.ts` mengecek `dataArray[0].periodeUuid` (mengasumsikan seluruh item dalam 1 batch array berada pada `periodeUuid` yang sama).
- **Modul lain yang masih non-cabang / belum diaktifkan di CMS aktif**: `ProgramKerja`, `Agenda`, `Arsip`, `FormPengaduan`, `Jabatan`, `Bidang`, dan `MediaGaleri`. Jika kelak dipakai per wilayah, tambahkan pola helper `scope.middleware.ts` yang sama.
- **Pre-existing TypeScript issues** di file validator lama (`albumGaleri.schema.ts`, `cabang.schema.ts`, `strukturOrganisasi.schema.ts`, `faq.schema.ts` bagian `superRefine` Zod v4 `ctx.addIssue`, serta modul legacy e-commerce): tidak memblokir `bun run build`, tetapi perlu dirapikan bila ingin `tsc --noEmit` global 0 error.

---

## 4. Panduan & Kontrak API Untuk Tim Frontend

Base URL: `/api/v1`.  
Header autentikasi: `Authorization: Bearer <accessToken>` (dari `POST /auth/login`).  
Error akses lintas wilayah mengembalikan HTTP **`403`** dengan payload `{ "message": "Akses ditolak: ..." }` (atau error handler `{ "success": false, "message": "..." }`), sedangkan data tidak ada mengembalikan **`404`**.

### 4.1 Aturan Umum UI untuk Role Wilayah (DPP vs DPD vs DPC)

1. **Dropdown pilih Cabang (`cabangUuid`) di form Create / Edit**:
   - **Tampilkan hanya untuk DPP (`MANAGE_ALL_CABANG`)**. Untuk DPP, `cabangUuid = null` berarti konten **Pusat/Nasional**.
   - **Untuk Admin DPD / DPC**: tidak perlu memaksa user memilih cabang lain karena backend otomatis mengunci data baru ke `cabangId` milik akun (meskipun body mengirim `cabangUuid` lain, backend tetap mengunci ke cabang akun yang login).
2. **Aksi Edit / Toggle / Archive / Delete di sisi DPD**:
   - Admin **DPD** bisa **melihat (read-only)** konten milik **DPC** dalam provinsinya di list/detail CMS, **tetapi tidak boleh mengedit/mengarsip/menghapus** konten milik DPC tersebut (`403`).
   - Di UI frontend, sebaiknya sembunyikan/disable tombol Edit, Archive, Delete untuk item yang `item.cabangUuid !== user.cabangId` (kecuali user adalah DPP/`MANAGE_ALL_CABANG`), sambil tetap mempertahankan error toast `403` sebagai fallback.

---

### 4.2 Detail Endpoint & Perubahan Per Modul

#### A. Profil Cabang — `/api/v1/cabang`

| Method | Endpoint | Hak Akses & Perilaku |
|---|---|---|
| `GET` | `/cabang` | Publik (tanpa login): hanya cabang `ACTIVE`. Admin (`optionalAuthenticate`): DPP lihat semua, DPD lihat dirinya + DPC se-provinsinya, DPC hanya lihat cabangnya sendiri. |
| `GET` | `/cabang/:uuid` | Wajib login (`CABANG_READ` / `MANAGE_ALL_CABANG`). Diluar scope → `403`. |
| `POST` | `/cabang` | **Khusus DPP (`isSuperAdmin`)**. DPD/DPC akan ditolak `403`. |
| `POST` | `/cabang/:uuid/update` | DPP bebas update cabang mana pun. DPD/DPC **hanya boleh mengedit profil cabangnya sendiri** (`uuid === user.cabangId`); lintas cabang → `403`. |
| `POST` | `/cabang/:uuid/delete` | **Khusus DPP (`isSuperAdmin`)**. DPD/DPC akan ditolak `403`. |

**Field terproteksi saat `POST /cabang/:uuid/update` oleh DPD/DPC:**  
DPD & DPC **dilarang mengirim/mengubah** field struktural berikut (ditolak **`403`** bila dikirim dalam body):
`dpdId`, `dpcId`, `isCabang`, `statusCabang`, `ketuaUuid`.  
Frontend cukup mengirim field profil operasional (misal: `namaCabang`, `alamat`, `kabupatenKota`, `provinsi`, `deskripsiCabang`, `visi`, `misi`, `noWa`, `instagram`, `facebook`, `youtube`, `email`, `urlBannerImg`, `titleHomeHero`, `headlineHomeHero`, countdown, dll).

---

#### B. Berita — `/api/v1/news-utama`

| Method | Endpoint | Hak Akses & Perilaku |
|---|---|---|
| `GET` | `/news-utama` | Publik: berita `PUBLISHED`. Admin (dengan token): otomatis difilter hierarki `DPP > DPD > DPC` (support `?cabangUuid=`, `?fixed=all`, `?status=`). |
| `GET` | `/news-utama/admin` | Admin list dengan filter scope hierarki `DPP > DPD > DPC`. |
| `GET` | `/news-utama/cabang/:cabangUuid` | Publik: berita `PUBLISHED` milik cabang tertentu. |
| `GET` | `/news-utama/:uuid` & `/news-utama/slug/:slug` | Publik hanya bisa buka berita `PUBLISHED` (draft/archived → `404`). Admin bisa buka draft/archived sesuai scope (`403` jika di luar wilayah). |
| `POST` | `/news-utama` | Support single object atau bulk array. DPP bisa set `cabang_uuid` (`cabangUuid`), DPD/DPC otomatis terkunci ke `cabangId` sendiri. |
| `POST` | `/news-utama/:uuid/update` | DPP bebas; DPD/DPC hanya berita cabangnya sendiri (`403` lintas cabang). |
| `POST` | `/news-utama/:uuid/archive` | DPP bebas; DPD/DPC hanya berita cabangnya sendiri (`403` lintas cabang). |

---

#### C. Sejarah PIKI — `/api/v1/sejarah` & `/api/v1/page/history`

Perubahan status (menggantikan `ACTIVE`/`NON_ACTIVE` lama) **dan** penambahan `cabangUuid` opsional:

- **Status Sejarah:** `"DRAFT"` | `"PUBLISHED"` | `"ARCHIVED"` (default saat create: `"DRAFT"`).
- **Soft delete:** `deleted_at` diisi saat delete; record ter-delete hilang dari CMS & publik.
- **Aturan transisi status:**
  - `POST /sejarah/:uuid/toggle-status`: `PUBLISHED` ⇄ `DRAFT`; jika dari `ARCHIVED` akan menjadi `PUBLISHED`.
  - `POST /sejarah/:uuid/archive`: mengubah ke `ARCHIVED`.

| Method | Endpoint | Hak Akses & Perilaku |
|---|---|---|
| `GET` | `/sejarah` | Publik: hanya `PUBLISHED` (bisa filter `?cabangUuid=`). Pengelola (`MANAGE_ALL_CABANG` / `SEJARAH_MANAGE`): difilter hierarki `DPP > DPD > DPC`; query `?status=DRAFT\|PUBLISHED\|ARCHIVED` atau `?fixed=all` untuk semua status. |
| `GET` | `/sejarah/:uuid` | Pengelola CMS, dicek dengan hierarki `DPP > DPD > DPC` (`403` jika di luar wilayah). |
| `POST` | `/sejarah` | Pengelola CMS (single object atau array). Field baru opsional: `cabangUuid` (hanya dihormati untuk DPP; DPD/DPC dikunci ke cabangnya). |
| `POST` | `/sejarah/:uuid/update` | Pengelola CMS, wajib pemilik cabang / DPP (`403` lintas cabang). `cabangUuid` hanya bisa diubah oleh DPP. |
| `POST` | `/sejarah/:uuid/toggle-status` | Toggle `DRAFT` ⇄ `PUBLISHED` (atau `ARCHIVED` → `PUBLISHED`), wajib pemilik cabang / DPP. |
| `POST` | `/sejarah/:uuid/archive` | Arsipkan item sejarah (`ARCHIVED`), wajib pemilik cabang / DPP. |
| `POST` | `/sejarah/:uuid/delete` | **Soft delete**, wajib pemilik cabang / DPP. |
| `GET` | `/page/history` | Endpoint publik landing page: mengembalikan daftar sejarah berstatus `PUBLISHED` & `deleted_at = null`. Cache dibersihkan otomatis setiap ada mutasi sejarah. |

**Payload contoh create Sejarah:**
```json
{
  "timeline": "1963",
  "judul": "Berdirinya PIKI",
  "deskripsiTimeline": "Deskripsi sejarah ...",
  "gambar": "/uploads/...",
  "urutan": 1,
  "statusSejarah": "DRAFT",
  "cabangUuid": null
}
```

---

#### D. Galeri & Album Galeri — `/api/v1/galeri` & `/api/v1/album-galeri`

**Perubahan di `/api/v1/galeri`:**
- Field baru pada `GaleriItem` (request & response): `cabangUuid: string | null`.
- `GET /galeri`: publik lihat item `PUBLISHED` (bisa filter `?cabangUuid=`). Pengelola (`MANAGE_ALL_CABANG` / `GALERI_MANAGE`): difilter hierarki `DPP > DPD > DPC`, support `?fixed=all`, `?status=DRAFT|PUBLISHED|ARCHIVED`, `?type=`, `?kategori=`, `?penempatan=`, `?cabangUuid=`.
- `GET /galeri/stats`: statistik dashboard (`total`, `photoCount`, `videoCount`, `instagramCount`, `publishedCount`, `draftCount`, `archivedCount`, `spotlightCount`) ikut **terfilter sesuai scope wilayah login**.
- `POST /galeri`, `/:id/update`, `/:id/toggle-status`, `/:id/toggle-featured`, `/:id/archive`, `/:id/delete`: mengikuti aturan `DPP > DPD > DPC`.
- **Spotlight (`featured: true`)**: aturan 1 item spotlight aktif kini berlaku **per cabang (`cabangUuid`)** (mengaktifkan spotlight di DPC Cimahi tidak akan melepas spotlight milik Pusat atau DPC lain).

**Perubahan di `/api/v1/album-galeri`:**
- `GET /album-galeri`: publik lihat album cabang yang aktif (bisa filter `?cabangUuid=`); admin difilter hierarki `DPP > DPD > DPC`.
- `GET /album-galeri/:uuid`, `POST /album-galeri`, `POST /album-galeri/:uuid/update`, `POST /album-galeri/:uuid/delete`: memakai scope hierarki.
- Permission route `album-galeri` sudah dilonggarkan agar `ADMIN_CABANG` (dengan `CABANG_UPDATE`, `GALERI_CREATE`/`UPDATE`/`DELETE`, atau `GALERI_MANAGE`) bisa mengelola album cabangnya sendiri tanpa harus memiliki `CABANG_CREATE`/`CABANG_DELETE`.

---

#### E. Pengurus (Periode Kepengurusan & Struktur Organisasi)

Terdiri dari 2 modul yang saling terhubung:
1. **Periode Kepengurusan — `/api/v1/periode-kepengurusan`** (menyimpan `cabangUuid`).
2. **Struktur Organisasi — `/api/v1/struktur-organisasi`** (mengikuti kepemilikan `periode.cabangUuid`).

| Method | Endpoint | Hak Akses & Perilaku |
|---|---|---|
| `GET` | `/periode-kepengurusan` | Publik: hanya `isAktif: true` (bisa filter `?cabangUuid=`). Admin: hierarki `DPP > DPD > DPC`, default `isAktif: true` kecuali `?fixed=all`. |
| `GET` | `/periode-kepengurusan/admin` | Admin list sesuai hierarki `DPP > DPD > DPC` (support `?fixed=all`, `?cabangUuid=`). |
| `GET` | `/periode-kepengurusan/:uuid` | Admin detail dengan cek scope baca (`403` luar wilayah). |
| `POST` | `/periode-kepengurusan` | Admin (`CABANG_CREATE`/`CABANG_UPDATE`/`STRUKTUR_CREATE`/`MANAGE_ALL_CABANG`). DPP bisa pilih `cabangUuid`; DPD/DPC terkunci ke `cabangId` sendiri. **Penting:** bila `isAktif: true`, backend hanya menonaktifkan periode lain **dalam `cabangUuid` yang sama** (tidak lagi menonaktifkan periode cabang lain secara nasional). |
| `POST` | `/periode-kepengurusan/:uuid/update` | Hanya pemilik cabang atau DPP (`403` lintas cabang). Aktivasi `isAktif: true` juga scoped per `cabangUuid`. |
| `POST` | `/periode-kepengurusan/:uuid/delete` | Hanya pemilik cabang atau DPP (`403` lintas cabang). |
| `GET` | `/struktur-organisasi` | Publik: struktur dari periode `isAktif: true` (filter via `?periodeUuid=`). Admin: difilter melalui `periode.cabangUuid` sesuai hierarki `DPP > DPD > DPC` (support `?fixed=all`, `?periodeUuid=`). |
| `GET` | `/struktur-organisasi/admin` | Admin list struktur sesuai hierarki `periode.cabangUuid`. |
| `GET` | `/struktur-organisasi/:uuid` | Admin detail, dicek via `periode.cabangUuid` (`403` luar wilayah). |
| `POST` | `/struktur-organisasi` | Admin (`CABANG_CREATE`/`CABANG_UPDATE`/`STRUKTUR_CREATE`/`MANAGE_ALL_CABANG`). Memvalidasi `periode.cabangUuid` milik cabang pembuat (atau DPP). |
| `POST` | `/struktur-organisasi/:uuid/update` | Cek kepemilikan `periode.cabangUuid` asal, serta periode tujuan bila `periodeUuid` diganti. |
| `POST` | `/struktur-organisasi/:uuid/delete` | Cek kepemilikan `periode.cabangUuid` (`403` lintas cabang). |

> **Catatan untuk tim Frontend (Pengurus / Struktur):** Saat integrasi CMS Pengurus & Struktur Organisasi nanti:  
> 1) Ambil periode cabang lewat `GET /periode-kepengurusan/admin?fixed=all` (atau `GET /periode-kepengurusan?fixed=all`).  
> 2) Ambil daftar struktur lewat `GET /struktur-organisasi/admin?periodeUuid=<uuid>` (atau `GET /struktur-organisasi`).  
> 3) Ambil master jabatan (`/api/v1/jabatan`), bidang (`/api/v1/bidang`), dan daftar anggota (`/api/v1/anggotas` — sudah terfilter sesuai wilayah).

---

#### F. FAQ — `/api/v1/faq`

- Kolom baru: `cabangUuid: string | null` (opsional, `null` = FAQ Pusat/Nasional).
- Permission tulis mendukung `FAQ_MANAGE` (yang sudah dimiliki `ADMIN_CABANG`), selain `FAQ_CREATE` / `FAQ_UPDATE` / `FAQ_ARCHIVE` / `MANAGE_ALL_CABANG`.

| Method | Endpoint | Hak Akses & Perilaku |
|---|---|---|
| `GET` | `/faq` | Publik: `isPublish = true` & `statusFAQ = "ACTIVE"` (support `?cabangUuid=`, `?kategori=`, `?search=`). Admin: difilter hierarki `DPP > DPD > DPC` (support `?cabangUuid=`, `?status=ACTIVE\|ARCHIVED`, `?kategori=`, `?search=`). |
| `GET` | `/faq/:uuid` | Publik: `404` jika `!isPublish` atau `statusFAQ !== "ACTIVE"`. Admin: dicek scope `DPP > DPD > DPC` (`403` jika di luar wilayah). |
| `POST` | `/faq` | Support single object atau array. DPP bisa set `cabangUuid` (divalidasi cabang ada, `404` jika tidak ada); DPD/DPC dikunci ke `cabangId` sendiri. |
| `POST` | `/faq/:uuid/update` | Wajib pemilik cabang atau DPP (`403` lintas cabang). Non-DPP tidak bisa mengubah `cabangUuid`. |
| `POST` | `/faq/:uuid/archive` | Set `statusFAQ = "ARCHIVED"`, wajib pemilik cabang atau DPP (`403` lintas cabang). |

---

## 5. Panduan Deploy Production / Staging (Tim Ops)

Server: `/var/www/backend/backend` (`pm2` process: `piki-backend`).

1. **Backup database terlebih dahulu (wajib sebelum migrate):**
   ```bash
   pg_dump -Fc -d piki_db -f /root/backup/piki_db_$(date +%Y%m%d_%H%M)_sebelum_deploy.backup
   ```
2. **Pull & jalankan migrasi + build berurutan tanpa jeda:**
   ```bash
   cd /var/www/backend/backend
   git fetch origin
   git checkout main && git pull origin main   # setelah merge dev -> main

   bun install
   bun scripts/with-db-url.ts bunx prisma migrate deploy
   bun run db:generate
   bun run build
   pm2 restart piki-backend
   ```
3. **Verifikasi pasca-deploy:**
   ```bash
   bun scripts/with-db-url.ts bunx prisma migrate status   # pastikan: "Database schema is up to date!"
   pm2 logs piki-backend --lines 50
   ```
   - ⚠️ **Jangan** menjalankan `prisma migrate dev`, `prisma db push`, atau `bun run seed` di server production.
   - Pastikan akun admin DPD/DPC sudah ditautkan ke `Cabang` (`Akun.cabangUuid` → `Cabang.dpdId`/`dpcId`) dan user bersangkutan **login ulang** setelah deploy.
