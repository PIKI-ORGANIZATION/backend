# 🗺️ ERD & Data Schema: Modul Registrasi 5 Tahapan & Master Wilayah PIKI

Dokumentasi ini berisi **Flowchart Arsitektur Sistem**, **Entity Relationship Diagram (ERD)** visual, spesifikasi struktur tabel database, dan alur relasi data untuk memudahkan tim **Frontend (FE)** dalam melakukan integrasi API.

---

## 🖼️ 1. Visual Flowchart Arsitektur Sistem & ERD Database

![Visual Flowchart Arsitektur Registrasi PIKI 5 Tahapan](erd_flowchart_registrasi_piki.jpg)

---

## 📊 2. ERD (Entity Relationship Diagram) Mermaid

```mermaid
erDiagram
    Akun ||--o| Senior : "memiliki profil KTA (1-to-1)"
    Akun ||--o{ Registrasi : "melakukan registrasi (1-to-Many)"
    Registrasi ||--o{ RegistrasiLog : "mencatat audit log (1-to-Many)"
    Registrasi }|--o| Cabang : "terhubung ke Cabang (Many-to-1)"
    Registrasi }|--o| Senior : "menghasilkan data Senior saat aktif (1-to-1)"
    DppDpc }|--o| DataMasterWilayah : "referensi kode provinsi & kabupaten"

    Akun {
        uuid uuid PK
        string email UK
        string username UK
        string password
        string statusAkun "ACTIVE / PENDING"
        uuid seniorUuid FK "Nullable"
        datetime insert_at
    }

    Registrasi {
        uuid id PK
        string namaLengkap
        date tanggalLahir
        string noWa
        string email
        string alamatDomisili
        string fileKtpUrl
        string dpp "Provinsi"
        string dpc "Kabupaten/Kota"
        string kode_provinsi
        string kode_kabupaten
        boolean setujuKebenaranData
        boolean setujuPengelolaanData
        boolean setujuKerahasiaanData
        datetime tglPersetujuanPdp
        string statusVerifikasi "PENDING / APPROVED_DPC / APPROVED_DPP / REJECTED"
        string statusPembayaran "UNPAID / PAID"
        string noTagihan UK
        float nominalIuran
        string statusKta "INACTIVE / ACTIVE"
        string noKta UK
        uuid akunUuid FK "1-to-1"
        uuid seniorUuid FK "1-to-1"
        int langkahSekarang "1 s/d 5"
    }

    RegistrasiLog {
        uuid id PK
        uuid registrasiId FK
        string aksi
        string keterangan
        uuid actorUuid
        string actorNama
        datetime created_at
    }

    Senior {
        uuid uuid PK
        string namaLengkap
        date tanggalLahir
        string noWa
        string provinsi
        string kotaDomisili
        string statusKeanggotaan "MEMBER / NON_MEMBER"
        boolean isApprovedByPCPS
        boolean isApprovedByPNPS
    }

    DppDpc {
        int id PK
        string dpp "Provinsi"
        string dpc "Kabupaten/Kota"
        string kode_provinsi
        string kode_kabupaten
        string pengurus
        string no_handphone
    }

    DataMasterWilayah {
        int id PK
        string kode_provinsi
        string nama_provinsi
        string kode_kabupaten
        string nama_kabupaten
        string kode_kecamatan
        string nama_kecamatan
        string kode_kel_desa
        string nama_kel_desa
    }
```

---

## 🔗 3. Penjelasan Relasi Antar Tabel (Entity Relationships)

### A. `Akun` ⟷ `Registrasi` (1-to-Many)
- **Constraint**: `Registrasi.akunUuid` ➔ `Akun.uuid` (`@unique`).
- **Penjelasan**: Saat calon anggota mengisi Form Registrasi Tahap 1, backend **otomatis membuat record `Akun`** baru (Email & Password di-hash bcrypt). `akunUuid` pada `Registrasi` menunjuk ke akun tersebut.

### B. `Registrasi` ⟷ `RegistrasiLog` (1-to-Many)
- **Constraint**: `RegistrasiLog.registrasiId` ➔ `Registrasi.id` (`onDelete: Cascade`).
- **Penjelasan**: Setiap perubahan status (Submit Tahap 1, Verifikasi DPC, SLA Bypass ke DPP, Pembayaran Iuran, Aktivasi KTA) otomatis mencatat riwayat audit log di tabel `RegistrasiLog`.

### C. `Registrasi` ⟷ `Senior` (1-to-1)
- **Constraint**: `Registrasi.seniorUuid` ➔ `Senior.uuid` (`@unique`).
- **Penjelasan**: Ketika pendaftaran mencapai **Tahap 5 (Aktivasi KTA Digital)**, backend otomatis menerbitkan Nomor KTA dan membuat record `Senior` (Profil Keanggotaan Resmi) yang terhubung ke `Registrasi` dan `Akun`.

### D. `DppDpc` ⟷ `DataMasterWilayah` (Cascading Reference)
- **Penjelasan**: Data pengurus DPP & DPC di tabel `dpp_dpc` telah dibersihkan & dihubungkan dengan `kode_provinsi` dan `kode_kabupaten` dari tabel `data_master_wilayah`. Ini digunakan oleh API Cascading Dropdown Frontend.

---

## 📋 4. Kamus Data & Detail Field Tabel `registrasi`

| Nama Kolom | Tipe Data | Nullable? | Default | Deskripsi / Fungsi untuk Frontend |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | ❌ No | `uuid()` | Primary Key Registrasi |
| `namaLengkap` | `String` | ❌ No | - | Nama lengkap pendaftar |
| `tanggalLahir` | `Date` | ❌ No | - | Tanggal lahir pendaftar (`YYYY-MM-DD`) |
| `noWa` | `String` | ❌ No | - | Nomor WhatsApp pendaftar (harus angka) |
| `email` | `String` | ❌ No | - | Alamat email pendaftar |
| `alamatDomisili` | `String` | ❌ No | - | Alamat lengkap domisili pendaftar |
| `fileKtpUrl` | `String` | ❌ No | - | URL / Path upload foto KTP |
| `dpp` | `String` | ⭕ Yes | `null` | Nama DPP / Provinsi yang dipilih |
| `dpc` | `String` | ⭕ Yes | `null` | Nama DPC / Kabupaten/Kota yang dipilih |
| `kode_provinsi` | `String` | ⭕ Yes | `null` | Kode provinsi dari master wilayah |
| `kode_kabupaten` | `String` | ⭕ Yes | `null` | Kode kabupaten dari master wilayah |
| `setujuKebenaranData` | `Boolean` | ❌ No | `false` | Checklist Persetujuan Kebenaran Data |
| `setujuPengelolaanData` | `Boolean` | ❌ No | `false` | Checklist Persetujuan UU PDP |
| `setujuKerahasiaanData` | `Boolean` | ❌ No | `false` | Checklist Persetujuan Kerahasiaan Data |
| `tglPersetujuanPdp` | `DateTime` | ⭕ Yes | `now()` | Timestamp saat persetujuan PDP di-submit |
| `statusVerifikasi` | `String` | ❌ No | `"PENDING_VERIFIKASI_DPC"` | Status verifikasi berkas (`PENDING_VERIFIKASI_DPC`, `APPROVED_DPC`, `BYPASSED_TO_DPP`, `APPROVED_DPP`, `REJECTED`) |
| `isBypassedSla` | `Boolean` | ❌ No | `false` | Flag apakah pendaftaran kena Auto-Bypass SLA 3 hari |
| `statusPembayaran` | `String` | ❌ No | `"UNPAID"` | Status pembayaran iuran pertama (`UNPAID`, `PAID`) |
| `noTagihan` | `String` | ⭕ Yes | `null` | Nomor Invoice Tagihan Iuran |
| `nominalIuran` | `Float` | ❌ No | `50000` | Nominal iuran bulan pertama (Rp 50.000) |
| `statusKta` | `String` | ❌ No | `"INACTIVE"` | Status KTA Digital (`INACTIVE`, `ACTIVE`) |
| `noKta` | `String` | ⭕ Yes | `null` | Nomor KTA Digital resmi (`KTA-PIKI-YYYY-XXXX`) |
| `akunUuid` | `UUID` | ⭕ Yes | `null` | Foreign Key ke tabel `Akun` |
| `seniorUuid` | `UUID` | ⭕ Yes | `null` | Foreign Key ke tabel `Senior` |
| `langkahSekarang` | `Int` | ❌ No | `1` | Indikator langkah tahapan pendaftaran (1 s/d 5) |

---

## 🛠️ 5. Referensi Endpoint API untuk Tim Frontend

| Tahap | Method | Endpoint | Fungsi | Payload Utama |
| :--- | :--- | :--- | :--- | :--- |
| **Master** | `GET` | `/api/v1/master-wilayah/dpp` | Ambil daftar DPP (Provinsi) | - |
| **Master** | `GET` | `/api/v1/master-wilayah/dpc?dpp=Sumatera%20Utara` | Ambil daftar DPC berbasis DPP | Query Parameter `dpp` |
| **Tahap 1** | `POST` | `/api/v1/registrasi` | Submit Registrasi & Buat Akun | `namaLengkap`, `noWa`, `email`, `confirmEmail`, `password`, `dpp`, `dpc`, Persetujuan PDP |
| **Tahap 2/3** | `PATCH` | `/api/v1/registrasi/:id/verifikasi` | Verifikasi Berkas DPC/DPP | `status`: `"APPROVED_DPC"` / `"REJECTED"` |
| **Tahap 3** | `POST` | `/api/v1/registrasi/check-sla` | Trigger Auto-Bypass SLA 3 Hari | - |
| **Tahap 4** | `PATCH` | `/api/v1/registrasi/:id/pembayaran` | Konfirmasi Bayar Iuran | `statusPembayaran`: `"PAID"`, `buktiBayarUrl` |
| **Tahap 5** | `PATCH` | `/api/v1/registrasi/:id/aktivasi-kta` | Terbitkan & Aktifkan KTA Digital | `actorNama` |
