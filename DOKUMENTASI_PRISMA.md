# 📘 Panduan Lengkap Prisma ORM & Onboarding Developer - Project PIKI Backend

Dokumentasi ini dibuat khusus untuk membantu kamu dan programmer lain dalam meng-inisialisasi (*setup* awal), menjalankan, serta menguasai **Prisma ORM** pada proyek backend PIKI (`piki-backend`).

---

## 🚩 TUTORIAL ONBOARDING & SETUP PROJEK UNTUK DEVELOPER BARU

Ikuti **6 langkah praktis** berikut ketika baru pertama kali mengloning / meng-inisialisasi projek ini di laptop lokal kamu:

### 1️⃣ Install Dependencies
Pastikan kamu menggunakan **Bun** runtime. Jalankan perintah:
```bash
bun install
```

### 2️⃣ Konfigurasi Environment (`.env`)
Salin file template `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```
Buka file `.env` dan pastikan konfigurasi PostgreSQL dan Redis sudah sesuai dengan lingkungan lokal kamu:
```env
PORT=3000
NODE_ENV=development

# Database Configuration
POSTGRES_USER=postgres
POSTGRES_PASSWORD=1
POSTGRES_DB=piki_db
POSTGRES_PORT=5432
DATABASE_URL="postgresql://postgres:1@localhost:5432/piki_db?schema=public"

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379

# Security
JWT_SECRET=piki-super-secret-key-dev-2026
```

### 3️⃣ Sinkronkan Database dengan Histori Migrasi (`db:migrate`)
**⚠️ PENTING UNTUK KERJA TIM:** JANGAN gunakan `db:push` jika sudah ada file di dalam folder `prisma/migrations`. Gunakan `db:migrate` agar riwayat migrasi database tetap sinkron.

Jalankan 2 perintah ini secara berurutan untuk menerapkan histori migrasi SQL ke PostgreSQL lokal kamu dan menyiapkan Prisma Client:
```bash
bun run db:migrate
bun run db:generate
```
> **Catatan**: `db:migrate` bertugas membuat tabel di database, sedangkan `db:generate` memastikan tipe data TypeScript Prisma Client sudah up-to-date dan siap digunakan.

### 4️⃣ Jalankan Data Seeding (`bun run seed`)
Untuk mengisikan data awal / master ke dalam database (seperti Data Master Wilayah, Cabang, RBAC Roles/Permissions `REGISTRASI_*`, News, Struktur Organisasi, dan Page Settings):
```bash
bun run seed
```

### 5️⃣ Buka GUI Prisma Studio (Visual Database Editor)
Gunakan Prisma Studio jika ingin melihat, mengedit, atau memverifikasi isi tabel secara visual melalui browser:
```bash
bun run db:studio
```
Akses di URL `http://localhost:5555`.

### 6️⃣ Jalankan Development Server
Mulai backend server dalam mode hot-reload:
```bash
bun run dev
```
Backend akan berjalan di **`http://localhost:3000`**. Kamu bisa langsung menggunakan koleksi Postman yang telah disediakan di file `postman_collection.json` untuk menguji API.

---

## 🔄 WORKFLOW HARIAN PRISMA & GIT (BEBAS KONFLIK)

Agar tidak terjadi konflik riwayat database dengan teman satu tim, **IKUTI ATURAN INI**:

1. 📥 **Setiap Habis `git pull`**:
   Jika temanmu membuat tabel baru atau ada perubahan skema, jalankan perintah ini agar tabel di laptopmu ikut ter-update:
   ```bash
   bun run db:migrate
   bun run seed
   ```

2. 📤 **Setiap Mengubah `schema.prisma` (Menambah Tabel/Kolom Baru)**:
   **Sebelum di-push ke git**, kamu wajib membuat file migrasi SQL baru. Jalankan perintah ini dan beri nama migrasinya (misal: `tambah_tabel_x`):
   ```bash
   bun run db:migrate
   ```

---

## 🛠️ DAFTAR PERINTAH (COMMANDS) PRISMA

Di file `package.json`, telah disiapkan skrip Bun agar tidak perlu mengetik perintah yang panjang:

| Command | Perintah Asli | Kegunaan |
| :--- | :--- | :--- |
| `bun run db:push` | `prisma db push` | Mengirim struktur dari `schema.prisma` langsung ke DB (Cocok untuk Dev/Prototyping). |
| `bun run db:migrate` | `prisma migrate dev` | Membuat file histori migrasi di `prisma/migrations` (Cocok untuk Staging/Production). |
| `bun run db:generate` | `prisma generate` | Memperbarui type definition TypeScript Prisma Client. |
| `bun run db:seed` / `bun run seed` | `bun prisma/seed.ts` | Mengisi data dummy / master awal ke DB. |
| `bun run db:studio` | `prisma studio` | Membuka web GUI visual editor di `http://localhost:5555`. |

---

## 🚀 MODUL TERBARU YANG TELAH DIIMPLEMENTASIKAN

### 1. 📝 Modul Registrasi 5 Tahapan & Auto Buat Akun
Tabel terkait: `Registrasi`, `RegistrasiLog`, `Akun`, `Senior`

* **Tahap 1 (Submit Pendaftaran)**: Menyiapkan data identitas, persetujuan UU PDP, serta **otomatis membuat record `Akun` baru** dengan role `"USER"` dan password yang di-hash bcrypt.
* **Tahap 2 & 3 (Verifikasi DPC/DPP)**: Mengubah status verifikasi (`APPROVED_DPC`, `APPROVED_DPP`, `REJECTED`) & pencatatan histori di `RegistrasiLog`.
* **SLA Bypass**: Endpoint otomatis `/api/v1/registrasi/check-sla` untuk auto-escalate pendaftaran yang mengendap > 3 hari ke DPP (`BYPASSED_TO_DPP`).
* **Tahap 4 (Pembayaran Iuran)**: Mengubah status pembayaran iuran (`PAID`, `UNPAID`).
* **Tahap 5 (Penerbitan KTA Digital)**: Mengaktifkan KTA Digital (`KTA-PIKI-YYYY-XXXX`), membuat profil `Senior`, dan menghubungkannya dengan `Akun`.

#### Contoh Transaksi Prisma Registrasi + Auto Akun (`registrasi.service.ts`):
```typescript
const result = await prisma.$transaction(async (tx) => {
  // 1. Buat Akun terhubung
  const newAkun = await tx.akun.create({
    data: {
      email: payload.email,
      username: generateUsername(payload.namaLengkap),
      password: hashedPassword,
      statusAkun: "ACTIVE",
    },
  });

  // 2. Buat Pendaftaran Registrasi Tahap 1
  const newReg = await tx.registrasi.create({
    data: {
      ...payload,
      akunUuid: newAkun.uuid,
      statusVerifikasi: "PENDING_VERIFIKASI_DPC",
      statusPembayaran: "UNPAID",
      statusKta: "INACTIVE",
    },
  });

  return newReg;
});
```

---

### 2. 🗺️ Modul Master Wilayah (DPP & DPC Cascading Dropdown)
Tabel terkait: `DataMasterWilayah`, `DppDpc`

* **`GET /api/v1/master-wilayah/dpp`**: Mengambil daftar seluruh DPP (Provinsi) unik.
* **`GET /api/v1/master-wilayah/dpc?dpp=Sumatera%20Utara`**: Mengambil daftar DPC (Kabupaten/Kota) yang berada di bawah DPP pilihan.

#### Contoh Query Relasi Master Wilayah (`masterWilayah.service.ts`):
```typescript
// Ambil list DPC berdasarkan DPP pilihan
const listDpc = await prisma.dppDpc.findMany({
  where: {
    dpp: { equals: dppName, mode: "insensitive" },
  },
  select: {
    dpc: true,
    kode_kabupaten: true,
    kode_provinsi: true,
  },
  orderBy: { dpc: "asc" },
});
```

---

## 📖 CARA PENGGUNAAN KODE PRISMA (CRUD TUTORIAL)

Di setiap file backend (`controllers`, `services`, `middlewares`), kamu hanya perlu mengimpor `prisma` dari `@/config/prisma`:

```typescript
import { prisma } from "../config/prisma.js";
```

### 1. ➕ CREATE (Menambah Data)

#### A. Tambah 1 Data
```typescript
const newCabang = await prisma.cabang.create({
  data: {
    namaCabang: "Cabang Jakarta Pusat",
    kodeCabang: "JKT-01",
  },
});
```

#### B. Tambah Data Parent + Child Sekaligus (Nested Create)
```typescript
const newAkun = await prisma.akun.create({
  data: {
    email: "userbaru@gmail.com",
    password: hashedPassword,
    senior: {
      create: {
        namaLengkap: "Ahmad Subarjo",
        noAnggota: "PNPS-888",
      },
    },
  },
});
```

---

### 2. 🔍 READ (Mengambil Data)

#### A. Cari Berdasarkan ID Unik (`findUnique`)
```typescript
const akun = await prisma.akun.findUnique({
  where: { email: "userbaru@gmail.com" },
});
```

#### B. Ambil Banyak Data dengan Filter & Sorting (`findMany`)
```typescript
const listRegistrasi = await prisma.registrasi.findMany({
  where: { statusVerifikasi: "PENDING_VERIFIKASI_DPC" },
  orderBy: { created_at: "desc" },
  take: 10,
});
```

#### C. Join Tabel Lain (`include`)
```typescript
const registrasiWithAkun = await prisma.registrasi.findUnique({
  where: { id: regId },
  include: {
    akun: true,
    senior: true,
    logs: true,
  },
});
```

---

### 3. ✏️ UPDATE (Mengubah Data)

#### A. Update 1 Data (`update`)
```typescript
const updatedReg = await prisma.updatedReg = await prisma.registrasi.update({
  where: { id: regId },
  data: {
    statusVerifikasi: "APPROVED_DPC",
    catatanVerifikasi: "Berkas lengkap",
  },
});
```

---

### 4. 🗑️ DELETE (Menghapus Data)

#### A. Hapus 1 Data (`delete`)
```typescript
await prisma.registrasi.delete({
  where: { id: regId },
});
```

---

### 5. 🔐 TRANSAKSI DATABASE (`$transaction`)

Jika kamu butuh beberapa perintah query yang aman dan harus berhasil semua (Atomic Operation):

```typescript
const hasil = await prisma.$transaction(async (tx) => {
  // Query 1
  const a = await tx.registrasi.update({ ... });
  // Query 2
  const b = await tx.registrasiLog.create({ ... });
  return { a, b };
});
```

---

## 📌 RINGKASAN STRUKTUR MODEL PIKI BACKEND

* `Registrasi` — Data pendaftaran anggota baru 5 tahapan.
* `RegistrasiLog` — Histori audit verifikasi & aktivasi registrasi.
* `DataMasterWilayah` — Master data wilayah Indonesia (Provinsi, Kabupaten, Kecamatan, Desa).
* `DppDpc` — Pemetaan wilayah DPP (Provinsi) dan DPC (Kabupaten/Kota) PIKI.
* `Akun` — Kredensial login, email, password (bcrypt), role.
* `Senior` — Profil keanggotaan resmi KTA Digital.

---
*Dokumentasi ini disimpan di repositori backend PIKI sebagai panduan teknis Prisma ORM & Onboarding Developer.*
