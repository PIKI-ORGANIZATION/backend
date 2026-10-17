# Dokumentasi Teknis Backend: Modul Berita (News Utama)

Dokumentasi ini menjelaskan arsitektur, aturan otorisasi berbasis wilayah (*scoping*), skema database, serta spesifikasi endpoint REST API untuk **Modul Berita (News Utama)** pada aplikasi PIKI.

---

## 1. Konsep & Aturan Otorisasi Wilayah (Scoping)

Modul Berita dirancang dengan pemisahan wewenang yang tegas antara **DPP Pusat (Superadmin)** dan **Cabang (DPD/DPC)**:

| Aspek | DPP Pusat (Superadmin) | Admin Cabang (DPD / DPC) | Pengunjung Publik |
| :--- | :--- | :--- | :--- |
| **Akses Melihat (GET)** | Melihat seluruh berita nasional (Pusat & seluruh Cabang) atau filter cabang tertentu. | **Hanya melihat berita cabangnya sendiri**. Sama sekali tidak bisa melihat berita Pusat maupun cabang lain. | Hanya melihat berita dengan status `PUBLISHED`. Bisa memfilter per cabang. |
| **Membuat Berita (POST)** | Dapat menentukan `cabangUuid` target (Pusat atau Cabang mana pun). | Nilai `cabangUuid` **dikunci otomatis** ke ID cabangnya sendiri (`scope.cabangId`). Input dari body diabaikan. | Tidak memiliki akses (`401/403`). |
| **Mengedit Berita (UPDATE)** | Bisa mengedit berita apa pun di seluruh tingkatan. | **Hanya bisa mengedit berita cabangnya sendiri**. Percobaan mengedit berita cabang lain/pusat akan ditolak (`403 Forbidden`). | Tidak memiliki akses (`401/403`). |
| **Arsip Berita (ARCHIVE)** | Bisa mengarsipkan berita mana pun. | **Hanya bisa mengarsipkan berita miliknya sendiri**. | Tidak memiliki akses (`401/403`). |

---

## 2. Struktur Database (Prisma Schema)

Model utama yang digunakan berada di tabel `NewsUtama`:

```prisma
model NewsUtama {
  uuid              String              @id @default(uuid()) @db.Uuid
  judul             String
  ringkasan         String?
  konten            String
  slug              String              @unique
  url_thumbnail_img String?
  statusNewsUtama   String              @default("DRAFT") // DRAFT | PUBLISHED | ARCHIVED
  author_akun_uuid  String              @db.Uuid
  published_at      DateTime?
  published_by      String?             @db.Uuid
  jumlah_dibaca     Int                 @default(0)
  jumlah_disukai    Int                 @default(0)
  jumlah_komentar   Int                 @default(0)
  durasi_baca       Int?
  cabangUuid        String?             @db.Uuid
  insert_at         DateTime            @default(now())
  insert_by         String?             @db.Uuid
  update_at         DateTime            @updatedAt
  update_by         String?             @db.Uuid

  // Relasi
  author            Akun                @relation("NewsAuthor", fields: [author_akun_uuid], references: [uuid])
  cabang            Cabang?             @relation(fields: [cabangUuid], references: [uuid])
  publisher         Akun?               @relation("NewsPublisher", fields: [published_by], references: [uuid])
  kategori          NewsUtamaKategori[]
  tags              NewsUtamaTag[]
  albumList         AlbumGaleri[]
}
```

---

## 3. Daftar Endpoint API

Semua endpoint berada di bawah prefix rute: `/api/v1/news-utama`

### 3.1. Ambil Daftar Berita (List)
* **Method**: `GET`
* **URL**: `/api/v1/news-utama`
* **Middleware**: `optionalAuthenticate`, `scope`
* **Query Parameters**:
  * `search` *(string, optional)*: Pencarian teks pada judul, ringkasan, atau konten.
  * `currentPage` *(number, default: 1)*: Halaman aktif.
  * `pageSize` *(number, default: 10)*: Jumlah data per halaman.
  * `kategori` *(UUID, optional)*: Filter berdasarkan UUID kategori.
  * `tag` *(UUID, optional)*: Filter berdasarkan UUID tag.
  * `statusNewsUtama` *(string, optional)*: `DRAFT`, `PUBLISHED`, `ARCHIVED` (hanya berlaku untuk admin).
  * `cabangUuid` *(UUID, optional)*: Filter cabang (hanya berlaku jika Superadmin atau Public).
  * `fixed=all` *(string, optional)*: Mengambil seluruh status (hanya untuk admin).

**Contoh Response Sukses (200 OK)**:
```json
{
  "success": true,
  "message": "Berhasil mengambil data berita",
  "result": {
    "data": [
      {
        "uuid": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "judul": "Kongres Nasional PIKI Ke-VI Sukses Diselenggarakan",
        "slug": "kongres-nasional-piki-ke-vi",
        "ringkasan": "Kongres berlangsung meriah dengan dihadiri delegasi seluruh DPD.",
        "url_thumbnail_img": "https://storage.piki.id/news/thumb1.jpg",
        "statusNewsUtama": "PUBLISHED",
        "jumlah_dibaca": 154,
        "durasi_baca": 3,
        "cabangUuid": "820ce3b2-6c2e-4b71-9c3a-d68a9f390001",
        "cabang": {
          "namaCabang": "DPP Pusat"
        },
        "author": {
          "uuid": "4afffe07-e966-497e-ab2a-9e2d9de8c7f6",
          "username": "admin_dpp",
          "email": "admin-dpp@piki.org"
        },
        "insert_at": "2026-10-17T08:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "pageSize": 10,
      "totalRecords": 1,
      "totalPages": 1
    }
  }
}
```

---

### 3.2. Detail Berita (ID atau Slug)
* **Method**: `GET`
* **URL**: `/api/v1/news-utama/:uuid` atau `/api/v1/news-utama/slug/:slug`
* **Fitur Tambahan**: Dilengkapi pelacak anti-spam views berbasis **Redis** (10 menit TTL per IP / User UUID). Saat endpoint ini diakses, counter `jumlah_dibaca` otomatis bertambah secara non-blocking.

---

### 3.3. Tambah Berita Baru (Create)
* **Method**: `POST`
* **URL**: `/api/v1/news-utama`
* **Middleware**: `authenticate`, `scope`, `authorize("NEWS_UTAMA_CREATE", "MANAGE_ALL_CABANG")`, `validate(createNewsUtamaBulkSchema)`
* **Headers**: `Authorization: Bearer <TOKEN>`
* **Request Body**:
```json
{
  "judul": "Rapat Koordinasi Wilayah DPC Jawa Barat",
  "ringkasan": "Konsolidasi pengurus cabang menghadapi tahun kerja 2026.",
  "konten": "<p>Isi artikel berita lengkap minimal 10 karakter...</p>",
  "slug": "rapat-koordinasi-wilayah-dpc-jabar-2026",
  "url_thumbnail_img": "https://storage.piki.id/news/rakorwil.jpg",
  "statusNewsUtama": "PUBLISHED",
  "durasi_baca": 2,
  "cabangUuid": "1f9b1e5d-7a1b-4d56-8e9a-112233445566",
  "kategori": [
    "e98d8900-53bc-42b4-9694-817651a2d698"
  ],
  "tags": [
    "296be6e2-ee6e-445a-8b1b-4971c0800b65"
  ]
}
```

> **Catatan Scoping:**
> * Jika yang mengirim adalah **Admin Cabang**: Field `cabangUuid` di atas diabaikan dan otomatis diganti dengan `scope.cabangId` milik admin login.
> * Jika yang mengirim adalah **Superadmin (DPP)**: Field `cabangUuid` akan disimpan sesuai body (atau default ke DPP Pusat jika tidak disertakan).

---

### 3.4. Update Berita
* **Method**: `POST`
* **URL**: `/api/v1/news-utama/:uuid/update`
* **Middleware**: `authenticate`, `scope`, `authorize("NEWS_UTAMA_UPDATE", "MANAGE_ALL_CABANG")`, `validate(updateNewsUtamaSchema)`
* **Guard Scoping**:
  * Sistem akan membaca berita terkait dari DB.
  * Jika bukan Superadmin dan `existingNews.cabangUuid !== scope.cabangId`, API merespons:
    ```json
    {
      "success": false,
      "message": "FORBIDDEN: Anda tidak memiliki izin mengelola berita cabang lain atau berita pusat"
    }
    ```
    *(HTTP Status: 403 Forbidden)*

---

### 3.5. Arsipkan Berita (Archive)
* **Method**: `POST`
* **URL**: `/api/v1/news-utama/:uuid/archive`
* **Middleware**: `authenticate`, `scope`, `authorize("NEWS_UTAMA_ARCHIVE", "MANAGE_ALL_CABANG")`
* **Guard Scoping**:
  * Berita hanya bisa diarsipkan oleh Superadmin atau Admin dari cabang pemilik berita tersebut.
  * Status berita akan diubah menjadi `ARCHIVED`.

---

## 4. Mekanisme Anti-Spam Pageview (Redis)

Saat berita dibuka, backend mengeksekusi `trackViewNewsUtama`:
1. Mengambil identifier penonton:
   * Pengguna login: `user:<UUID>`
   * Pengunjung publik (guest): `ip:<IP_ADDRESS>`
2. Memeriksa kunci Redis: `news:view:<NEWS_UUID>:<IDENTIFIER>`
3. Jika kunci belum ada:
   * Redis menyimpan kunci dengan masa kedaluwarsa **10 menit** (`EX: 600`).
   * Database menaikkan counter `jumlah_dibaca` sebanyak `+1`.
4. Jika kunci masih aktif: Request dibaca normal tanpa menambah counter.

