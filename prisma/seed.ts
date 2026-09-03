// Types refreshed
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient({
  log: ["info", "warn", "error"],
});

// ============================================================
// MAIN
// ============================================================
async function main() {
  console.log("🚀 Start Seeding...");

  // 1. Cabang + SejarahCabang + Senior + Akun
  await seedAllCabang();

  // 2. RBAC
  await seedRoles();
  await seedPermissions();
  await assignPermissionsToRole();
  await assignRolesToAkun();

  // 3. News
  await seedNews();

  // 4. Jabatan & Bidang
  await seedJabatan();
  await seedBidang();

  await seedAnggota();

  // 5. Struktur Organisasi
  await seedStrukturOrganisasi();

  // 6. Program Kerja + Agenda + Arsip
  await seedProgram();

  // 7. Galeri (Album Foto + Video)
  await seedGaleri();

  // 8. Kritik & Saran (FAQ + Form Pengaduan)
  await seedKritikSaran();

  // 11. Master Wilayah & DPP DPC PIKI
  await seedDataMasterWilayah();
  await seedDpdDpc();
  await seedDpd();

  console.log("✅ Seeding selesai.");
}

// ============================================================
// HELPERS
// ============================================================
async function getAdmin() {
  return prisma.akun.findUniqueOrThrow({ where: { email: "admin-dpp@piki.org" } });
}
async function getUser() {
  return prisma.akun.findUniqueOrThrow({ where: { email: "user@pnps.id" } });
}

// ============================================================
// 1. CABANG
// ============================================================

// Helper home hero section dan countdown di DPP
const getHomeHeroDefault = (isPusat: boolean) => {
  if (!isPusat) return {};

  return {
    urlBannerImg:
      "https://www.hariansib.com/cdn/uploads/images/2026/01/3057_William-Sabandar-Pimpin-DPP-GMKI-2025-2028--Usung-Misi-3K-2D-dan-2P.png",
    titleHomeHero:
      "Pengurus Nasional Perkumpulan Senior (DPP) Gerakan Mahasiswa Kristen Indonesia (GMKI)",
    headlineHomeHero:
      "Bersatu melayani lewat peran senior GMKI se-tanah air untuk menghadirkan damai sejahtera bagi Indonesia",
  };
};

const getCountdownDefault = (isPusat: boolean) => {
  if (!isPusat) return {};

  return {
    isCountdownActive: true,
    endTimeCountdown: new Date("2026-05-09T00:00:00"),
    keteranganCountdown: "Menuju agenda nasional DPP",
  };
};

const CABANG_LIST = [
  {
    nama: "DPP Pusat",
    kota: "Jakarta",
    kotaEmail: "pusat",
    provinsi: "DKI Jakarta",
    email: "pusat@dpp.id",
    wilayah: "Nasional",
    isPusat: true,
    visi: "Bersatu Melayani lewat Peran Senior GMKI untuk Mewujudkan Damai Sejahtera di Bumi Indonesia",
    misi: "Menjalankan misi 3K (Komunikasi, Kolaborasi, Kebersamaan), 2D (Daya dan Dana), serta 2P (Platform Penggerak).",
    deskripsi: "Pengurus Nasional Perkumpulan Senior GMKI sebagai pusat koordinasi nasional.",
    sejarah: [
      { timeline: "2025", deskripsiTimeline: "DPP GMKI resmi dibentuk sebagai wadah koordinasi nasional senior GMKI." },
      { timeline: "2026", deskripsiTimeline: "Pelantikan Pengurus Nasional DPP GMKI Periode 2025-2028." },
    ],
  },
  {
    nama: "Jakarta",
    kota: "Jakarta",
    kotaEmail: "jakarta",
    provinsi: "DKI Jakarta",
    email: "jakarta@dpp.id",
    wilayah: "Daerah",
    isPusat: false,
    visi: "Membangun solidaritas dan kontribusi senior GMKI di Jakarta.",
    misi: "Kolaborasi, Komunikasi, dan Aksi Nyata.",
    deskripsi: "Cabang resmi DPP Jakarta.",
    sejarah: [
      { timeline: "2020", deskripsiTimeline: "Pembentukan awal komunitas senior Jakarta." },
      { timeline: "2022", deskripsiTimeline: "Jakarta resmi menjadi cabang aktif DPP." },
      { timeline: "2025", deskripsiTimeline: "Pelantikan kepengurusan baru Jakarta." },
    ],
  },
  {
    nama: "Surabaya",
    kota: "Surabaya",
    kotaEmail: "surabaya",
    provinsi: "Jawa Timur",
    email: "surabaya@dpp.id",
    wilayah: "Daerah",
    isPusat: false,
    visi: "Membangun solidaritas dan kontribusi senior GMKI di Surabaya.",
    misi: "Kolaborasi, Komunikasi, dan Aksi Nyata.",
    deskripsi: "Cabang resmi DPP Surabaya.",
    sejarah: [
      { timeline: "2020", deskripsiTimeline: "Pembentukan awal komunitas senior Surabaya." },
      { timeline: "2022", deskripsiTimeline: "Surabaya resmi menjadi cabang aktif DPP." },
      { timeline: "2025", deskripsiTimeline: "Pelantikan kepengurusan baru Surabaya." },
    ],
  },
  {
    nama: "Yogyakarta",
    kota: "Yogyakarta",
    kotaEmail: "yogyakarta",
    provinsi: "DI Yogyakarta",
    email: "yogyakarta@dpp.id",
    wilayah: "Daerah",
    isPusat: false,
    visi: "Membangun solidaritas dan kontribusi senior GMKI di Yogyakarta.",
    misi: "Kolaborasi, Komunikasi, dan Aksi Nyata.",
    deskripsi: "Cabang resmi DPP Yogyakarta.",
    sejarah: [
      { timeline: "2020", deskripsiTimeline: "Pembentukan awal komunitas senior Yogyakarta." },
      { timeline: "2022", deskripsiTimeline: "Yogyakarta resmi menjadi cabang aktif DPP." },
      { timeline: "2025", deskripsiTimeline: "Pelantikan kepengurusan baru Yogyakarta." },
    ],
  },
  {
    nama: "Bandung",
    kota: "Bandung",
    kotaEmail: "bandung",
    provinsi: "Jawa Barat",
    email: "bandung@dpp.id",
    wilayah: "Daerah",
    isPusat: false,
    visi: "Membangun solidaritas dan kontribusi senior GMKI di Bandung.",
    misi: "Kolaborasi, Komunikasi, dan Aksi Nyata.",
    deskripsi: "Cabang resmi DPP Bandung.",
    sejarah: [
      { timeline: "2020", deskripsiTimeline: "Pembentukan awal komunitas senior Bandung." },
      { timeline: "2022", deskripsiTimeline: "Bandung resmi menjadi cabang aktif DPP." },
      { timeline: "2025", deskripsiTimeline: "Pelantikan kepengurusan baru Bandung." },
    ],
  },
  {
    nama: "Kupang",
    kota: "Kupang",
    kotaEmail: "kupang",
    provinsi: "Nusa Tenggara Timur",
    email: "kupang@dpp.id",
    wilayah: "Daerah",
    isPusat: false,
    visi: "Membangun solidaritas dan kontribusi senior GMKI di Kupang.",
    misi: "Kolaborasi, Komunikasi, dan Aksi Nyata.",
    deskripsi: "Cabang resmi DPP Kupang.",
    sejarah: [
      { timeline: "2020", deskripsiTimeline: "Pembentukan awal komunitas senior Kupang." },
      { timeline: "2022", deskripsiTimeline: "Kupang resmi menjadi cabang aktif DPP." },
      { timeline: "2025", deskripsiTimeline: "Pelantikan kepengurusan baru Kupang." },
    ],
  },
];

async function seedAllCabang() {
  console.log("Seeding Cabang, SejarahCabang, Senior, Akun...");
  const passwordHash = await bcrypt.hash("password123", 10);

  for (const c of CABANG_LIST) {
    // 1a. Upsert Cabang
    const cabang = await prisma.cabang.upsert({
      where: { email: c.email },
      update: {},
      create: {
      namaCabang: c.nama,
      alamat: `Jl. ${c.kota} No.1`,
      kabupatenKota: c.kota,
      provinsi: c.provinsi,
      wilayah: c.wilayah,
      statusCabang: "ACTIVE",
      isCabang: !c.isPusat,
      deskripsiCabang: c.deskripsi,
      visi: c.visi,
      misi: {
        create: [
          {
            teks: c.deskripsi || "", // atau split kalau banyak
          },
        ],
      },
      noWa: "08123456789",
      instagram: `@dpp.${c.kotaEmail}`,
      facebook: `DPP ${c.nama}`,
      youtube: `DPP ${c.nama}`,
      email: c.email,

      ////////////////////////////////////////////////////
      // NEW FIELD: HOME HERO
      ////////////////////////////////////////////////////
      ...getHomeHeroDefault(c.isPusat),

      ////////////////////////////////////////////////////
      // NEW FIELD: COUNTDOWN
      ////////////////////////////////////////////////////
      ...getCountdownDefault(c.isPusat),
    },
    });

    // 1b. SejarahCabang
    await prisma.sejarahCabang.deleteMany({ where: { cabang_uuid: cabang.uuid } });
    await prisma.sejarahCabang.createMany({
      data: c.sejarah.map((s) => ({
        timeline: s.timeline,
        deskripsiTimeline: s.deskripsiTimeline,
        cabang_uuid: cabang.uuid,
      })),
    });

    // 1c. Senior Admin
    let adminSenior = await prisma.anggota.findFirst({
      where: { namaLengkap: `Admin ${c.nama}`, cabangUuid: cabang.uuid },
    });
    if (!adminSenior) {
      adminSenior = await prisma.anggota.create({
        data: {
          namaLengkap: `Admin ${c.nama}`,
          namaPanggil: "Admin",
          angkatan: "2018",
          statusKeanggotaan: "MEMBER",
          cabangUuid: cabang.uuid,
          isApprovedByDPC: true,
          isApprovedByDPP: true,
        },
      });
    }

    // 1d. Senior Ketua
    let ketuaSenior = await prisma.anggota.findFirst({
      where: { namaLengkap: `Ketua ${c.nama}`, cabangUuid: cabang.uuid },
    });
    if (!ketuaSenior) {
      ketuaSenior = await prisma.anggota.create({
        data: {
          namaLengkap: `Ketua ${c.nama}`,
          namaPanggil: "Ketua",
          angkatan: "2015",
          statusKeanggotaan: "MEMBER",
          cabangUuid: cabang.uuid,
          isApprovedByDPC: true,
          isApprovedByDPP: true,
        },
      });
    }

    // 1e. Senior Anggota
    const anggotaExists = await prisma.anggota.findFirst({
      where: { namaLengkap: `Senior ${c.nama}`, cabangUuid: cabang.uuid },
    });
    if (!anggotaExists) {
      await prisma.anggota.create({
        data: {
          namaLengkap: `Senior ${c.nama}`,
          namaPanggil: "Senior",
          angkatan: "2020",
          statusKeanggotaan: "MEMBER",
          cabangUuid: cabang.uuid,
          isApprovedByDPC: true,
          isApprovedByDPP: true,
        },
      });
    }

    // 1f. Akun Admin
    const adminEmail = c.isPusat ? "admin-dpp@piki.org" : `admin_${c.kotaEmail}@pnps.id`;
    const adminAkun = await prisma.akun.upsert({
      where: { email: adminEmail },
      update: {},
      create: {
        username: c.isPusat ? "admin" : `admin_${c.kotaEmail}`,
        email: adminEmail,
        password: passwordHash,
        statusAkun: "ACTIVE",
        anggotaUuid: adminSenior.uuid,
      },
    });

    // 1g. Akun Ketua
    const ketuaEmail = c.isPusat ? "user@pnps.id" : `ketua_${c.kotaEmail}@pnps.id`;
    const ketuaAkun = await prisma.akun.upsert({
      where: { email: ketuaEmail },
      update: {},
      create: {
        username: c.isPusat ? "user" : `ketua_${c.kotaEmail}`,
        email: ketuaEmail,
        password: passwordHash,
        statusAkun: "ACTIVE",
        anggotaUuid: ketuaSenior.uuid,
      },
    });

    // 1h. Set ketuaUuid
    await prisma.cabang.updateMany({
      where: { ketuaUuid: ketuaAkun.uuid, NOT: { uuid: cabang.uuid } },
      data: { ketuaUuid: null },
    });
    await prisma.cabang.update({
      where: { uuid: cabang.uuid },
      data: { ketuaUuid: ketuaAkun.uuid },
    });

    console.log(`  ✅ ${c.nama} done`);
  }
  console.log("✅ Cabang seeded");
}

// ============================================================
// 2. RBAC
// ============================================================
async function seedRoles() {
  console.log("Seeding Roles...");
  const roles = [
    { namaRole: "SUPER_ADMIN",  deskripsi: "Akses penuh sistem",       statusRole: "ACTIVE" },
    { namaRole: "ADMIN_CABANG", deskripsi: "Admin per cabang",          statusRole: "ACTIVE" },
    { namaRole: "KETUA_CABANG", deskripsi: "Ketua cabang",              statusRole: "ACTIVE" },
    { namaRole: "USER",         deskripsi: "User standar / anggota",    statusRole: "ACTIVE" },
  ];
  for (const role of roles) {
    await prisma.role.upsert({ where: { namaRole: role.namaRole }, update: {}, create: role });
  }
  console.log("✅ Roles seeded");
}

async function seedPermissions() {
  console.log("Seeding Permissions...");
  const permissions = [
    // AKUN
    { namaPermission: "AKUN_READ",    deskripsi: "Melihat data akun" },
    { namaPermission: "AKUN_CREATE",  deskripsi: "Membuat akun baru" },
    { namaPermission: "AKUN_UPDATE",  deskripsi: "Mengubah data akun" },
    { namaPermission: "AKUN_DELETE",  deskripsi: "Menghapus akun" },
    // ROLE
    { namaPermission: "ROLE_READ",    deskripsi: "Melihat role" },
    { namaPermission: "ROLE_CREATE",  deskripsi: "Membuat role baru" },
    { namaPermission: "ROLE_UPDATE",  deskripsi: "Mengubah role" },
    { namaPermission: "ROLE_DELETE",  deskripsi: "Menghapus role" },
    // SENIOR
    { namaPermission: "SENIOR_READ",    deskripsi: "Melihat data senior" },
    { namaPermission: "SENIOR_CREATE",  deskripsi: "Membuat data senior" },
    { namaPermission: "SENIOR_UPDATE",  deskripsi: "Mengubah data senior" },
    { namaPermission: "SENIOR_DELETE",  deskripsi: "Menghapus data senior" },
    { namaPermission: "SENIOR_APPROVE", deskripsi: "Menyetujui data senior" },
    // CABANG
    { namaPermission: "CABANG_READ",    deskripsi: "Melihat data cabang" },
    { namaPermission: "CABANG_CREATE",  deskripsi: "Membuat cabang baru" },
    { namaPermission: "CABANG_UPDATE",  deskripsi: "Mengubah data cabang" },
    { namaPermission: "CABANG_DELETE",  deskripsi: "Menghapus cabang" },
    // NEWS
    { namaPermission: "NEWS_UTAMA_READ",    deskripsi: "Melihat artikel" },
    { namaPermission: "NEWS_UTAMA_CREATE",  deskripsi: "Membuat artikel" },
    { namaPermission: "NEWS_UTAMA_UPDATE",  deskripsi: "Mengubah artikel" },
    { namaPermission: "NEWS_UTAMA_PUBLISH", deskripsi: "Mempublikasikan artikel" },
    { namaPermission: "NEWS_UTAMA_ARCHIVE", deskripsi: "Mengarsipkan artikel" },
    { namaPermission: "NEWS_UTAMA_DELETE",  deskripsi: "Menghapus artikel" },
    { namaPermission: "NEWS_TAG_READ",          deskripsi: "Melihat tag berita" },
    { namaPermission: "NEWS_TAG_CREATE",         deskripsi: "Membuat tag berita" },
    { namaPermission: "NEWS_TAG_UPDATE",         deskripsi: "Mengubah tag berita" },
    { namaPermission: "NEWS_TAG_DELETE",         deskripsi: "Menghapus tag berita" },
    { namaPermission: "NEWS_KATEGORI_READ",      deskripsi: "Melihat kategori berita" },
    { namaPermission: "NEWS_KATEGORI_CREATE",    deskripsi: "Membuat kategori berita" },
    { namaPermission: "NEWS_KATEGORI_UPDATE",    deskripsi: "Mengubah kategori berita" },
    { namaPermission: "NEWS_KATEGORI_DELETE",    deskripsi: "Menghapus kategori berita" },
    // STRUKTUR ORGANISASI
    { namaPermission: "STRUKTUR_READ",    deskripsi: "Melihat struktur organisasi" },
    { namaPermission: "STRUKTUR_CREATE",  deskripsi: "Membuat struktur organisasi" },
    { namaPermission: "STRUKTUR_UPDATE",  deskripsi: "Mengubah struktur organisasi" },
    { namaPermission: "STRUKTUR_DELETE",  deskripsi: "Menghapus struktur organisasi" },
    // PROGRAM
    { namaPermission: "PROGRAM_READ",   deskripsi: "Melihat program kerja" },
    { namaPermission: "PROGRAM_CREATE", deskripsi: "Membuat program kerja" },
    { namaPermission: "PROGRAM_UPDATE", deskripsi: "Mengubah program kerja" },
    { namaPermission: "PROGRAM_DELETE", deskripsi: "Menghapus program kerja" },
    { namaPermission: "AGENDA_READ",    deskripsi: "Melihat agenda kegiatan" },
    { namaPermission: "AGENDA_CREATE",  deskripsi: "Membuat agenda kegiatan" },
    { namaPermission: "AGENDA_UPDATE",  deskripsi: "Mengubah agenda kegiatan" },
    { namaPermission: "AGENDA_DELETE",  deskripsi: "Menghapus agenda kegiatan" },
    { namaPermission: "ARSIP_READ",     deskripsi: "Melihat arsip kegiatan" },
    { namaPermission: "ARSIP_CREATE",   deskripsi: "Membuat arsip kegiatan" },
    { namaPermission: "ARSIP_UPDATE",   deskripsi: "Mengubah arsip kegiatan" },
    { namaPermission: "ARSIP_DELETE",   deskripsi: "Menghapus arsip kegiatan" },
    // GALERI
    { namaPermission: "GALERI_READ",    deskripsi: "Melihat galeri" },
    { namaPermission: "GALERI_CREATE",  deskripsi: "Membuat galeri" },
    { namaPermission: "GALERI_UPDATE",  deskripsi: "Mengubah galeri" },
    { namaPermission: "GALERI_DELETE",  deskripsi: "Menghapus galeri" },
    // KRITIK & SARAN
    { namaPermission: "FAQ_READ",           deskripsi: "Melihat FAQ" },
    { namaPermission: "FAQ_UPDATE",           deskripsi: "Mengubah FAQ" },
    { namaPermission: "FAQ_ARCHIVE",           deskripsi: "Mengarsipkan FAQ" },
    { namaPermission: "FAQ_MANAGE",         deskripsi: "Mengelola FAQ" },
    { namaPermission: "PENGADUAN_READ",     deskripsi: "Melihat pengaduan" },
    { namaPermission: "PENGADUAN_RESPOND",  deskripsi: "Merespons pengaduan" },
    // GRIT INSTITUT
    { namaPermission: "GRIT_LAYANAN_MANAGE",    deskripsi: "Mengelola layanan edukasi" },
    { namaPermission: "GRIT_MENTOR_MANAGE",     deskripsi: "Mengelola mentor" },
    { namaPermission: "GRIT_KELAS_MANAGE",      deskripsi: "Mengelola kelas" },
    { namaPermission: "GRIT_PENDAFTARAN_READ",  deskripsi: "Melihat pendaftaran kelas" },
    // SETTINGS
    { namaPermission: "APP_SETTING_MANAGE", deskripsi: "Mengelola pengaturan aplikasi" },
    
    // REGISTRASI & KTANISASI
    { namaPermission: "REGISTRASI_READ",    deskripsi: "Melihat pendaftaran registrasi anggota" },
    { namaPermission: "REGISTRASI_CREATE",  deskripsi: "Membuat pendaftaran registrasi" },
    { namaPermission: "REGISTRASI_UPDATE",  deskripsi: "Mengubah data pendaftaran registrasi" },
    { namaPermission: "REGISTRASI_APPROVE", deskripsi: "Verifikasi berkas & aktivasi KTA pendaftaran" },
    { namaPermission: "REGISTRASI_DELETE",  deskripsi: "Menghapus data pendaftaran registrasi" },

    // SUPERADMIN (akses penuh)
    { namaPermission: "MANAGE_ALL_CABANG", deskripsi: "Akses penuh ke semua fitur cabang" },
  ];

  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { namaPermission: perm.namaPermission },
      update: {},
      create: perm,
    });
  }
  console.log(`✅ ${permissions.length} Permissions seeded`);
}

async function assignPermissionsToRole() {
  console.log("Assigning Permissions to Roles...");
  const allPermissions = await prisma.permission.findMany();
  const permMap = (names: string[]) => allPermissions.filter((p) => names.includes(p.namaPermission));

  const rolePermissions: Record<string, string[]> = {
    SUPER_ADMIN: allPermissions.map((p) => p.namaPermission),
    ADMIN_CABANG: [
      "AKUN_READ",
      "SENIOR_READ","SENIOR_CREATE","SENIOR_UPDATE","SENIOR_APPROVE",
      "CABANG_READ","CABANG_UPDATE",
      "NEWS_UTAMA_READ","NEWS_UTAMA_CREATE","NEWS_UTAMA_UPDATE","NEWS_UTAMA_PUBLISH","NEWS_UTAMA_ARCHIVE",
      "NEWS_TAG_READ","NEWS_TAG_CREATE",
      "NEWS_KATEGORI_READ","NEWS_KATEGORI_CREATE",
      "STRUKTUR_READ",
      "PROGRAM_READ","PROGRAM_CREATE","PROGRAM_UPDATE",
      "AGENDA_READ","AGENDA_CREATE","AGENDA_UPDATE",
      "ARSIP_READ","ARSIP_CREATE","ARSIP_UPDATE",
      "GALERI_READ","GALERI_CREATE","GALERI_UPDATE",
      "FAQ_READ","FAQ_MANAGE",
      "PENGADUAN_READ","PENGADUAN_RESPOND",
      "GRIT_LAYANAN_MANAGE","GRIT_MENTOR_MANAGE","GRIT_KELAS_MANAGE","GRIT_PENDAFTARAN_READ",
      "REGISTRASI_APPROVE",
    ],
    KETUA_CABANG: [
      "AKUN_READ",
      "SENIOR_READ","SENIOR_APPROVE",
      "CABANG_READ","CABANG_UPDATE",
      "NEWS_UTAMA_READ","NEWS_UTAMA_CREATE","NEWS_UTAMA_UPDATE","NEWS_UTAMA_PUBLISH",
      "NEWS_TAG_READ","NEWS_KATEGORI_READ",
      "STRUKTUR_READ",
      "PROGRAM_READ","AGENDA_READ","ARSIP_READ",
      "GALERI_READ",
      "FAQ_READ",
      "PENGADUAN_READ","PENGADUAN_RESPOND",
      "GRIT_PENDAFTARAN_READ",
      "REGISTRASI_APPROVE",
    ],
    USER: [
      "AKUN_READ",
      "SENIOR_READ","CABANG_READ",
      "NEWS_UTAMA_READ","NEWS_UTAMA_CREATE","NEWS_UTAMA_UPDATE","NEWS_UTAMA_ARCHIVE",
      "NEWS_TAG_READ","NEWS_KATEGORI_READ",
      "STRUKTUR_READ",
      "PROGRAM_READ","AGENDA_READ","ARSIP_READ",
      "GALERI_READ",
      "FAQ_READ",
    ],
  };

  for (const [roleName, permNames] of Object.entries(rolePermissions)) {
    const role = await prisma.role.findUnique({ where: { namaRole: roleName } });
    if (!role) continue;
    for (const perm of permMap(permNames)) {
      await prisma.permissionRole.upsert({
        where: { permissionUuid_roleUuid: { permissionUuid: perm.uuid, roleUuid: role.uuid } },
        update: {},
        create: { permissionUuid: perm.uuid, roleUuid: role.uuid },
      });
    }
  }
  console.log("✅ PermissionRole assigned");
}

async function assignRolesToAkun() {
  console.log("Assigning Roles to Akun...");
  const superAdminRole  = await prisma.role.findUniqueOrThrow({ where: { namaRole: "SUPER_ADMIN" } });
  const adminCabangRole = await prisma.role.findUniqueOrThrow({ where: { namaRole: "ADMIN_CABANG" } });
  const ketuaCabangRole = await prisma.role.findUniqueOrThrow({ where: { namaRole: "KETUA_CABANG" } });
  const userRole        = await prisma.role.findUniqueOrThrow({ where: { namaRole: "USER" } });

  const adminPusat = await prisma.akun.findUnique({ where: { email: "admin-dpp@piki.org" } });
  const userPusat  = await prisma.akun.findUnique({ where: { email: "user@pnps.id" } });

  if (adminPusat) await upsertAkunRole(adminPusat.uuid, superAdminRole.uuid, adminPusat.uuid);
  if (userPusat && adminPusat) await upsertAkunRole(userPusat.uuid, userRole.uuid, adminPusat.uuid);

  const insertBy = adminPusat?.uuid ?? null;
  for (const c of CABANG_LIST) {
    if (c.isPusat) continue;
    const adminCabang = await prisma.akun.findUnique({ where: { email: `admin_${c.kotaEmail}@dpp.id` } });
    if (adminCabang) await upsertAkunRole(adminCabang.uuid, adminCabangRole.uuid, insertBy);
    const ketuaCabang = await prisma.akun.findUnique({ where: { email: `ketua_${c.kotaEmail}@dpp.id` } });
    if (ketuaCabang) await upsertAkunRole(ketuaCabang.uuid, ketuaCabangRole.uuid, insertBy);
  }
  console.log("✅ AkunRole assigned");
}

async function upsertAkunRole(akunUuid: string, roleUuid: string, insertBy: string | null) {
  await prisma.akunRole.upsert({
    where: { akunUuid_roleUuid: { akunUuid, roleUuid } },
    update: {},
    create: { akunUuid, roleUuid, insert_by: insertBy },
  });
}

// ============================================================
// 3. NEWS
// ============================================================
async function seedNews() {
  console.log("Seeding News...");
  const admin = await getAdmin();
  const user  = await getUser();

  const kategoriData = [
    { nama_kategori: "Siaran Pers", slug: "siaran-pers",  deskripsi: "Berita resmi organisasi" },
    { nama_kategori: "Organisasi",  slug: "organisasi",   deskripsi: "Kegiatan dan struktur organisasi" },
    { nama_kategori: "Nasional",    slug: "nasional",     deskripsi: "Berita tingkat nasional" },
    { nama_kategori: "Kegiatan",    slug: "kegiatan",     deskripsi: "Kegiatan internal dan eksternal" },
  ];
  const kategoriRecords = await Promise.all(
    kategoriData.map((k) =>
      prisma.newsKategori.upsert({ where: { slug: k.slug }, update: {}, create: { ...k, insert_by: admin.uuid } })
    )
  );

  const tagNames = ["DPP","GMKI","Pelantikan","Nasional","Seminar","Kongres","Rapat Kerja","Leadership"];
  const tagRecords = await Promise.all(
    tagNames.map((nama_tag) =>
      prisma.newsTag.upsert({ where: { nama_tag }, update: {}, create: { nama_tag, insert_by: admin.uuid } })
    )
  );

  const findTag      = (name: string) => tagRecords.find((t) => t.nama_tag === name)!;
  const findKategori = (name: string) => kategoriRecords.find((k) => k.nama_kategori === name)!;

  const newsList = [
    {
      judul: `William Sabandar Pimpin Pengurus Nasional Perkumpulan Senior GMKI Periode 2025-2028 “Misi Bersatu Melayani Mewujudkan Damai Sejahtera di Indonesia”"`,
      slug: "william-sabandar-pimpin-dpp",
      ringkasan:
        `“Misi Bersatu Melayani Mewujudkan Damai Sejahtera di Indonesia”`,
      konten:
        `
            <p>JAKARTA - Senior Gerakan Mahasiswa Kristen Indonesia (GMKI) berkomitmen untuk</p>
        <p>memberikan kontribusi nyata bagi Bangsa Indonesia menuju Indonesia Emas 2045. Bukan</p>
        <p>hanya dalam bentuk wacana, tetapi dalam aksi nyata melalui kehadiran di tengah kehidupan</p>
        <p><br></p>
        <p>jemaat, kampus, dan komunitas lokal di seluruh Indonesia, termasuk di Papua dan daerah-</p>
        <p>daerah yang membutuhkan perhatian.</p>
        <p><br></p>
        <p>Komitmen ini ditegaskan Ketua Umum Pengurus Nasional Perkumpulan Senior (DPP) GMKI</p>
        <p>masa bakti 2025-2028, William Sabandar, dalam pidatonya, pada acara Peneguhan dan</p>
        <p>Serah Terima DPP GMKI, Minggu (11/01/2026) malam. Kegiatan yang dirangkaikan dengan</p>
        <p>Perayaan Natal 2025 dan Tahun Baru 2026, berlangsung di Ballroom Grha Oikumene PGI,</p>
        <p>Jakarta.</p>
        <p>Pada kesempatan tersebut, William yang menggantikan posisi Ketua Umum DPP yang</p>
        <p>periode sebelumnya Febry Calvin Tetelepta (2022-2025), memaparkan arah baru organisasi</p>
        <p>dengan fokus utama pada persatuan dan pelayanan. Karena itulah, pada periode ini DPP</p>
        <p>mengusung visi &ldquo;Bersatu Melayani lewat Peran Senior GMKI untuk Mewujudkan Damai</p>
        <p>Sejahtera di Bumi Indonesia&rdquo;.</p>
        <p>&ldquo;Visi ini tidak datang dari ruang kosong, agar para senior sungguh menjadi penopang bagi</p>
        <p>GMKI dan bagi tiga medan pelayanan: gereja, perguruan tinggi, dan masyarakat,&rdquo; ujar Wiliam</p>
        <p>yang akrab disapa Willy.</p>
        <p>Ia menegaskan, visi tersebut lahir dari refleksi mendalam terhadap kondisi internal dan</p>
        <p>tantangan eksternal bangsa. Willy bahkan menekankan pentingnya persatuan karena adanya</p>
        <p>kecenderungan ego kelompok yang kerap muncul saat para senior kembali ke lingkungan</p>
        <p>masing-masing.</p>
        <p>&ldquo;Frasa &apos;Bersatu Melayani&apos; karena melihat adanya kecenderungan kita kadang-kadang tidak</p>
        <p>bersatu ketika kembali ke dalam kelompok masing-masing. Bersama rekan-rekan alumni</p>
        <p>Cipayung, kami merasa penting untuk bersatu melalui peran senior GMKI demi mewujudkan</p>
        <p>damai sejahtera bagi Indonesia,&quot; ujar Willy.</p>
        <p>Menurut Willy konsep &quot;Damai Sejahtera&quot; atau peace and prosperity memiliki dimensi yang</p>
        <p>sangat tinggi dalam pembangunan berkelanjutan. Ia meyakini bahwa aspek perdamaian dan</p>
        <p><br></p>
        <p>kesejahteraan tidak dapat dipisahkan satu sama lain. &quot;Tidak ada perdamaian tanpa</p>
        <p>kesejahteraan, dan tidak ada kesejahteraan tanpa perdamaian,&rdquo; ujar Willy seraya</p>
        <p>menegaskan kehadiran GMKI di Indonesia mengusung konsep tersebut.</p>
        <p>William juga mengingatkan, di banyak tempat, masih ada kantong-kantong kemiskinan, baik</p>
        <p>di desa terpencil maupun pinggiran kota besar, dan secara khusus wilayah timur Indonesia.</p>
        <p>&ldquo;Kita menghadapi paradoks ketidakadilan yang menyakitkan. Papua adalah salah satu</p>
        <p>daerah terkaya sumber daya alam, tetapi juga termasuk yang termiskin dari sisi</p>
        <p>pembangunan manusia. Ekonomi Papua dan Maluku, dua wilayah yang luas daratan dan</p>
        <p>lautnya 40 persen Indonesia, namun PDB nya hanya dua persen dari total nasional,&rdquo; jelasnya.</p>
        <p>Padahal Papua adalah bagian paling fundamental dari Indonesia. &ldquo;Jika senior GMKI tidak</p>
        <p>berhasil membantu Papua dengan benar, kita akan menyesal suatu saat nanti. Kita harus</p>
        <p>berpikir kritis bagaimana membangun daerah-daerah ini bersama-sama,&quot; tambah Willy yang</p>
        <p>sebelumnya menjabat Direktur Utama PT MRT Jakarta periode 2016-2022.</p>
        <p>Ia mengingkatkan bangsa Indonesia saat ini sedang menapaki jalan panjang menuju</p>
        <p>Indonesia Emas 2045. Kalau Indonesia ingin keluar dari middle income trap, maka</p>
        <p>perekonomian Indonesia perlu bertumbuh secara konsisten di atas 6 persen dalam jangka</p>
        <p>panjang. &ldquo;Namun kita juga sadar, pertumbuhan ekonomi tidak otomatis berarti keadilan,&rdquo;</p>
        <p>ungkap pria yang kenyang pengalaman di dunia profesional, teknorat, birokrasi, dan</p>
        <p>akademisi ini.</p>
        <p>Melihat kondisi bangsa seperti ini, dibutuhkan peran GMKI dan Perkumpulan Senior menuju</p>
        <p>2045, untuk membantu membentuk generasi pemimpin yang mengerti bahwa pertumbuhan</p>
        <p>harus adil dan inklusif.</p>
        <p>Selain itu, GMKI dan DPP juga harus memberi perhatian khusus kepada wilayah seperti</p>
        <p>Papua, melalui pembangunan yang menghormati martabat orang asli Papua, menjaga</p>
        <p>kelestarian ciptaan, menumbuhkan damai sejahtera, bukan sekadar mengejar angka</p>
        <p>pertumbuhan.</p>
        <p><br></p>
        <p>Misi DPP</p>
        <p>Untuk mewujudkan visi tersebut, DPP GMKI akan menjalankan misi &quot;3K&quot; (Komunikasi,</p>
        <p>Kolaborasi, dan Kebersamaan). Karena itulah DPP haruslah menjadi &quot;Rumah Besar&quot; yang</p>
        <p>nyaman bagi seluruh senior di segala tingkatan untuk berkumpul, bersekutu, bernostalgia,</p>
        <p>memperkuat kembali hubungan emosional dan spiritual dengan GMKI.</p>
        <p><br></p>
        <p>Selain para senior bisa kembali merasakan ikatan dengan &ldquo;rumah lama&rdquo;-nya, yaitu GMKI, ke</p>
        <p>depan DPP harus menjadi mitra strategis bagi adik-adik mahasiswa GMKI yang masih aktif.</p>
        <p>&ldquo;Komunikasi antara senior dan GMKI aktif mengalir dengan baik, bukan hanya saat ada</p>
        <p>masalah, tetapi dalam ritme kehidupan pelayanan sehari-hari,&rdquo; papar Willy.</p>
        <p>Selain 3K, DPP juga memiliki misi 2D, dan 2P kemandirian Daya dan Dana (2D), serta DPP</p>
        <p>sebagai &rsquo;Platform Penggerak (2P).</p>
        <p>Sebanyak 45 pengurus yang dilantik menjadi simbol Perkumpulan Senior GMKI ingin</p>
        <p>menempatkan diri sebagai bagian dari perjalanan Indonesia sejak Proklamasi 1945, hingga</p>
        <p>menuju Indonesia Emas 2045. Sebagaimana GMKI ikut memberi peran dalam perjalanan</p>
        <p>bangsa di masa awal kemerdekaan, diharapkan semangat GMKI&mdash;melalui para seniornya&mdash;</p>
        <p>tetap menjadi bagian penting dalam perjalanan bangsa seratus tahun kemudian.</p>
        <p>Ketua Umum DPP periode sebelumnya, Febry Calvin Tetelepta, menyebut komposisi</p>
        <p>kepengurusan kali ini sebagai &rsquo;the dream team&rsquo;. &rdquo;Tetap jaga eksistensi netralitas dari semua</p>
        <p>kepentingan politik, meski kita harus akui dengan pilihan netral itu membawa konsekuensi</p>
        <p>ruang kita jadi agak sempit. Di sinilah butuh keluwesan dan kecerdasan pemimpin organisasi</p>
        <p>membawa DPP tetap berjalan tanpa didikte siapapun,&rdquo; pesannya.</p>
        <p>Febry berharap DPP bisa fokus berjuang di tengah kondisi bangsa yang tidak baik-baik saja</p>
        <p>akibat kebijakan pemotongan anggaran, dan berdampak pada daerah-daerah kantong</p>
        <p>Kristen terutama di kawasan timur Indonesia.</p>
        <p>Sekretaris Umum Pengurus Pusat GMKI Jessica Warouw menyebut hubungan DPP dan</p>
        <p>GMKI bak &rsquo;kakak adik&rsquo;. &rdquo;Senior merupakan abang dan kakak tempat kami belajar tentang</p>
        <p>keberanian dan kesetiaan dalam berorganisasi. Kami memandang DPP sebagai mitra</p>
        <p>strategis dalam membangun GMKI melalui berbagai program kolaborasi nyata,&rdquo; kata Jessica</p>
        <p>Warouw.</p>
        <p>Ibadah Peneguhan DPP GMKI 2025-2028 dipimpin Ketua Umum PGI Pdt Jacklevyn Frits</p>
        <p>Manuputty, Sekretaris Umum PGI Pdt Darwin Darmawan, Rektor Universitas Kristen Satya</p>
        <p>Wacana Salatiga Prof Intiyas Utami, Sekum LAI Sigit Triyono, Sekjen PIKI Audy Wuisang,</p>
        <p>hakim konsitusi Daniel Yusmic Foekh, senior-senior GMKI lain, serta anggota DPR yang juga</p>
        <p>Wasekjen PB Ikatan Alumni PMII Zainul Munasichin.</p>
        <p>STRUKTUR ORGANISASI DPP GMKI 2025-2028</p>
        <p>Ketua Umum: William Sabandar (senior dari cabang Makassar)</p>
        <p>Sekretaris Jenderal: Pdt. Jeirry Sumampow (Jakarta)</p>
        <p>Wakil Sekjen I&ndash; Internal dan Organisasi: Alui Marunduri (Jakarta)</p>
        <p><br></p>
        <p>Wakil Sekjen II &ndash; Program &amp; Kolaborasi: (Desi Datang, Tobelo)</p>
        <p>Wakil Sekjen III &ndash; Administrasi, Hukum &amp; Digital: Rendy Umboh (Tondano)</p>
        <p>Wakil Sekjen IV - Pelayanan &amp; Atensi Khusus Papua: Christian Sohilait (Jayapura)</p>
        <p>Bendahara Umum: Junita Sari Ujung (Medan)</p>
        <p>Wakil Bendahara I: Desye Syul Lumbaa (Jakarta)</p>
        <p>Wakil Bendahara: Robinson Simamora (Medan)</p>
        <p>Ketua Bidang 1 &ndash; Spiritualitas &amp; Pembinaan Iman: Pdt. Ronald Tapilatu (Jayapura)</p>
        <p>Wakil Ketua: Pdt. Hariman Pattianakott (Jakarta)</p>
        <p>Anggota: Shanty Marpaung (Medan)</p>
        <p>Anggota: Angelina Sigalingging (Bandung)</p>
        <p>Ketua Bidang 2 &ndash; Kajian &amp; Pengembangan GMKI: Herjon Panggabean (Bandung)</p>
        <p>Wakil Ketua: Ranto Rajagukguk (Jakarta)</p>
        <p>Anggota:Michael Anggi (Balikpapan)</p>
        <p>Anggota: Yuliana Herman W. Djo Sihombing (Denpasar)</p>
        <p>Ketua Bidang 3 &ndash; Komunikasi, Jaringan Internal dan Data Senior: Sonya Sinombor (Manado)</p>
        <p>Wakil Ketua: Agustinus Eko Rahardjo (Surabaya)</p>
        <p>Anggota: David Sitorus (Bandung)</p>
        <p>Anggota: Victor R. Ambarita (Jakarta)</p>
        <p>Ketua Bidang 4 &ndash; Kemitraan Eksternal dan Hubungan Antar Lembaga: Arijon Manurung</p>
        <p>(Bandung)</p>
        <p>Wakil Ketua: Agustinus Ufie (Ambon)</p>
        <p>Anggota: Adriana M. Lambe (Makasar)</p>
        <p>Anggota: Catur Rini (Bogor)</p>
        <p>Ketua Bidang 5 &ndash; Pengembangan Kapasitas &amp; Kepemimpinan Senior: Nielma Palamba</p>
        <p>(Makasar)</p>
        <p>Wakil Ketua: Santhi D.R. Marpaung (Sumedang)</p>
        <p>Anggota: Christofer J.H. Ladja (Makassar)</p>
        <p>Anggota: Janrivai Silalahi (Depok)</p>
        <p>Ketua Bidang 6 &ndash; Gender, Kebudayaan &amp; Inklusivitas: Lamtiar Simorangkir (Pekanbaru)</p>
        <p>Wakil Ketua: Lusia Palulungan (Makassar)</p>
        <p>Anggota: Pahlawarni Girsang (Semarang)</p>
        <p>Anggota: Atiek Silalahi (Jakarta)</p>
        <p><br></p>
        <p>Ketua Bidang 7 &ndash; Kemandirian Daya, Dana dan Transformasi Digital: Daniel Godwin</p>
        <p>Sihotang (Surabaya)</p>
        <p>Wakil Ketua: Yulius Victor Metubun (Ambon)</p>
        <p>Anggota: Eliyah Acantha M. Sampetoding (Bandung)</p>
        <p>Anggota: Andrella Hutabarat (Jambi)</p>
        <p>Ketua Bidang 8 &ndash; Medan Pelayanan &amp; Advokasi: Gereja &ndash; Masyarakat &ndash; Bangsa/Negara</p>
        <p>(dengan Atensi Khusus Papua): Johni Jonatan Numberi (Jayapura)</p>
        <p>Wakil Ketua: Pdt. Henrek Lokra (Ambon)</p>
        <p>Anggota: Almara Dwi Sitompul (Surabaya)</p>
        <p>Anggota: Grafika Hardiany Parebong (Makassar)</p>
        <p>Ketua Bidang 9 &ndash; Organisasi &amp; Tata Kelola: Nelson Simanjuntak (Medan)</p>
        <p>Wakil Ketua: Juandi Gultom (Bogor)</p>
        <p>Anggota: Syamsuddin (Makassar)</p>
        <p>Anggota: Fancy Ransun (Tomohon)</p>
        <p><br></p>
        <p>Jakarta 12 Januari 2026</p>
        <p>Narahubung :</p>
        <p>Sekjend DPP-Jeirry Sumampow (08129948695)</p>
        <p>Bidang Komunikasi-Jojo Rahardjo (08155557343)</p>
            `,
        thumbnail: "http://data.seniorgmki.com/uploads/1772176353315-97cc4c7dd3860efb3eb56bd6.jpg",
        author: admin,
        status: "PUBLISHED",
        tags: ["DPP", "GMKI", "Pelantikan"],
        kategori: ["Siaran Pers", "Nasional"],
      },

      {
        judul: "Berikut Nama 45 Pengurus DPP GMKI Masa Bakti 2025 - 2028",
        slug: "berikut-nama-45-pengurus-dpp-gmki-masa-bakti-2025-2028",
        ringkasan:
          "Berikut Nama 45 Pengurus DPP GMKI Masa Bakti 2025 - 2028",
        konten:
          `
        <p><strong>JAKARTA, Vressnews</strong> – Sebanyak 45 pengurus yang dilantik menjadi simbol Perkumpulan Senior GMKI, sebagai bagian dari perjalanan Indonesia sejak Proklamasi 1945, hingga menuju Indonesia Emas 2045.</p>
        <img src="https://vressnews.com/wp-content/uploads/2025/12/lv_0_20251223123420.gif" alt="Suasana Pelantikan" class="w-full rounded-lg my-4" loading="lazy" />
        <p>Sebagaimana GMKI ikut memberi peran dalam perjalanan bangsa di masa awal kemerdekaan, diharapkan semangat GMKI melalui para seniornya tetap menjadi bagian penting dalam perjalanan bangsa seratus tahun kemudian.</p>
        <img src="https://vressnews.com/wp-content/uploads/2025/12/lv_0_20251230140007.gif" alt="Suasana Pelantikan 2" class="w-full rounded-lg my-4" loading="lazy" />
        <p>Ketua Umum DPP periode sebelumnya, Febry Calvin Tetelepta, menyebut komposisi kepengurusan kali ini sebagai ’the dream team’.</p>

        <p>”Tetap jaga eksistensi netralitas dari semua kepentingan politik, meski kita harus akui dengan pilihan netral itu membawa konsekuensi ruang kita jadi agak sempit. Di sinilah butuh keluwesan dan kecerdasan pemimpin organisasi membawa DPP tetap berjalan tanpa didikte siapapun,” pesannya.</p>
        <img src="https://vressnews.com/wp-content/uploads/2025/12/lv_0_20251224184853.gif" alt="Suasana Pelantikan 3" class="w-full rounded-lg my-4" loading="lazy" />
        <p>Febry berharap DPP bisa fokus berjuang di tengah kondisi bangsa yang tidak baik-baik saja akibat kebijakan pemotongan anggaran, dan berdampak pada daerah-daerah kantong Kristen terutama di kawasan timur Indonesia. Sekretaris Umum Pengurus Pusat GMKI Jessica Warouw menyebut hubungan DPP dan GMKI bak ’kakak adik’.</p>
        <p>”Senior merupakan abang dan kakak tempat kami belajar tentang keberanian dan kesetiaan dalam berorganisasi. Kami memandang DPP sebagai mitra strategis dalam membangun GMKI melalui berbagai program kolaborasi nyata,” kata Jessica Warouw.</p>

        <h3 class="font-bold text-xl mt-8 mb-4">STRUKTUR ORGANISASI DPP GMKI 2025 – 2028</h3>
        <p><strong>Ketua Umum:</strong> William Sabandar (senior dari cabang Makassar)</p>
        <p><strong>Sekretaris Jenderal:</strong> Pdt. Jeirry Sumampow (Jakarta)</p>
        <p><strong>Wakil Sekjen I – Internal dan Organisasi:</strong> Alui Marunduri (Jakarta)</p>
        <p><strong>Wakil Sekjen II – Program & Kolaborasi:</strong> Desi Datang (Tobelo)</p>
        <p><strong>Wakil Sekjen III – Administrasi, Hukum & Digital:</strong> Rendy Umboh (Tondano)</p>
        <p><strong>Wakil Sekjen IV – Pelayanan & Atensi Khusus Papua:</strong> Christian Sohilait (Jayapura)</p>
        <p><strong>Bendahara Umum:</strong> Junita Sari Ujung (Medan)</p>
        <p><strong>Wakil Bendahara I:</strong> Desye Syul Lumbaa (Jakarta)</p>
        <p><strong>Wakil Bendahara II :</strong> Robinson Simamora (Medan)</p>

        <p><strong>– Ketua Bidang Spiritualitas & Pembinaan Iman:</strong> Pdt. Ronald Tapilatu (Jayapura)<br/>
        Wakil Ketua: Pdt. Hariman Pattianakott (Jakarta)<br/>
        Anggota: Shanty Marpaung (Medan)<br/>
        Anggota: Angelina Sigalingging (Bandung)</p>

        <p><strong>– Ketua Bidang Kajian & Pengembangan GMKI:</strong> Herjon Panggabean (Bandung)<br/>
        Wakil Ketua: Ranto Rajagukguk (Jakarta)<br/>
        Anggota: Michael Anggi (Balikpapan)<br/>
        Anggota: Yuliana Herman W. Djo Sihombing (Denpasar)</p>

        <p><strong>– Ketua Bidang Komunikasi, Jaringan Internal dan Data Senior:</strong> Sonya Sinombor (Manado)<br/>
        Wakil Ketua: Agustinus Eko Rahardjo (Surabaya)<br/>
        Anggota: David Sitorus (Bandung)<br/>
        Anggota: Victor R. Ambarita (Jakarta)</p>

        <p><strong>– Ketua Bidang Kemitraan Eksternal dan Hubungan Antar Lembaga:</strong> Arijon Manurung (Bandung)<br/>
        Wakil Ketua: Agustinus Ufie (Ambon)<br/>
        Anggota: Adriana M. Lambe (Makasar)<br/>
        Anggota: Catur Rini (Bogor)</p>

        <p><strong>– Ketua Bidang Pengembangan Kapasitas & Kepemimpinan Senior:</strong> Nielma Palamba (Makasar)<br/>
        Wakil Ketua: Santhi D.R. Marpaung (Sumedang)<br/>
        Anggota: Christofer J.H. Ladja (Makassar)<br/>
        Anggota: Janrivai Silalahi (Depok)</p>

        <p><strong>– Ketua Bidang Gender, Kebudayaan & Inklusivitas:</strong> Lamtiar Simorangkir (Pekanbaru)<br/>
        Wakil Ketua: Lusia Palulungan (Makassar)<br/>
        Anggota: Pahlawarni Girsang (Semarang)<br/>
        Anggota: Atiek Silalahi (Jakarta)</p>

        <p><strong>– Ketua Bidang Kemandirian Daya, Dana dan Transformasi Digital:</strong> Daniel Godwin Sihotang (Surabaya)<br/>
        Wakil Ketua: Yulius Victor Metubun (Ambon)<br/>
        Anggota: Eliyah Acantha M. Sampetoding (Bandung)<br/>
        Anggota: Andrella Hutabarat (Jambi)</p>

        <p><strong>– Ketua Bidang Medan Pelayanan & Advokasi: Gereja – Masyarakat – Bangsa/Negara (dengan Atensi Khusus Papua):</strong> Johni Jonatan Numberi (Jayapura)<br/>
        Wakil Ketua: Pdt. Henrek Lokra (Ambon)<br/>
        Anggota: Almara Dwi Sitompul (Surabaya)<br/>
        Anggota: Grafika Hardiany Parebong (Makassar)</p>

        <p><strong>– Ketua Bidang Organisasi & Tata Kelola:</strong> Nelson Simanjuntak (Medan)<br/>
        Wakil Ketua: Juandi Gultom (Bogor)<br/>
        Anggota: Syamsuddin (Makassar)<br/>
        Anggota: Fancy Ransun (Tomohon)</p>

        <p>Ibadah Peneguhan DPP GMKI 2025-2028 dipimpin Ketua Umum PGI Pdt Jacklevyn Frits Manuputty, dan dihadiri oleh Sekretaris Umum PGI Pdt Darwin Darmawan, Rektor Universitas Kristen Satya Wacana Salatiga Prof Intiyas Utami, Sekum LAI Sigit Triyono, Sekjen PIKI Audy Wuisang, hakim konsitusi Daniel Yusmic Foekh, senior-senior GMKI lain, serta anggota DPR yang juga Wasekjen PB Ikatan Alumni PMII Zainul Munasichin.</p>
      `,
      thumbnail: "http://data.seniorgmki.com/uploads/1772176304359-6744ab1db97be194dad4088b.jpg",
      author: admin,
      status: "PUBLISHED",
      tags: ["Rapat Kerja", "DPP", "Nasional"],
      kategori: ["Organisasi", "Nasional"],
    },

    {
      judul: "William Sabandar Pimpin DPP GMKI 2025-2028, Usung Misi 3K 2D dan 2P",
      slug: "william-sabandar-pimpin-dpp-gmki-2025-2028-usung-misi-3k-2d-dan-2p",
      ringkasan:
        "William Sabandar terpilih sebagai Ketua Umum DPP GMKI periode 2025-2028...",
      konten:
        `
            Foto bersama : Pengurus DPP 2025-2028 usai peneguhan dan serah terima jabatan yang berlangsung di Ballroom Grha Oikumene PGI, Jakarta, Minggu (11/1/2026).
        Jakarta(harianSIB.com)
        William Sabandar resmi menjabat sebagai Ketua Umum Pengurus Nasional Perkumpulan Senior (DPP) Gerakan Mahasiswa Kristen Indonesia (GMKI) masa bakti 2025-2028.Dalam prosesi peneguhan dan serah terima jabatan yang berlangsung di Ballroom Grha Oikumene PGI, Jakarta, Minggu (11/1/2026) malam, William menegaskan komitmen organisasi untuk mengawal keadilan sosial, khususnya di wilayah Papua dan Indonesia Timur.
        Mantan Direktur Utama PT MRT Jakarta ini menggantikan Febry Calvin Tetelepta yang menjabat pada periode 2022-2025. Di bawah kepemimpinannya, DPP GMKI mengusung visi "Bersatu Melayani lewat Peran Senior GMKI untuk Mewujudkan Damai Sejahtera di Bumi Indonesia".Dalam pidato perdana, William menyoroti paradoks pembangunan di wilayah timur Indonesia. Ia memaparkan data bahwa meski Papua dan Maluku mencakup 40 persen luas wilayah Indonesia, kontribusi PDB-nya hanya sebesar dua persen terhadap total nasional.
        Baca Juga:
        DPP GMKI 2022-2025 Dilantik, Diharapkan Aktif Jawab Persoalan Bangsa
        "Kita menghadapi paradoks ketidakadilan yang menyakitkan. Papua adalah salah satu daerah terkaya sumber daya alam, tetapi juga termasuk yang termiskin dari sisi pembangunan manusia," ujar William dalam keterangan persnya kepada jurnalis SNN, Jakarta, Senin (12/1/2026).Ia mengingatkan para senior GMKI untuk tidak abai terhadap kondisi tersebut. Menurutnya, keberhasilan senior GMKI dalam membantu pembangunan di Papua secara benar adalah parameter keberhasilan organisasi dalam memberikan dampak nyata bagi bangsa.
            `,
      thumbnail: "http://data.seniorgmki.com/uploads/1772176193919-92fa7ad42f7e9dae48a9da2e.png",
      author: user,
      status: "PUBLISHED",
      tags: ["Seminar", "Leadership", "GMKI"],
      kategori: ["Kegiatan"],
    },

    {
      judul: "DPP GMKI Tegaskan Aksi Nyata Menuju Indonesia Emas 2045",
      slug: "dpp-gmki-tegaskan-aksi-nyata-menuju-indonesia-emas-2045",
      ringkasan:
        "DPP GMKI menegaskan komitmennya untuk berkontribusi dalam mewujudkan Indonesia Emas 2045...",
      konten:
        `
            MEDIA PERISAI.COM, JAKARTA, 12 Januari 2026 — Perkumpulan Senior Gerakan Mahasiswa Kristen Indonesia (DPP GMKI) menegaskan komitmennya untuk memberikan kontribusi nyata bagi bangsa Indonesia dalam menyongsong Indonesia Emas 2045. Komitmen tersebut tidak hanya diwujudkan dalam wacana, tetapi melalui aksi konkret di tengah kehidupan jemaat, kampus, dan komunitas lokal di seluruh Indonesia, termasuk Papua dan daerah-daerah yang membutuhkan perhatian khusus.

        Komitmen itu disampaikan Ketua Umum DPP GMKI periode 2025–2028, William Sabandar, dalam pidatonya pada acara Peneguhan dan Serah Terima Pengurus Nasional Perkumpulan Senior (DPP) GMKI, Minggu (11/1/2026) malam. Kegiatan tersebut dirangkaikan dengan Perayaan Natal 2025 dan Tahun Baru 2026 yang berlangsung di Ballroom Grha Oikumene PGI, Jakarta.

        William Sabandar menggantikan Ketua Umum DPP GMKI periode sebelumnya, Febry Calvin Tetelepta (2022–2025). Dalam kesempatan itu, William memaparkan arah baru organisasi yang menitikberatkan pada persatuan dan pelayanan. Oleh karena itu, DPP GMKI mengusung visi “Bersatu Melayani lewat Peran Senior GMKI untuk Mewujudkan Damai Sejahtera di Bumi Indonesia.”

        “Visi ini tidak lahir dari ruang kosong. Kami ingin para senior sungguh menjadi penopang bagi GMKI dan bagi tiga medan pelayanan, yaitu gereja, perguruan tinggi, dan masyarakat,” ujar William yang akrab disapa Willy.

        Menurut Willy, visi tersebut merupakan hasil refleksi mendalam terhadap kondisi internal organisasi dan tantangan eksternal bangsa. Ia menekankan pentingnya persatuan di tengah kecenderungan ego kelompok yang kerap muncul ketika para senior kembali ke lingkungan masing-masing.

        “Frasa Bersatu Melayani lahir dari kesadaran bahwa kita kadang tidak bersatu saat kembali ke kelompok masing-masing. Bersama rekan-rekan alumni Cipayung, kami merasa penting untuk bersatu melalui peran senior GMKI demi mewujudkan damai sejahtera bagi Indonesia,” jelasnya.

        Willy juga menegaskan bahwa konsep damai sejahtera (peace and prosperity) memiliki dimensi penting dalam pembangunan berkelanjutan. Menurutnya, perdamaian dan kesejahteraan tidak dapat dipisahkan.

        “Tidak ada perdamaian tanpa kesejahteraan, dan tidak ada kesejahteraan tanpa perdamaian. Kehadiran GMKI di Indonesia harus terus mengusung nilai ini,” tegasnya.

        Ia mengingatkan bahwa hingga kini masih terdapat kantong-kantong kemiskinan, baik di desa terpencil, kawasan pinggiran kota besar, maupun wilayah timur Indonesia. Secara khusus, Willy menyoroti Papua sebagai wilayah yang kaya sumber daya alam, tetapi masih tertinggal dari sisi pembangunan manusia.

        “Papua adalah salah satu daerah terkaya sumber daya alam, tetapi juga termasuk yang termiskin dari sisi pembangunan manusia. Papua dan Maluku yang mencakup sekitar 40 persen daratan dan lautan Indonesia, kontribusi PDB-nya hanya sekitar dua persen dari total nasional,” ungkapnya.

        Padahal, lanjut Willy, Papua merupakan bagian fundamental dari Indonesia. “Jika senior GMKI tidak berhasil membantu Papua dengan benar, kita akan menyesal di kemudian hari. Kita harus berpikir kritis dan bekerja bersama membangun daerah-daerah ini,” ujar mantan Direktur Utama PT MRT Jakarta periode 2016–2022 itu.

        Willy juga menyinggung perjalanan panjang Indonesia menuju Indonesia Emas 2045. Menurutnya, untuk keluar dari jebakan negara berpendapatan menengah (middle income trap), Indonesia membutuhkan pertumbuhan ekonomi yang konsisten di atas enam persen dalam jangka panjang.

        “Namun kita juga sadar, pertumbuhan ekonomi tidak otomatis menghadirkan keadilan,” katanya.

        Karena itu, GMKI dan DPP GMKI diharapkan berperan aktif membentuk generasi pemimpin yang memahami bahwa pertumbuhan harus adil dan inklusif. Selain itu, perhatian khusus perlu diberikan kepada wilayah seperti Papua melalui pembangunan yang menghormati martabat orang asli Papua, menjaga kelestarian ciptaan, dan menumbuhkan damai sejahtera, bukan sekadar mengejar angka pertumbuhan.


        Misi DPP GMKI
        Untuk mewujudkan visi tersebut, DPP GMKI menetapkan misi 3K, 2D, dan 2P. 3K yakni Komunikasi, Kolaborasi, dan Kebersamaan. DPP diharapkan menjadi “rumah besar” yang nyaman bagi seluruh senior GMKI lintas generasi untuk berkumpul, bersekutu, dan memperkuat kembali hubungan emosional serta spiritual dengan GMKI.

        Selain itu, DPP GMKI juga diarahkan menjadi mitra strategis bagi GMKI aktif. “Komunikasi antara senior dan GMKI aktif harus mengalir dengan baik, bukan hanya saat ada masalah, tetapi dalam ritme pelayanan sehari-hari,” ujar Willy.

        DPP GMKI juga mengusung misi 2D (kemandirian daya dan dana) serta 2P sebagai platform penggerak. Sebanyak 45 pengurus yang dilantik diharapkan mampu menempatkan Perkumpulan Senior GMKI sebagai bagian dari perjalanan bangsa sejak Proklamasi 1945 hingga menuju Indonesia Emas 2045.

        Ketua Umum DPP GMKI periode 2022–2025, Febry Calvin Tetelepta, menyebut komposisi kepengurusan kali ini sebagai “the dream team.” Ia berpesan agar DPP GMKI tetap menjaga netralitas dari berbagai kepentingan politik.

        “Netralitas memang membuat ruang gerak kita menjadi lebih sempit. Di sinilah dibutuhkan keluwesan dan kecerdasan kepemimpinan agar DPP tetap berjalan tanpa didikte siapa pun,” katanya.

        Sementara itu, Sekretaris Umum Pengurus Pusat GMKI, Jessica Warouw, menggambarkan hubungan DPP dan GMKI seperti kakak dan adik. “Senior adalah abang dan kakak tempat kami belajar keberanian dan kesetiaan dalam berorganisasi. DPP kami pandang sebagai mitra strategis dalam membangun GMKI melalui program kolaborasi nyata,” ujarnya.

        Ibadah Peneguhan DPP GMKI 2025–2028 dipimpin Ketua Umum PGI Pdt. Jacklevyn Frits Manuputty dan dihadiri sejumlah tokoh lintas gereja, akademisi, serta perwakilan organisasi kepemudaan dan legislatif, yaitu: Sekretaris Umum PGI Pdt Darwin Darmawan, Rektor Universitas Kristen Satya Wacana Salatiga Prof Intiyas Utami, Sekum LAI Sigit Triyono, Sekjen PIKI Audy Wuisang, hakim konsitusi Daniel Yusmic Foekh, senior-senior GMKI lain, serta anggota DPR yang juga Wasekjen PB Ikatan Alumni PMII Zainul Munasichin. (AS)
            `,
      thumbnail: "https://mediaperisai.com/wp-content/uploads/2026/01/WhatsApp-Image-2026-01-13-at-07.14.14.jpeg",
      status: "PUBLISHED",
      tags: ["Seminar", "Leadership", "GMKI"],
      author: user,
      kategori: ["Kegiatan"],
    },
    {
      judul: "Pendeta Ricardo A. Rikumahu Resmi Pimpin DPC GMKI Ambon Periode 2026–2029",
      slug: "pendeta-ricardo-a-rikumahu-resmi-pimpin-dpc-gmki-ambon-periode-20262029",
      ringkasan:
        "Pendeta Ricardo Andriosa Rikumahu resmi ditetapkan sebagai Ketua Pengurus Cabang Perkumpulan Senior (DPC) Gerakan Mahasiswa Kristen Indonesia (GMKI) Cabang Ambon untuk masa bakti 2026–2029, menggantikan Fredy Leiwakabessy. Penetapan itu dilakukan dalam Pertemuan Raya DPC GMKI Ambon di Ambon, Sabtu (21/2/2026), sekaligus diikuti pengumuman struktur pengurus baru. Pelantikan dihadiri pengurus nasional dan diharapkan dapat memperkuat peran organisasi serta sinergi pembangunan di Ambon dan Maluku.",
      konten:
        `<div class="slate-editor" data-slate-editor="true"><div data-block-id="Krjgs82jrx" data-slate-id="Krjgs82jrx" class="slate-p" style="position:relative"><span><span><span>﻿</span></span></span><span><span data-slate-bold="true"><strong class="slate-bold"><span>AMBON, 21 Februari 2026</span></strong></span></span><span><span><span> – Pengurus Cabang Perkumpulan Senior Gerakan Mahasiswa Kristen Indonesia (DPC GMKI) Ambon periode 2026–2029 resmi dilantik dalam sebuah prosesi yang berlangsung khidmat di Ambon, Sabtu (21/2/2026) malam. Pelantikan dilakukan langsung oleh Ketua Umum Pengurus Nasional Perkumpulan Senior (DPP) GMKI, William Sabandar.Dalam Pertemuan Raya Senior GMKI Ambon yang digelar sebelumnya, Pendeta Ricardo Andriosa Rikumahu, MTh ditetapkan sebagai Ketua DPC GMKI Ambon untuk masa bakti 2026–2029. Pendeta Ricardo yang saat ini menjabat Wakil Ketua I Majelis Pekerja Harian Sinode Gereja Protestan Maluku (GPM) dan pernah memimpin Klasis GPM Kota Ambon﻿, melanjutkan estafet kepemimpinan dari Prof. Dr. Fredy Leiwakabessy, MPd.</span></span></span></div><div data-block-id="jsNWCnd_V0" data-slate-id="jsNWCnd_V0" class="slate-p" style="position:relative"><span><span><span>﻿</span></span></span></div><div data-block-id="wqM4pPsJ28" data-slate-void="true" data-slate-url="http://data.seniorgmki.com/uploads/1772190063548-0a2d9399b10b9ed79fd89822.jpg" data-slate-id="wqM4pPsJ28" class="slate-img" style="position:relative"><span style="color:transparent;height:0;outline:none;position:absolute" data-slate-spacer="true"><span><span><span>﻿</span></span></span></span></div><div data-block-id="u6NSHBDNkq" data-slate-id="u6NSHBDNkq" class="slate-p" style="position:relative"><span><span><span>
Dalam sambutannya, Ketua Umum DPP GMKI William Sabandar menegaskan bahwa kepengurusan baru diharapkan mampu memperkuat konsolidasi senior GMKI sekaligus menghadirkan kontribusi nyata bagi gereja, masyarakat, dan pembangunan daerah.
</span></span></span><span><span data-slate-bold="true" data-slate-italic="true"><em class="slate-italic"><strong class="slate-bold"><span>“Senior GMKI harus menjadi jangkar moral dan intelektual dalam merawat nilai-nilai perjuangan organisasi. DPC GMKI Ambon diharapkan tidak hanya menjadi wadah silaturahmi, tetapi juga ruang kolaborasi strategis lintas profesi untuk menjawab tantangan zaman,” </span></strong></em></span></span><span><span><span>tegas Sabandar</span></span></span><span><span data-slate-bold="true" data-slate-italic="true"><em class="slate-italic"><strong class="slate-bold"><span>. </span></strong></em></span></span></div><div data-block-id="soRbrn4I9M" data-slate-id="soRbrn4I9M" class="slate-p" style="position:relative"><span><span><span>﻿Ia juga menekankan pentingnya sinergi antara senior dan kader aktif GMKI agar proses kaderisasi berjalan berkesinambungan dan berorientasi pada dampak sosial yang konkret. </span></span></span></div><div data-block-id="uT-vg-nan8" data-slate-id="uT-vg-nan8" class="slate-p" style="position:relative"><span><span><span>﻿</span></span></span></div><div data-block-id="Ylxc0BPFvc" data-slate-id="Ylxc0BPFvc" class="slate-p" style="position:relative"><span><span><span>Tim Formatur yang dipimpin Prof. Dr. Fredy Leiwakabessy selanjutnya menetapkan komposisi kepengurusan lengkap. Victor Palijama, SP dipercaya sebagai Sekretaris, didampingi Wakil Sekretaris I (Internal dan Organisasi) Dr. Baretha Titioka, SE MM; Wakil Sekretaris II (Program dan Kolaborasi) Dr. Stenly Salenusa, SE MSi; serta Wakil Sekretaris III (Administrasi, Hukum & Digital) Dody Soselisa, SH MH.</span></span></span></div><div data-block-id="EAC8E5V7b0" data-slate-id="EAC8E5V7b0" class="slate-p" style="position:relative"><span><span><span>
Membantu ketua dalam keuangan, Ir. Felecia Adam, MSi ditetapkan sebagai Bendahara Umum, bersama Wakil Bendahara I Dr. Elsina Hubertha Apono, SE MSi dan Wakil Bendahara II Petrus Tipawael, SE.Struktur organisasi turut diperkuat oleh Dewan Penasehat yang diketuai Prof. Dr. Fredy Leiwakabessy, MPd, dengan anggota yang terdiri dari para senior GMKI lintas profesi, yakni Richard Louhanepessy, SH; Prof. Dr. S.E.M. Nirahua, SH MH; Drs. Bitto S. Temmar; Drs. Lucky Wattimury, MSi; Pendeta Elifas T. Maspaitella, SSi MSi; Pendeta Reinhard Tupan, MTh; Prof. Dr. Yance Z. Rumahuru, MSi; Dr. Steve GC Gaspersz, MSi MA; Drs. Rury Moenandar; Dr. Adolof Salakey, SH MH; Marcus Pentury, SE; Drs. Felix Latuheru; Phil Meno Latumarisa, SPd; Pendeta Adriana Lohy, MTh; serta Drs. Edo Luturmas, MPd.</span></span></span></div><div data-block-id="DaUiDphURD" data-slate-id="DaUiDphURD" class="slate-p" style="position:relative"><span><span><span>
Untuk memperkuat arah gerak organisasi, kepengurusan periode 2026–2029 membentuk sepuluh bidang strategis, yaitu:</span></span></span></div><div data-block-id="1ojD-ETOPB" data-slate-id="1ojD-ETOPB" class="slate-p" style="position:relative"><span><span><span>﻿</span></span></span></div><div data-block-id="Pa5jvPL7mx" data-slate-id="Pa5jvPL7mx" class="slate-p" style="position:relative"><span><span><span>1. Bidang Spiritualitas dan Pembinaan Iman</span></span></span></div><div data-block-id="JZ-gKXX_zT" data-slate-id="JZ-gKXX_zT" class="slate-p" style="position:relative"><span><span><span>2. Bidang Kajian dan Pengembangan GMKI</span></span></span></div><div data-block-id="-rYiOjKjMs" data-slate-id="-rYiOjKjMs" class="slate-p" style="position:relative"><span><span><span>3. Bidang Komunikasi, Jaringan Internal & Data Senior</span></span></span></div><div data-block-id="Oc4Mr4ElCz" data-slate-id="Oc4Mr4ElCz" class="slate-p" style="position:relative"><span><span><span>4. Bidang Kemitraan Eksternal & Hubungan Antar Lembaga</span></span></span></div><div data-block-id="-iMEv1BunM" data-slate-id="-iMEv1BunM" class="slate-p" style="position:relative"><span><span><span>5. Bidang Pengembangan Kapasitas & Kepemimpinan Senior</span></span></span></div><div data-block-id="Ol42P-2dqh" data-slate-id="Ol42P-2dqh" class="slate-p" style="position:relative"><span><span><span>6. Bidang Gender, Kebudayaan & Inklusivitas</span></span></span></div><div data-block-id="P0XMgzc9ze" data-slate-id="P0XMgzc9ze" class="slate-p" style="position:relative"><span><span><span>7. Bidang Kemandirian Daya, Dana & Transformasi</span></span></span></div><div data-block-id="wwv6pTijRm" data-slate-id="wwv6pTijRm" class="slate-p" style="position:relative"><span><span><span>8. Bidang Medan Pelayanan & Advokasi: Gereja–Masyarakat–Bangsa/Negara</span></span></span></div><div data-block-id="W9VHElHbtn" data-slate-id="W9VHElHbtn" class="slate-p" style="position:relative"><span><span><span>9. Bidang Organisasi & Tata Kelola</span></span></span></div><div data-block-id="AhLxzbWQBM" data-slate-id="AhLxzbWQBM" class="slate-p" style="position:relative"><span><span><span>10. Bidang Riset dan Lingkungan Hidup</span></span></span></div><div data-block-id="CShKN72KDG" data-slate-id="CShKN72KDG" class="slate-p" style="position:relative"><span><span><span>
Masing-masing bidang dipimpin oleh figur senior yang memiliki kompetensi dan pengalaman di bidangnya, serta didukung oleh wakil ketua dan anggota yang berasal dari kalangan akademisi, profesional, tokoh gereja, dan pelayan publik.</span></span></span></div><div data-block-id="-ynKG-p8AN" data-slate-id="-ynKG-p8AN" class="slate-p" style="position:relative"><span><span><span>
Dengan formasi yang solid dan representatif ini, DPC GMKI Ambon diharapkan mampu menjadi mitra strategis dalam mendukung penguatan kaderisasi GMKI, memperluas jejaring kolaborasi, serta menghadirkan kontribusi nyata bagi pembangunan Maluku dalam empat tahun ke depan.</span></span></span></div></div>`,
      thumbnail: "http://data.seniorgmki.com/uploads/1772189374037-e7eb742813858e72760992c6.jpg",
      status: "PUBLISHED",
      tags: ["Siaran Pers", "Organisasi"],
      author: user,
      kategori: ["GMKI", "DPP", "Pelantikan"],
    },
    {
      judul: "Peringati International Women’s Day, Senior GMKI Kuatkan Advokasi Perlindungan Perempuan dan Anak melalui Film ‘Invisible Hopes’",
      slug: "peringati-international-womens-day-senior-gmki-kuatkan-advokasi-perlindungan-perempuan-dan-anak-melalui-film-invisible-hopes",
      ringkasan:
        "Pendeta Ricardo Andriosa Rikumahu resmi ditetapkan sebagai Ketua Pengurus Cabang Perkumpulan Senior (DPC) Gerakan Mahasiswa Kristen Indonesia (GMKI) Cabang Ambon untuk masa bakti 2026–2029, menggantikan Fredy Leiwakabessy. Penetapan itu dilakukan dalam Pertemuan Raya DPC GMKI Ambon di Ambon, Sabtu (21/2/2026), sekaligus diikuti pengumuman struktur pengurus baru. Pelantikan dihadiri pengurus nasional dan diharapkan dapat memperkuat peran organisasi serta sinergi pembangunan di Ambon dan Maluku.",
      konten:
        `<p>       <strong>Jakarta, 7 Maret 2026</strong> – Perlindungan terhadap perempuan dan anak dalam situasi khusus, terutama narapidana hamil dan anak-anak yang lahir serta dibesarkan di lembaga pemasyarakatan, masih menjadi tantangan dalam sistem hukum dan sosial di Indonesia. Keterbatasan fasilitas, minimnya pendekatan berbasis kepentingan terbaik anak, serta belum optimalnya kebijakan yang implementatif dan berpihak pada kepentingan terbaik perempuan dan anak menunjukkan perlunya perhatian serius serta langkah konkret lintas sektor.</p>
<p>Pesan itu tersampaikan dalam pemutaran dan dialog film dokumenter ‘Invisible Hopes’ yang digelar Pengurus Nasional Perkumpulan Senior Gerakan Mahasiswa Kristen Indonesia (DPP GMKI) bekerja sama dengan Lam Horas Film untuk memperingati International Women’s Day 2026 di Cinepolis, Lippo Mal Nusantara, Jakarta, Sabtu, 7 Maret 2026. Film pemenang Piala Citra yang disutradarai dan diproduseri oleh Lamtiar Simorangkir ini mengangkat kisah nyata ibu hamil dan anak-anak yang lahir dan hidup di balik jeruji.</p>
<p></p>
<p>Lebih dari 150 orang peserta antusias mengikuti pemutaran film dan diskusi, berasal dari berbagai kalangan seperti Kementerian Sosial, Kementerian Pemberdayaan Perempuan dan Perlindungan Anak, Direktorat Tindak Pidana Perlindungan Perempuan dan Anak serta Pemberantasan Perdagangan Orang Bareskrim Polri, Kedutaan Swiss, organisasi masyarakat, gerakan mahasiswa, jurnalis, dan para aktivis perempuan.</p>
<p></p>
<p>Lamtiar Simorangkir yang juga Ketua Bidang Gender, Kebudayaan dan Inklusivitas DPP GMKI menekankan momentum ini sebagai bagian dari upaya advokasi yang mempertemukan masyarakat sipil, pembuat kebijakan, pemerintah, akademisi, dan perwakilan diplomatik untuk mendorong sistem yang lebih adil, inklusif, serta berperspektif gender. </p>
<p>“Kegiatan ini diharapkan memperkuat dampak advokasi melalui film ‘Invisible Hopes’ sekaligus membangun komitmen lintas sektor untuk mengambil langkah nyata dan terukur dalam mendorong perbaikan kebijakan serta praktik pemasyarakatan yang lebih adil bagi perempuan dan anak,” kata Lamtiar.</p>
<p></p>
<p>       Asisten Deputi Bidang Perlindungan Hak Perempuan Pekerja dan Tindak Pidana Perdagangan Orang Kementerian Pemberdayaan Perempuan dan Perlindungan Anak, Prijadi Santoso mengapresiasi film ini. “Dari sini kami jadi paham apa yang harus diperbuat pemerintah. Mari segera mengimplementasikannya, bagaimanapun hak-hak anak harus diwujudkan karena itu sudah dilindungi undang-undang,” kata Prijadi.</p>
<p></p>
<p>       Komitmen senada disampaikan Direktur Rehabilitasi Sosial Anak Kementerian Sosial, Agung Suhartoyo. Ia berpendapat, penggunaan film sebagai media kampanye sangat kuat untuk menumbuhkan empati perlindungan anak.</p>
<p>“Film ini sangat pas dengan momen Hari Perempuan Internasional sekaligus mengingatkan kita bahwa perlindungan anak merupakan tanggung jawab bersama. Pemerintah mengajak masyarakat dan berbagai pihak untuk berkolaborasi menciptakan lingkungan yang ramah bagi anak, demi memenuhi Pasal 34 UUD 1945,” urainya.</p>
<p></p>
<p>       Deputy Head Political, Economic dan Cultural Kedutaan Besar Swiss untuk Indonesia Tessa Nerini pun terkesan dengan film ini, yang membawa kita melihat lebih dekat kondisi ibu dan anak yang hidup di penjara.</p>
<p>“Sesuai dengan ‘The Bangkok Rules’ yang menjadi acuan dalam perlakuan penanganan tahanan, narapidana dan anak binaan perempuan, Pemerintah Swiss sangat menghormati diplomasi dengan mengedepankan pemenuhan hak asasi manusia. Untuk itu, kami mendukung film seperti ini sebagai upaya dialog konstruktif pemenuhan hak ibu dan anak di penjara,” ungkapnya.</p>
<p></p>
<p>      Tekad konkret dinyatakan Direktur Tindak Pidana Perdagangan Perempuan dan Anak Mabes Polri Brigjen Pol Nurul Azizah yang langsung menegaskan komitmen saat polisi menerima terlapor perempuan dalam kondisi hamil.</p>
<p>“Kami pasti akan melakukan langkah khusus. Bisa berupa penangguhan penahanan, tahanan kota, atau tahanan rumah dengan jaminan dari keluarganya,” kata Nurul disambut tepuk tangan peserta acara.</p>
<p></p>
<p>       Ketua Umum DPP GMKI William Sabandar menegaskan, acara ini bukan sekadar nonton bareng, tetapi mengajak publik melakukan perjalanan bersama dalam perjuangan persoalan gender, budaya, dan terwujudnya masyarakat yang inklusif.</p>
<p>“Film ini masih akan terus relevan sepanjang pesan di dalamnya belum terlaksana. Mari lahirkan gerakan bersama, dimulai dari diri sendiri dan keluarga kita. Mulai dari langkah kecil, agar banyak ketimpangan yang kita lihat di film ini bisa terjembatani,” kata Ketua Umum DPP GMKI William Sabandar.</p>
<p></p>
<p>       Seusai pemutaran film dan diskusi, dilakukan penandatanganan poster oleh 15 pihak sebagai bentuk komitmen bersama untuk melakukan langkah tindak lanjut konkret dalam perlindungan perempuan dan anak, khususnya narapidana hamil serta anak-anak yang lahir dan dibesarkan di dalam penjara. Sejak dirilis pada tahun 2021, ‘Invisible Hopes’ yang diproduksi oleh Lam Horas Film telah menjalankan berbagai rangkaian impact campaign di Indonesia. Film ini tidak hanya tayang melalui rilis bioskop (theatrical release), tetapi juga diputar dalam berbagai forum diskusi publik, kampus, komunitas, serta diundang dalam sejumlah konferensi dan forum hak asasi manusia, baik di tingkat nasional maupun internasional. Lam Horas Film juga telah memberikan rekomendasi kepada pemerintah terkait langkah-langkah yang perlu diambil guna memastikan pemenuhan hak narapidana hamil dan anak-anak yang lahir serta dibesarkan di dalam penjara.</p>
<p></p>
<p>       Lamtiar Simorangkir berulang kali mengajak para undangan yang hadir untuk lebih peduli terhadap nasib ibu hamil serta anak-anak yang lahir dan dibesarkan di dalam penjara. Ia menekankan bahwa stigma terhadap para ibu sering kali membuat kondisi anak-anak mereka luput dari perhatian publik. “Jika kita tidak mau ‘melihat’ para ibu ini karena mereka adalah narapidana, maka lihatlah anaknya. Jangan biarkan mereka menanggung hukuman yang bukan milik mereka,” ujarnya.</p>`,
      thumbnail: "http://data.seniorgmki.com/uploads/1773255465449-36fc985a88ab05f565a73c3b.jpeg",
      status: "PUBLISHED",
      tags: ["GMKI", "DPP"],
      author: user,
      kategori: ["Siaran Pers", "Kegiatan"],
    },
    {
      judul: "Resmi Dilantik, DPC GMKI Makassar Komitmen Perkuat Peran di Gereja, Kampus, dan Masyarakat",
      slug: "resmi-dilantik-dpc-gmki-makassar-komitmen-perkuat-peran-di-gereja-kampus-dan-masyarakat",
      ringkasan:
        "DPC GMKI Makassar periode 2026–2029 resmi dilantik oleh DPP GMKI pada 15 Maret 2026. Kepengurusan baru dipimpin oleh Dan Pongtasik dan diharapkan menjadi wadah kontribusi nyata bagi senior GMKI. Dalam pelantikan ini, ditekankan pentingnya sinergi antar senior serta peran strategis dalam mendukung pembangunan nasional dan visi Indonesia Emas 2045.",
      konten:
        `<p><strong>Makassar</strong> – Pengurus Cabang Perkumpulan Senior (DPC) GMKI Makassar periode 2026–2029 resmi dilantik pada Minggu (15/3/2026) di Student Centre GMKI Makassar. Prosesi pelantikan dipimpin langsung oleh Ketua Umum Pengurus Nasional Perkumpulan Senior (DPP) GMKI, William P. Sabandar.</p>\n<p>Acara diawali dengan ibadah singkat yang dipimpin oleh Yohanis Metris, yang juga menjabat sebagai Ketua PGIW Sulawesi Selatan, Barat, dan Tenggara periode 2026–2031.</p>\n<p>Dalam kesempatan tersebut, ditetapkan struktur kepengurusan DPC GMKI Makassar, dengan Dan Pongtasik sebagai Ketua, didampingi Dr. Kristian H.P. Lambe dan Ivan Kala’lembang sebagai Wakil Ketua, serta Dr. Sita Sabandar sebagai Sekretaris dan Dra. Olly Bittikaka sebagai Bendahara. Sementara itu, Ir. Leonardo J. Hehanusa dipercaya sebagai Ketua Dewan Penasehat.</p>\n<p>Dalam sambutannya, Dan Pongtasik menegaskan bahwa DPC merupakan wadah strategis bagi para senior GMKI untuk berkontribusi secara nyata. Ia mendorong seluruh pengurus dan anggota agar aktif menginisiasi program-program yang berdampak luas bagi masyarakat dan mendukung pembangunan, khususnya di Kota Makassar.</p>\n<p>Di sisi lain, William P. Sabandar menekankan pentingnya sinergi antar senior GMKI di berbagai daerah. Ia menyebut pelantikan ini sebagai bagian dari upaya memperkuat jaringan organisasi, di mana Makassar menjadi cabang keempat yang telah dilantik dari sekitar 30 cabang yang ada.</p>\n<p>Ia juga mengungkapkan rencana pelaksanaan Rapat Kerja Nasional DPP GMKI di Wisma Kinasih sebagai forum strategis untuk merumuskan kontribusi nyata para senior dalam pembangunan nasional.</p>\n<p>Lebih lanjut, William menegaskan bahwa Perkumpulan Senior harus menjadi bagian integral dari GMKI dan memiliki tanggung jawab moral dalam mendukung pengembangan organisasi di seluruh Indonesia.</p>\n<p>Dalam konteks yang lebih luas, ia mengaitkan peran senior GMKI dengan visi Indonesia Emas 2045. Menurutnya, GMKI dan para senior memiliki peran penting dalam mencetak pemimpin masa depan yang mampu mendorong pertumbuhan ekonomi yang berkeadilan dan inklusif.</p>`,
      thumbnail: "http://data.seniorgmki.com/uploads/1775574334245-04bcf7bedf2bd488ae44fe7a.jpg",
      status: "PUBLISHED",
      tags: ["Nasional", "Pelantikan", "GMKI"],
      author: user,
      kategori: ["Organisasi", "Kegiatan"],
    },
  ];

  for (const item of newsList) {
    const news = await prisma.newsUtama.upsert({
      where: { slug: item.slug },
      update: {},
      create: {
        judul: item.judul,
        ringkasan: item.ringkasan,
        konten: item.konten,
        slug: item.slug,
        url_thumbnail_img: item.thumbnail,
        statusNewsUtama: item.status,
        author_akun_uuid: item.author.uuid,
        published_at: item.status === "PUBLISHED" ? new Date() : null,
        published_by: item.status === "PUBLISHED" ? item.author.uuid : null,
        insert_by: admin.uuid,
      },
    });
    for (const tagName of item.tags) {
      const tag = findTag(tagName);
      if (!tag) continue;
      await prisma.newsUtamaTag.upsert({
        where: { news_utama_uuid_news_tag_uuid: { news_utama_uuid: news.uuid, news_tag_uuid: tag.uuid } },
        update: {},
        create: { news_utama_uuid: news.uuid, news_tag_uuid: tag.uuid, insert_by: admin.uuid },
      });
      await prisma.newsTag.update({ where: { uuid: tag.uuid }, data: { jumlah_penggunaan: { increment: 1 } } });
    }
    for (const kategoriName of item.kategori) {
      const kategori = findKategori(kategoriName);
      if (!kategori) continue;
      await prisma.newsUtamaKategori.upsert({
        where: { news_utama_uuid_news_kategori_uuid: { news_utama_uuid: news.uuid, news_kategori_uuid: kategori.uuid } },
        update: {},
        create: { news_utama_uuid: news.uuid, news_kategori_uuid: kategori.uuid, insert_by: admin.uuid },
      });
    }
    console.log(`  ✅ News: "${item.judul.substring(0, 55)}..."`);
  }
  console.log("✅ News seeded");
}

// ============================================================
// 3. JABATAN
// ============================================================
async function seedJabatan() {
  console.log("Seeding Jabatan...");
  const admin = await getAdmin();

  const list = [
    { namaJabatan: "Ketua Umum", levelJabatan: 0 },
    { namaJabatan: "Sekretaris Jenderal", levelJabatan: 0 },
    { namaJabatan: "Wakil Sekjen I", levelJabatan: 1 },
    { namaJabatan: "Wakil Sekjen II", levelJabatan: 1 },
    { namaJabatan: "Wakil Sekjen III", levelJabatan: 1 },
    { namaJabatan: "Wakil Sekjen IV", levelJabatan: 1 },
    { namaJabatan: "Bendahara Umum", levelJabatan: 0 },
    { namaJabatan: "Wakil Bendahara I", levelJabatan: 1 },
    { namaJabatan: "Wakil Bendahara II", levelJabatan: 1 },
    { namaJabatan: "Ketua Bidang", levelJabatan: 2 },
    { namaJabatan: "Wakil Ketua", levelJabatan: 3 },
    { namaJabatan: "Anggota", levelJabatan: 4 },
  ];

  for (const j of list) {
    await prisma.jabatan.upsert({
      where: { namaJabatan: j.namaJabatan },
      update: {},
      create: {
        ...j,
        insert_by: admin.uuid,
      },
    });
  }

  console.log("✅ Jabatan seeded");
}

// ============================================================
// 4. BIDANG
// ============================================================
async function seedBidang() {
  console.log("Seeding Bidang...");
  const admin = await getAdmin();

  const list = [
    "Bidang 1 - Spiritualitas & Pembinaan Iman",
    "Bidang 2 - Kajian & Pengembangan GMKI",
    "Bidang 3 - Komunikasi, Jaringan Internal dan Data Senior",
    "Bidang 4 - Kemitraan Eksternal dan Hubungan Antar Lembaga",
    "Bidang 5 - Pengembangan Kapasitas & Kepemimpinan Senior",
    "Bidang 6 - Gender, Kebudayaan & Inklusivitas",
    "Bidang 7 - Kemandirian Daya, Dana dan Transformasi Digital",
    "Bidang 8 - Medan Pelayanan & Advokasi",
    "Bidang 9 - Organisasi & Tata Kelola",
    "Internal dan Organisasi",
    "Program & Kolaborasi",
    "Administrasi, Hukum & Digital",
    "Pelayanan & Atensi Khusus Papua",
  ];

  for (const b of list) {
    await prisma.bidang.upsert({
      where: { namaBidang: b },
      update: {},
      create: {
        namaBidang: b,
        insert_by: admin.uuid,
      },
    });
  }

  console.log("✅ Bidang seeded");
}

// ============================================================
// 5. STRUKTUR ORGANISASI
// ============================================================
async function seedStrukturOrganisasi() {
  console.log("Seeding Struktur Organisasi...");
  const admin = await getAdmin();

  const cabangPusat = await prisma.cabang.findUnique({
    where: { email: "pusat@dpp.id" },
  });

  const cabangJakarta = await prisma.cabang.findUnique({
    where: { email: "jakarta@dpp.id" },
  });

  if (!cabangPusat || !cabangJakarta) return;

  //////////////////////////////////////////////////
  // PERIODE
  //////////////////////////////////////////////////
  const periodeDPP = await prisma.periodeKepengurusan.upsert({
    where: { uuid: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      uuid: "00000000-0000-0000-0000-000000000001",
      namaPeriode: "2025-2028",
      tahunMulai: 2025,
      tahunSelesai: 2028,
      isAktif: true,
      cabangUuid: cabangPusat.uuid,
      insert_by: admin.uuid,
    },
  });

  const periodeDPC = await prisma.periodeKepengurusan.upsert({
    where: { uuid: "00000000-0000-0000-0000-000000000002" },
    update: {},
    create: {
      uuid: "00000000-0000-0000-0000-000000000002",
      namaPeriode: "2024-2027",
      tahunMulai: 2024,
      tahunSelesai: 2027,
      isAktif: true,
      cabangUuid: cabangJakarta.uuid,
      insert_by: admin.uuid,
    },
  });

  //////////////////////////////////////////////////
  // HELPERS
  //////////////////////////////////////////////////
  const getOrCreateJabatan = async (nama: string) => {
    let jabatan = await prisma.jabatan.findFirst({
      where: { namaJabatan: { equals: nama, mode: "insensitive" } },
    });

    if (!jabatan) {
      jabatan = await prisma.jabatan.create({
        data: {
          namaJabatan: nama,
          levelJabatan: 0,
          insert_by: admin.uuid,
        },
      });
    }

    return jabatan;
  };

  const getOrCreateBidang = async (nama?: string | null) => {
    if (!nama) return null;

    let bidang = await prisma.bidang.findFirst({
      where: { namaBidang: { equals: nama, mode: "insensitive" } },
    });

    if (!bidang) {
      bidang = await prisma.bidang.create({
        data: {
          namaBidang: nama,
          insert_by: admin.uuid,
        },
      });
    }

    return bidang;
  };

  //////////////////////////////////////////////////
  // DATA DPP (FULL 1–45)
  //////////////////////////////////////////////////
  const strukturDPP = [
    // Pimpinan Inti
    { namaLengkap: "William Sabandar", namaJabatan: "Ketua Umum", bidang: null, urutan: 1 },
    { namaLengkap: "Pdt. Jeirry Sumampow", namaJabatan: "Sekretaris Jenderal", bidang: null, urutan: 2 },
    { namaLengkap: "Alui Marunduri", namaJabatan: "Wakil Sekjen I", bidang: "Internal dan Organisasi", urutan: 3 },
    { namaLengkap: "Desi Datang", namaJabatan: "Wakil Sekjen II", bidang: "Program & Kolaborasi", urutan: 4 },
    { namaLengkap: "Rendy Umboh", namaJabatan: "Wakil Sekjen III", bidang: "Administrasi, Hukum & Digital", urutan: 5 },
    { namaLengkap: "Christian Sohilait", namaJabatan: "Wakil Sekjen IV", bidang: "Pelayanan & Atensi Khusus Papua", urutan: 6 },
    { namaLengkap: "Junita Sari Ujung", namaJabatan: "Bendahara Umum", bidang: null, urutan: 7 },
    { namaLengkap: "Desye Syul Lumbaa", namaJabatan: "Wakil Bendahara I", bidang: null, urutan: 8 },
    { namaLengkap: "Robinson Simamora", namaJabatan: "Wakil Bendahara II", bidang: null, urutan: 9 },

    // Loop Bidang 1–9 (biar clean & scalable)
    ...[
      {
        bidang: "Bidang 1 - Spiritualitas & Pembinaan Iman",
        data: [
          ["Pdt. Ronald Tapilatu", "Ketua Bidang"],
          ["Pdt. Hariman Pattianakott", "Wakil Ketua"],
          ["Shanty Marpaung", "Anggota"],
          ["Angelina Sigalingging", "Anggota"],
        ],
      },
      {
        bidang: "Bidang 2 - Kajian & Pengembangan GMKI",
        data: [
          ["Herjon Panggabean", "Ketua Bidang"],
          ["Ranto Rajagukguk", "Wakil Ketua"],
          ["Michael Anggi", "Anggota"],
          ["Yuliana Herman W. Djo Sihombing", "Anggota"],
        ],
      },
      {
        bidang: "Bidang 3 - Komunikasi, Jaringan Internal dan Data Senior",
        data: [
          ["Sonya Sinombor", "Ketua Bidang"],
          ["Agustinus Eko Rahardjo", "Wakil Ketua"],
          ["David Sitorus", "Anggota"],
          ["Victor R. Ambarita", "Anggota"],
        ],
      },
      {
        bidang: "Bidang 4 - Kemitraan Eksternal dan Hubungan Antar Lembaga",
        data: [
          ["Arijon Manurung", "Ketua Bidang"],
          ["Agustinus Ufie", "Wakil Ketua"],
          ["Adriana M. Lambe", "Anggota"],
          ["Catur Rini", "Anggota"],
        ],
      },
      {
        bidang: "Bidang 5 - Pengembangan Kapasitas & Kepemimpinan Senior",
        data: [
          ["Nielma Palamba", "Ketua Bidang"],
          ["Santhi D.R. Marpaung", "Wakil Ketua"],
          ["Christofer J.H. Ladja", "Anggota"],
          ["Janrivai Silalahi", "Anggota"],
        ],
      },
      {
        bidang: "Bidang 6 - Gender, Kebudayaan & Inklusivitas",
        data: [
          ["Lamtiar Simorangkir", "Ketua Bidang"],
          ["Lusia Palulungan", "Wakil Ketua"],
          ["Pahlawarni Girsang", "Anggota"],
          ["Atiek Silalahi", "Anggota"],
        ],
      },
      {
        bidang: "Bidang 7 - Kemandirian Daya, Dana dan Transformasi Digital",
        data: [
          ["Daniel Godwin Sihotang", "Ketua Bidang"],
          ["Yulius Victor Metubun", "Wakil Ketua"],
          ["Eliyah Acantha M. Sampetoding", "Anggota"],
          ["Andrella Hutabarat", "Anggota"],
        ],
      },
      {
        bidang: "Bidang 8 - Medan Pelayanan & Advokasi",
        data: [
          ["Johni Jonatan Numberi", "Ketua Bidang"],
          ["Pdt. Henrek Lokra", "Wakil Ketua"],
          ["Almara Dwi Sitompul", "Anggota"],
          ["Grafika Hardiany Parebong", "Anggota"],
        ],
      },
      {
        bidang: "Bidang 9 - Organisasi & Tata Kelola",
        data: [
          ["Nelson Simanjuntak", "Ketua Bidang"],
          ["Juandi Gultom", "Wakil Ketua"],
          ["Syamsuddin", "Anggota"],
          ["Fancy Ransun", "Anggota"],
        ],
      },
    ].flatMap((b, i) =>
      b.data.map((d, idx) => ({
        namaLengkap: d[0],
        namaJabatan: d[1],
        bidang: b.bidang,
        urutan: 10 + i * 4 + idx,
      }))
    ),
  ];

  //////////////////////////////////////////////////
  // INSERT DPP
  //////////////////////////////////////////////////
  for (const s of strukturDPP) {
    const senior = await prisma.anggota.findFirst({
      where: { namaLengkap: s.namaLengkap },
    });

    if (!senior) {
      console.warn(`⚠️ Senior tidak ditemukan: ${s.namaLengkap}`);
      continue;
    }

    const jabatan = await getOrCreateJabatan(s.namaJabatan);
    const bidang = await getOrCreateBidang(s.bidang);

    const exists = await prisma.strukturOrganisasi.findFirst({
      where: {
        periodeUuid: periodeDPP.uuid,
        anggotaUuid: senior.uuid,
      },
    });

    if (!exists) {
      await prisma.strukturOrganisasi.create({
        data: {
          periodeUuid: periodeDPP.uuid,
          anggotaUuid: senior.uuid,
          jabatanUuid: jabatan.uuid,
          bidangUuid: bidang?.uuid ?? null,
          urutan: s.urutan,
          insert_by: admin.uuid,
        },
      });
    }
  }

  //////////////////////////////////////////////////
  // DPC (tetap)
  //////////////////////////////////////////////////
  const seniorJakarta = await prisma.anggota.findMany({
    where: { cabangUuid: cabangJakarta.uuid },
  });

  const strukturDPC = [
    { namaJabatan: "Ketua", bidang: null, urutan: 1, seniorIdx: 0 },
    { namaJabatan: "Sekretaris", bidang: null, urutan: 2, seniorIdx: 1 },
    { namaJabatan: "Bendahara", bidang: null, urutan: 3, seniorIdx: 2 },
  ];

  for (const s of strukturDPC) {
    const senior = seniorJakarta[s.seniorIdx % seniorJakarta.length];
    if (!senior) continue;

    const jabatan = await getOrCreateJabatan(s.namaJabatan);
    const bidang = await getOrCreateBidang(s.bidang);

    const exists = await prisma.strukturOrganisasi.findFirst({
      where: {
        periodeUuid: periodeDPC.uuid,
        jabatanUuid: jabatan.uuid,
        bidangUuid: bidang?.uuid ?? null,
      },
    });

    if (!exists) {
      await prisma.strukturOrganisasi.create({
        data: {
          periodeUuid: periodeDPC.uuid,
          anggotaUuid: senior.uuid,
          jabatanUuid: jabatan.uuid,
          bidangUuid: bidang?.uuid ?? null,
          urutan: s.urutan,
          insert_by: admin.uuid,
        },
      });
    }
  }

  console.log("✅ Struktur Organisasi seeded (FULL DPP)");
}

// ============================================================
// 4b. SENIOR DPP (45 PENGURUS RESMI)
// ============================================================
async function seedAnggota() {
  console.log("Seeding 45 Senior DPP...");
  const admin = await getAdmin();

  const seniorList = [
    // ── Pimpinan Inti ──
    { uuid: "bca17f0a-5166-4dce-90c7-b211df87866d", namaLengkap: "William Sabandar",              namaPanggil: "Willy", jabatan: "Ketua Umum" },
    { uuid: "479f7ecd-5cc8-4f0c-8c6a-6f4811c28bfa", namaLengkap: "Pdt. Jeirry Sumampow",          namaPanggil: null,    jabatan: "Sekretaris Jenderal" },
    { uuid: "c457f8c0-9dcf-47b0-85a1-0f88f5531153", namaLengkap: "Alui Marunduri",                namaPanggil: null,    jabatan: "Wakil Sekjen I – Internal dan Organisasi" },
    { uuid: "73b7d29b-3600-403d-a143-c65b65d5ef26", namaLengkap: "Desi Datang",                   namaPanggil: null,    jabatan: "Wakil Sekjen II – Program & Kolaborasi" },
    { uuid: "cd0bdfaf-6e09-4e6d-a4d4-6e4cc61636be", namaLengkap: "Rendy Umboh",                   namaPanggil: null,    jabatan: "Wakil Sekjen III – Administrasi, Hukum & Digital" },
    { uuid: "f07b5a10-0f4a-46ad-938c-aa353d0cb468", namaLengkap: "Christian Sohilait",             namaPanggil: null,    jabatan: "Wakil Sekjen IV – Pelayanan & Atensi Khusus Papua" },
    { uuid: "b93a99f0-d2f1-42ff-8ca9-b94e1c6395ee", namaLengkap: "Junita Sari Ujung",              namaPanggil: null,    jabatan: "Bendahara Umum" },
    { uuid: "17df3e35-b16f-4c41-af85-32f8f1053f24", namaLengkap: "Desye Syul Lumbaa",              namaPanggil: null,    jabatan: "Wakil Bendahara I" },
    { uuid: "f29999ab-17b2-47d3-aa43-9fdeca1740fe", namaLengkap: "Robinson Simamora",              namaPanggil: null,    jabatan: "Wakil Bendahara" },

    // ── Bidang 1 - Spiritualitas & Pembinaan Iman ──
    { uuid: "5479f86c-0257-4e0c-ab64-2160649f20a2", namaLengkap: "Pdt. Ronald Tapilatu",           namaPanggil: null,    jabatan: "Ketua Bidang Spiritualitas & Pembinaan Iman" },
    { uuid: "3c51fae4-e9f9-473c-9910-29525b64a2d9", namaLengkap: "Pdt. Hariman Pattianakott",      namaPanggil: null,    jabatan: "Wakil Ketua Bidang Spiritualitas & Pembinaan Iman" },
    { uuid: "2545b704-79a1-4bcc-aca6-5b895f0b9584", namaLengkap: "Shanty Marpaung",                namaPanggil: null,    jabatan: "Anggota Bidang Spiritualitas & Pembinaan Iman" },
    { uuid: "589b9928-8529-4b9c-9675-9a47c94fa542", namaLengkap: "Angelina Sigalingging",          namaPanggil: null,    jabatan: "Anggota Bidang Spiritualitas & Pembinaan Iman" },

    // ── Bidang 2 - Kajian & Pengembangan GMKI ──
    { uuid: "be8d6768-b82e-4dd9-985d-f67358206e96", namaLengkap: "Herjon Panggabean",              namaPanggil: null,    jabatan: "Ketua Bidang Kajian & Pengembangan GMKI" },
    { uuid: "40cab82f-2192-460c-9594-e7c7d72e1074", namaLengkap: "Ranto Rajagukguk",               namaPanggil: null,    jabatan: "Wakil Ketua Bidang Kajian & Pengembangan GMKI" },
    { uuid: "ccc8ae16-49c1-4302-a1e6-82a0b2d268cc", namaLengkap: "Michael Anggi",                  namaPanggil: null,    jabatan: "Anggota Bidang Kajian & Pengembangan GMKI" },
    { uuid: "0b782219-56b1-409e-b07f-8a925d67662d", namaLengkap: "Yuliana Herman W. Djo Sihombing",namaPanggil: null,    jabatan: "Anggota Bidang Kajian & Pengembangan GMKI" },

    // ── Bidang 3 - Komunikasi, Jaringan Internal dan Data Senior ──
    { uuid: "41376098-0edf-4113-b571-0d4093e2f05a", namaLengkap: "Sonya Sinombor",                 namaPanggil: null,    jabatan: "Ketua Bidang Komunikasi, Jaringan Internal dan Data Senior" },
    { uuid: "ec318848-d345-4c2d-ad89-352009c945c6", namaLengkap: "Agustinus Eko Rahardjo",          namaPanggil: null,    jabatan: "Wakil Ketua Bidang Komunikasi, Jaringan Internal dan Data Senior" },
    { uuid: "d1cfeb25-4801-40f3-9acc-2d476c24e001", namaLengkap: "David Sitorus",                  namaPanggil: null,    jabatan: "Anggota Bidang Komunikasi, Jaringan Internal dan Data Senior" },
    { uuid: "b24a8b27-edc1-4b1d-9002-edcdc4837274", namaLengkap: "Victor R. Ambarita",             namaPanggil: null,    jabatan: "Anggota Bidang Komunikasi, Jaringan Internal dan Data Senior" },

    // ── Bidang 4 - Kemitraan Eksternal dan Hubungan Antar Lembaga ──
    { uuid: "e96bb754-e7bf-4ea1-9543-7aaf7e512913", namaLengkap: "Arijon Manurung",                namaPanggil: null,    jabatan: "Ketua Bidang Kemitraan Eksternal dan Hubungan Antar Lembaga" },
    { uuid: "e43def8e-ec6f-4681-ac4e-1b3f447ede1d", namaLengkap: "Agustinus Ufie",                 namaPanggil: null,    jabatan: "Wakil Ketua Bidang Kemitraan Eksternal dan Hubungan Antar Lembaga" },
    { uuid: "9ad9ad0e-e42f-443c-8148-badfedbabeef", namaLengkap: "Adriana M. Lambe",               namaPanggil: null,    jabatan: "Anggota Bidang Kemitraan Eksternal dan Hubungan Antar Lembaga" },
    { uuid: "7f94c33c-58c7-408b-9742-4dc7f71d8ff5", namaLengkap: "Catur Rini",                     namaPanggil: null,    jabatan: "Anggota Bidang Kemitraan Eksternal dan Hubungan Antar Lembaga" },

    // ── Bidang 5 - Pengembangan Kapasitas & Kepemimpinan Senior ──
    { uuid: "9c75703b-24b5-4d0c-afaf-d98edc580981", namaLengkap: "Nielma Palamba",                 namaPanggil: null,    jabatan: "Ketua Bidang Pengembangan Kapasitas & Kepemimpinan Senior" },
    { uuid: "d3f58681-325d-4ec8-9ec0-99c1443eebe8", namaLengkap: "Santhi D.R. Marpaung",           namaPanggil: null,    jabatan: "Wakil Ketua Bidang Pengembangan Kapasitas & Kepemimpinan Senior" },
    { uuid: "258622f9-308e-4113-9152-8caef9de4e59", namaLengkap: "Christofer J.H. Ladja",          namaPanggil: null,    jabatan: "Anggota Bidang Pengembangan Kapasitas & Kepemimpinan Senior" },
    { uuid: "891f3b2e-1f1c-4144-925c-5b4eae4918a2", namaLengkap: "Janrivai Silalahi",              namaPanggil: null,    jabatan: "Anggota Bidang Pengembangan Kapasitas & Kepemimpinan Senior" },

    // ── Bidang 6 - Gender, Kebudayaan & Inklusivitas ──
    { uuid: "9e8cfb34-648e-4fe0-b84f-695f069ce859", namaLengkap: "Lamtiar Simorangkir",            namaPanggil: null,    jabatan: "Ketua Bidang Gender, Kebudayaan & Inklusivitas" },
    { uuid: "b92ff014-c50b-4fe0-a267-cf04c1f79f1b", namaLengkap: "Lusia Palulungan",               namaPanggil: null,    jabatan: "Wakil Ketua Bidang Gender, Kebudayaan & Inklusivitas" },
    { uuid: "e63ff0e4-7868-4930-ab88-f25f1e1b82a1", namaLengkap: "Pahlawarni Girsang",             namaPanggil: null,    jabatan: "Anggota Bidang Gender, Kebudayaan & Inklusivitas" },
    { uuid: "c78a4313-f25f-4185-8ace-59502e89a286", namaLengkap: "Atiek Silalahi",                 namaPanggil: null,    jabatan: "Anggota Bidang Gender, Kebudayaan & Inklusivitas" },

    // ── Bidang 7 - Kemandirian Daya, Dana dan Transformasi Digital ──
    { uuid: "423d2b2a-f926-49dd-b99d-9d62094c821d", namaLengkap: "Daniel Godwin Sihotang",         namaPanggil: null,    jabatan: "Ketua Bidang Kemandirian Daya, Dana dan Transformasi Digital" },
    { uuid: "9e2bcea9-3cb6-4d4c-95af-d31d69576a7d", namaLengkap: "Yulius Victor Metubun",          namaPanggil: null,    jabatan: "Wakil Ketua Bidang Kemandirian Daya, Dana dan Transformasi Digital" },
    { uuid: "d45067a1-6c26-48ac-86e6-7a62d5646b1b", namaLengkap: "Eliyah Acantha M. Sampetoding",  namaPanggil: null,    jabatan: "Anggota Bidang Kemandirian Daya, Dana dan Transformasi Digital" },
    { uuid: "384675b9-2138-44f8-afb0-549ea217ab9f", namaLengkap: "Andrella Hutabarat",             namaPanggil: null,    jabatan: "Anggota Bidang Kemandirian Daya, Dana dan Transformasi Digital" },

    // ── Bidang 8 - Medan Pelayanan & Advokasi ──
    { uuid: "126cd97f-1c3d-40f9-8b1e-c38b389bb48a", namaLengkap: "Johni Jonatan Numberi",          namaPanggil: null,    jabatan: "Ketua Bidang Medan Pelayanan & Advokasi" },
    { uuid: "6fa822ad-f154-4959-bf10-9a7f9725c957", namaLengkap: "Pdt. Henrek Lokra",              namaPanggil: null,    jabatan: "Wakil Ketua Bidang Medan Pelayanan & Advokasi" },
    { uuid: "68930751-91cd-4fd8-848f-9599649d2a25", namaLengkap: "Almara Dwi Sitompul",            namaPanggil: null,    jabatan: "Anggota Bidang Medan Pelayanan & Advokasi" },
    { uuid: "c54ef9c1-7f85-4904-a499-c62314fb528e", namaLengkap: "Grafika Hardiany Parebong",       namaPanggil: null,    jabatan: "Anggota Bidang Medan Pelayanan & Advokasi" },

    // ── Bidang 9 - Organisasi & Tata Kelola ──
    { uuid: "5fdb3ca4-6a77-45bb-b84f-da3ca55209eb", namaLengkap: "Nelson Simanjuntak",             namaPanggil: null,    jabatan: "Ketua Bidang Organisasi & Tata Kelola" },
    { uuid: "130b4a69-8d4d-43ab-8e3f-9aa9a6664c7f", namaLengkap: "Juandi Gultom",                  namaPanggil: null,    jabatan: "Wakil Ketua Bidang Organisasi & Tata Kelola" },
    { uuid: "62075766-26c1-4dca-b59b-2bc01b504957", namaLengkap: "Syamsuddin",                     namaPanggil: null,    jabatan: "Anggota Bidang Organisasi & Tata Kelola" },
    { uuid: "418eadf5-7e32-460e-8ac7-ccc44185f2d6", namaLengkap: "Fancy Ransun",                   namaPanggil: null,    jabatan: "Anggota Bidang Organisasi & Tata Kelola" },
  ];

  for (const s of seniorList) {
    const exists = await prisma.anggota.findUnique({ where: { uuid: s.uuid } });
    if (!exists) {
      await prisma.anggota.create({
        data: {
          uuid: s.uuid,
          namaLengkap: s.namaLengkap,
          namaPanggil: s.namaPanggil,
          statusKeanggotaan: "NON_MEMBER",
          isApprovedByDPC: false,
          isApprovedByDPP: false,
          cabangUuid: null,
          insert_by: admin.uuid,
        },
      });
    }
    console.log(`  ✅ Senior: ${s.namaLengkap}`);
  }
  console.log(`✅ ${seniorList.length} Senior DPP seeded`);
}

// ============================================================
// 6. GALERI
// ============================================================
async function seedGaleri() {
  console.log("Seeding Galeri...");
  const admin = await getAdmin();

  const cabangPusat = await prisma.cabang.findUnique({
    where: { email: "pusat@dpp.id" },
  });

  //////////////////////////////////////////////////
  // DATA ALBUM
  //////////////////////////////////////////////////
  const albumList = [
    {
      namaAlbum: "Pelantikan DPP GMKI 2025-2028",
      deskripsi: "Dokumentasi foto acara peneguhan dan serah terima Pengurus Nasional DPP GMKI Periode 2025-2028.",
      tanggalKegiatan: new Date("2026-01-11"),
      coverMedia: "/galeri/album-pelantikan/cover.webp",
      isPublic: true,
      media: [
        { tipeMedia: "FOTO", urlMedia: "/galeri/album-pelantikan/foto-1.webp", keterangan: "Prosesi peneguhan pengurus baru", urutan: 1 },
        { tipeMedia: "FOTO", urlMedia: "/galeri/album-pelantikan/foto-2.webp", keterangan: "Foto bersama seluruh pengurus", urutan: 2 },
        { tipeMedia: "FOTO", urlMedia: "/galeri/album-pelantikan/foto-3.webp", keterangan: "Sambutan Ketua Umum William Sabandar", urutan: 3 },
        { tipeMedia: "FOTO", urlMedia: "/galeri/album-pelantikan/foto-4.webp", keterangan: "Penyerahan bendera organisasi", urutan: 4 },
        { tipeMedia: "FOTO", urlMedia: "/galeri/album-pelantikan/foto-5.webp", keterangan: "Ibadah peneguhan dipimpin Ketua Umum PGI", urutan: 5 },
        { tipeMedia: "VIDEO", urlMedia: "https://www.youtube.com/embed/example1", thumbnail: "/galeri/video/pelantikan-thumb.webp", keterangan: "Pelantikan DPP GMKI 2025-2028 - Full Video", durasi: "1:45:30", urutan: 6 },
        { tipeMedia: "VIDEO", urlMedia: "https://www.youtube.com/embed/example2", thumbnail: "/galeri/video/pidato-willy-thumb.webp", keterangan: "Pidato Perdana Ketua Umum DPP William Sabandar", durasi: "25:10", urutan: 7 },
      ],
    },
    {
      namaAlbum: "Rapat Kerja Nasional DPP 2026",
      deskripsi: "Dokumentasi foto Rapat Kerja Nasional DPP GMKI.",
      tanggalKegiatan: new Date("2026-02-20"),
      coverMedia: "/galeri/album-rakernas/cover.webp",
      isPublic: true,
      media: [
        { tipeMedia: "FOTO", urlMedia: "/galeri/album-rakernas/foto-1.webp", keterangan: "Pembukaan rakernas", urutan: 1 },
        { tipeMedia: "FOTO", urlMedia: "/galeri/album-rakernas/foto-2.webp", keterangan: "Sesi diskusi kelompok", urutan: 2 },
        { tipeMedia: "FOTO", urlMedia: "/galeri/album-rakernas/foto-3.webp", keterangan: "Presentasi program kerja", urutan: 3 },
        { tipeMedia: "FOTO", urlMedia: "/galeri/album-rakernas/foto-4.webp", keterangan: "Penandatanganan komitmen", urutan: 4 },
      ],
    },
    {
      namaAlbum: "Kunjungan Papua - Advokasi DPP 2026",
      deskripsi: "Dokumentasi kunjungan tim DPP ke Papua dalam rangka program advokasi.",
      tanggalKegiatan: new Date("2026-02-10"),
      coverMedia: "/galeri/album-papua/cover.webp",
      isPublic: true,
      media: [
        { tipeMedia: "FOTO", urlMedia: "/galeri/album-papua/foto-1.webp", keterangan: "Pertemuan dengan tokoh masyarakat Papua", urutan: 1 },
        { tipeMedia: "FOTO", urlMedia: "/galeri/album-papua/foto-2.webp", keterangan: "Kunjungan ke kampus Uncen Jayapura", urutan: 2 },
        { tipeMedia: "FOTO", urlMedia: "/galeri/album-papua/foto-3.webp", keterangan: "Dialog dengan senior GMKI Jayapura", urutan: 3 },
        { tipeMedia: "VIDEO", urlMedia: "https://www.youtube.com/embed/example4", thumbnail: "/galeri/video/papua-thumb.webp", keterangan: "Dokumentasi Kunjungan Papua", durasi: "18:25", urutan: 4 },
      ],
    },
    {
      namaAlbum: "Webinar DPP 2026",
      deskripsi: "Rekaman webinar nasional DPP GMKI.",
      tanggalKegiatan: new Date("2026-02-05"),
      coverMedia: "/galeri/video/webinar-thumb.webp",
      isPublic: true,
      media: [
        { tipeMedia: "VIDEO", urlMedia: "https://www.youtube.com/embed/example3", thumbnail: "/galeri/video/webinar-thumb.webp", keterangan: "Webinar Nasional DPP", durasi: "2:10:45", urutan: 1 },
      ],
    },
  ];

  //////////////////////////////////////////////////
  // INSERT
  //////////////////////////////////////////////////
  for (const a of albumList) {
    let album = await prisma.albumGaleri.findFirst({
      where: { namaAlbum: a.namaAlbum },
    });

    if (!album) {
      album = await prisma.albumGaleri.create({
        data: {
          namaAlbum: a.namaAlbum,
          deskripsi: a.deskripsi,
          tanggalKegiatan: a.tanggalKegiatan,
          coverMedia: a.coverMedia,
          isPublic: a.isPublic,
          statusAlbum: "ACTIVE",
          cabangUuid: cabangPusat?.uuid ?? null,
          newsUtamaUuid: null,
          
          insert_by: admin.uuid,
          update_by: admin.uuid,
        },
      });
    }

    //////////////////////////////////////////////////
    // MEDIA
    //////////////////////////////////////////////////
    for (const m of a.media) {
      const exists = await prisma.mediaGaleri.findFirst({
        where: {
          urlMedia: m.urlMedia,
          albumUuid: album.uuid,
        },
      });

      if (!exists) {
        await prisma.mediaGaleri.create({
          data: {
            tipeMedia: m.tipeMedia,
            urlMedia: m.urlMedia,
            thumbnail: m.thumbnail ?? null,
            keterangan: m.keterangan ?? null,
            durasi: m.durasi ?? null,
            urutan: m.urutan,
            albumUuid: album.uuid,
            insert_by: admin.uuid,
            update_by: admin.uuid,
          },
        });
      }
    }

    const fotoCount = a.media.filter(m => m.tipeMedia === "FOTO").length;
    const videoCount = a.media.filter(m => m.tipeMedia === "VIDEO").length;

    console.log(`  ✅ Album: ${a.namaAlbum} (${fotoCount} foto, ${videoCount} video)`);
  }

  console.log("✅ Galeri seeded (NEW MODEL)");
}

// ============================================================
// 5. PROGRAM KERJA + AGENDA + ARSIP
// ============================================================
async function seedProgram() {
  console.log("Seeding Program Kerja, Agenda, Arsip...");
  const admin = await getAdmin();

  const programList = [
    {
      namaProgram: "Penguatan Jaringan Senior GMKI",
      deskripsi: "Program untuk memperkuat jaringan komunikasi antar senior GMKI di seluruh Indonesia.",
      tujuan: "Meningkatkan solidaritas dan koordinasi antar cabang.",
      sasaran: "Seluruh senior GMKI aktif",
      bidang: "Bidang 3 - Komunikasi",
      tahun: 2026,
      thumbnail: "/program/jaringan.webp",
      agenda: [
        {
          namaAgenda: "Rapat Koordinasi Nasional DPP 2026",
          deskripsi: "Rapat koordinasi seluruh pengurus nasional dan perwakilan cabang.",
          tanggalMulai: new Date("2026-03-15T08:00:00Z"),
          tanggalSelesai: new Date("2026-03-16T17:00:00Z"),
          lokasi: "Grha Oikumene PGI, Jakarta",
          jenisKegiatan: "OFFLINE",
          statusAgenda: "UPCOMING",
          thumbnail: "/agenda/rakornas.webp",
          linkPendaftaran: null,
          arsip: [],
        },
        {
          namaAgenda: "Webinar Kepemimpinan Senior GMKI",
          deskripsi: "Webinar nasional tentang peran senior GMKI dalam pembangunan bangsa.",
          tanggalMulai: new Date("2026-04-20T09:00:00Z"),
          tanggalSelesai: new Date("2026-04-20T12:00:00Z"),
          lokasi: null,
          jenisKegiatan: "ONLINE",
          statusAgenda: "UPCOMING",
          thumbnail: "/agenda/webinar.webp",
          linkPendaftaran: "https://forms.dpp.id/webinar-april",
          arsip: [],
        },
      ],
    },
    {
      namaProgram: "Advokasi Papua dan Indonesia Timur",
      deskripsi: "Program advokasi untuk mendorong pembangunan yang berkeadilan di Papua dan wilayah timur Indonesia.",
      tujuan: "Meningkatkan perhatian dan aksi nyata terhadap wilayah timur Indonesia.",
      sasaran: "Pemerintah, komunitas Papua, senior GMKI",
      bidang: "Bidang 8 - Medan Pelayanan & Advokasi",
      tahun: 2026,
      thumbnail: "/program/papua.webp",
      agenda: [
        {
          namaAgenda: "Seminar Nasional: Membangun Papua Bermartabat",
          deskripsi: "Seminar yang membahas strategi pembangunan Papua yang menghormati martabat orang asli Papua.",
          tanggalMulai: new Date("2026-05-10T08:00:00Z"),
          tanggalSelesai: new Date("2026-05-10T17:00:00Z"),
          lokasi: "Universitas Cenderawasih, Jayapura",
          jenisKegiatan: "HYBRID",
          statusAgenda: "UPCOMING",
          thumbnail: "/agenda/seminar-papua.webp",
          linkPendaftaran: "https://forms.dpp.id/seminar-papua",
          arsip: [
            {
              judul: "Laporan Pra-Seminar Papua 2026",
              deskripsi: "Laporan persiapan dan latar belakang seminar Papua.",
              tanggalArsip: new Date("2026-04-30"),
              jenisArsip: "LAPORAN",
              fileUrl: "/arsip/laporan-pra-seminar-papua.pdf",
              isPublic: true,
            },
          ],
        },
      ],
    },
    {
      namaProgram: "Katalog Program Kerja DPP 2026",
      deskripsi: "Katalog lengkap seluruh program kerja DPP GMKI untuk tahun 2026.",
      tujuan: "Transparansi dan dokumentasi program kerja organisasi.",
      sasaran: "Seluruh anggota dan publik",
      bidang: "Sekretariat",
      tahun: 2026,
      thumbnail: "/program/katalog.webp",
      agenda: [],
    },
    {
      namaProgram: "Pembinaan Iman dan Spiritualitas Senior",
      deskripsi: "Program pembinaan rohani dan penguatan iman bagi seluruh senior GMKI.",
      tujuan: "Menjaga dan meningkatkan kualitas spiritual anggota DPP.",
      sasaran: "Seluruh anggota DPP",
      bidang: "Bidang 1 - Spiritualitas",
      tahun: 2026,
      thumbnail: "/program/rohani.webp",
      agenda: [
        {
          namaAgenda: "Retreat Rohani Senior GMKI 2026",
          deskripsi: "Retreat rohani 2 hari untuk penguatan iman dan persekutuan senior GMKI.",
          tanggalMulai: new Date("2026-06-05T14:00:00Z"),
          tanggalSelesai: new Date("2026-06-07T12:00:00Z"),
          lokasi: "Pusat Retreat Cisarua, Bogor",
          jenisKegiatan: "OFFLINE",
          statusAgenda: "UPCOMING",
          thumbnail: "/agenda/retreat.webp",
          linkPendaftaran: "https://forms.dpp.id/retreat-2026",
          arsip: [],
        },
      ],
    },
  ];

  for (const p of programList) {
    let program = await prisma.programKerja.findFirst({ where: { namaProgram: p.namaProgram, tahun: p.tahun } });
    if (!program) {
      program = await prisma.programKerja.create({
        data: {
          namaProgram: p.namaProgram,
          deskripsi: p.deskripsi,
          tujuan: p.tujuan,
          sasaran: p.sasaran,
          bidang: p.bidang,
          tahun: p.tahun,
          thumbnail: p.thumbnail,
          statusProgram: "AKTIF",
          insert_by: admin.uuid,
        },
      });
    }

    for (const a of p.agenda) {
      let agenda = await prisma.agendaKegiatan.findFirst({ where: { namaAgenda: a.namaAgenda, programUuid: program.uuid } });
      if (!agenda) {
        agenda = await prisma.agendaKegiatan.create({
          data: {
            namaAgenda: a.namaAgenda,
            deskripsi: a.deskripsi,
            tanggalMulai: a.tanggalMulai,
            tanggalSelesai: a.tanggalSelesai,
            lokasi: a.lokasi,
            jenisKegiatan: a.jenisKegiatan,
            statusAgenda: a.statusAgenda,
            thumbnail: a.thumbnail,
            linkPendaftaran: a.linkPendaftaran,
            programUuid: program.uuid,
            insert_by: admin.uuid,
          },
        });
      }

      for (const ar of a.arsip) {
        const arsipExists = await prisma.arsipKegiatan.findFirst({ where: { judul: ar.judul, agendaUuid: agenda.uuid } });
        if (!arsipExists) {
          await prisma.arsipKegiatan.create({
            data: {
              judul: ar.judul,
              deskripsi: ar.deskripsi,
              tanggalArsip: ar.tanggalArsip,
              jenisArsip: ar.jenisArsip,
              fileUrl: ar.fileUrl,
              isPublic: ar.isPublic,
              agendaUuid: agenda.uuid,
              insert_by: admin.uuid,
            },
          });
        }
      }
    }
    console.log(`  ✅ Program: ${p.namaProgram}`);
  }
  console.log("✅ Program Kerja seeded");
}

// ============================================================
// 7. KRITIK & SARAN
// ============================================================
async function seedKritikSaran() {
  console.log("Seeding FAQ & Form Pengaduan...");
  const admin = await getAdmin();

  const faqList = [
    {
      pertanyaan: "Apa itu DPP GMKI?",
      jawaban: "DPP (Perkumpulan Senior GMKI) adalah organisasi yang menghimpun para alumni dan senior GMKI (Gerakan Mahasiswa Kristen Indonesia) sebagai wadah untuk bersatu, berkolaborasi, dan memberikan kontribusi nyata bagi bangsa Indonesia.",
      kategori: "UMUM",
      urutan: 1,
      isPublish: true,
    },
    {
      pertanyaan: "Bagaimana cara mendaftar menjadi anggota DPP?",
      jawaban: "Pendaftaran anggota DPP dapat dilakukan melalui website resmi dengan mengisi formulir pendaftaran, kemudian akan diverifikasi oleh pengurus cabang (DPC) setempat dan mendapat persetujuan dari DPP Pusat.",
      kategori: "KEANGGOTAAN",
      urutan: 2,
      isPublish: true,
    },
    {
      pertanyaan: "Apa syarat menjadi anggota DPP GMKI?",
      jawaban: "Syarat utama adalah pernah menjadi anggota/pengurus aktif GMKI di tingkat komisariat atau cabang mana pun di Indonesia. Calon anggota wajib mengisi data diri secara lengkap dan disetujui oleh DPC dan DPP.",
      kategori: "KEANGGOTAAN",
      urutan: 3,
      isPublish: true,
    },
    {
      pertanyaan: "Apa itu The Grit Institut?",
      jawaban: "The Grit Institut adalah lembaga pendidikan dan pengembangan kapasitas di bawah naungan DPP GMKI yang menyediakan berbagai program edukasi, pelatihan kepemimpinan, kelas, dan workshop untuk pengembangan potensi anggota dan masyarakat.",
      kategori: "PROGRAM",
      urutan: 4,
      isPublish: true,
    },
    {
      pertanyaan: "Bagaimana cara mengikuti kelas di The Grit Institut?",
      jawaban: "Anda dapat mendaftarkan diri melalui halaman Daftar Kelas/Workshop di menu The Grit Institut. Isi formulir pendaftaran, kemudian tim kami akan menghubungi Anda dengan informasi lebih lanjut.",
      kategori: "PROGRAM",
      urutan: 5,
      isPublish: true,
    },
    {
      pertanyaan: "Di mana saya bisa menemukan informasi struktur organisasi DPP?",
      jawaban: "Struktur organisasi DPP dan DPC dapat ditemukan di menu Struktur Organisasi pada website ini. Tersedia informasi lengkap mengenai periode kepengurusan aktif beserta nama dan jabatan setiap pengurus.",
      kategori: "ORGANISASI",
      urutan: 6,
      isPublish: true,
    },
    {
      pertanyaan: "Bagaimana cara menyampaikan kritik atau saran?",
      jawaban: "Anda dapat menyampaikan kritik dan saran melalui Formulir Pengaduan yang tersedia di halaman Kritik & Saran. Setiap masukan akan ditinjau oleh tim kami dan mendapat tanggapan sesuai prosedur yang berlaku.",
      kategori: "UMUM",
      urutan: 7,
      isPublish: true,
    },
    {
      pertanyaan: "Apakah pengaduan dapat disampaikan secara anonim?",
      jawaban: "Ya, tersedia opsi untuk menyampaikan pengaduan secara anonim. Namun untuk keperluan tindak lanjut yang lebih baik, kami menyarankan agar identitas pelapor disertakan.",
      kategori: "UMUM",
      urutan: 8,
      isPublish: true,
    },
    {
      pertanyaan: "Apa saja program unggulan DPP GMKI periode 2025-2028?",
      jawaban: "Program unggulan meliputi: (1) Penguatan jaringan senior GMKI, (2) Advokasi Papua dan Indonesia Timur, (3) The Grit Institut untuk pengembangan kapasitas, (4) Program pembinaan iman dan spiritualitas, serta (5) Transformasi digital dan kemandirian dana.",
      kategori: "PROGRAM",
      urutan: 9,
      isPublish: true,
    },
    {
      pertanyaan: "Bagaimana cara menghubungi pengurus DPP?",
      jawaban: "Anda dapat menghubungi DPP melalui email pusat@dpp.id, WhatsApp di nomor 08123456789, atau melalui media sosial resmi kami di Instagram @dpp.gmki dan Facebook DPP GMKI.",
      kategori: "UMUM",
      urutan: 10,
      isPublish: true,
    },
  ];

  for (const faq of faqList) {
    const exists = await prisma.fAQ.findFirst({ where: { pertanyaan: faq.pertanyaan } });
    if (!exists) {
      await prisma.fAQ.create({ data: { ...faq, statusFAQ: "ACTIVE", insert_by: admin.uuid } });
    }
  }
  console.log(`  ✅ ${faqList.length} FAQ seeded`);

  const pengaduanList = [
    {
      namaPelapor: "Budi Santoso",
      emailPelapor: "budi.santoso@example.com",
      noWaPelapor: "081234567890",
      subjek: "Pertanyaan tentang pendaftaran anggota",
      isiBadan: "Saya ingin menanyakan lebih lanjut mengenai proses pendaftaran anggota DPP. Apakah ada batas waktu pendaftaran dan dokumen apa saja yang dibutuhkan?",
      kategoriAduan: "KEANGGOTAAN",
      statusPengaduan: "SELESAI",
      tanggapan: "Terima kasih atas pertanyaan Anda. Pendaftaran anggota DPP terbuka sepanjang tahun tanpa batas waktu. Dokumen yang diperlukan: foto profil, data angkatan GMKI, dan cabang asal. Silakan mengisi formulir di website kami.",
      tanggalTanggapan: new Date("2026-01-20"),
      isAnonymous: false,
    },
    {
      namaPelapor: "Anonim",
      emailPelapor: "anonim001@dpp.id",
      noWaPelapor: null,
      subjek: "Masukan untuk peningkatan website",
      isiBadan: "Website DPP sudah bagus, namun sebaiknya ditambahkan fitur pencarian anggota berdasarkan kota/cabang agar lebih mudah terhubung dengan sesama senior.",
      kategoriAduan: "UMUM",
      statusPengaduan: "DIPROSES",
      tanggapan: null,
      tanggalTanggapan: null,
      isAnonymous: true,
    },
    {
      namaPelapor: "Maria Sibarani",
      emailPelapor: "maria.sibarani@example.com",
      noWaPelapor: "082345678901",
      subjek: "Informasi kegiatan di wilayah Sumatera",
      isiBadan: "Saya senior GMKI dari Medan dan ingin mendapatkan informasi tentang kegiatan DPP di wilayah Sumatera. Apakah ada rencana kegiatan di Medan tahun 2026?",
      kategoriAduan: "ORGANISASI",
      statusPengaduan: "MASUK",
      tanggapan: null,
      tanggalTanggapan: null,
      isAnonymous: false,
    },
    {
      namaPelapor: "Anonim",
      emailPelapor: "anonim002@dpp.id",
      noWaPelapor: null,
      subjek: "Saran untuk program The Grit Institut",
      isiBadan: "Mohon agar The Grit Institut juga menyediakan kelas dalam format online agar dapat diikuti oleh anggota yang berada di luar Jawa.",
      kategoriAduan: "PROGRAM",
      statusPengaduan: "DIPROSES",
      tanggapan: "Terima kasih atas sarannya. Kami sedang mempertimbangkan untuk menambah lebih banyak kelas dalam format online dan hybrid.",
      tanggalTanggapan: new Date("2026-02-15"),
      isAnonymous: true,
    },
  ];

  for (const p of pengaduanList) {
    const exists = await prisma.formPengaduan.findFirst({ where: { emailPelapor: p.emailPelapor, subjek: p.subjek } });
    if (!exists) {
      await prisma.formPengaduan.create({ data: { ...p, insert_by: admin.uuid } });
    }
  }
  console.log(`  ✅ ${pengaduanList.length} Form Pengaduan seeded`);
  console.log("✅ Kritik & Saran seeded");
}

// ============================================================
// 8. THE GRIT INSTITUT
// ============================================================
async function seedDpdDpc() {
  console.log("Seeding DPP DPC...");
  const dppDpcDataPath = path.join(__dirname, "data/dpp_dpc.json");

  if (fs.existsSync(dppDpcDataPath)) {
    const raw = fs.readFileSync(dppDpcDataPath, "utf-8");
    const list: any[] = JSON.parse(raw);

    for (const item of list) {
      const existing = await prisma.dpdDpc.findFirst({
        where: {
          dpd: { equals: item.dpp, mode: "insensitive" },
          dpc: { equals: item.dpc, mode: "insensitive" },
        },
      });

      if (!existing) {
        const payload = { ...item, dpd: item.dpp };
        delete payload.dpp;
        await prisma.dpdDpc.create({ data: payload });
      } else {
        const payload = { ...item, dpd: item.dpp };
        delete payload.dpp;
        await prisma.dpdDpc.update({
          where: { id: existing.id },
          data: payload,
        });
      }
    }
    console.log(`✅ ${list.length} DPP DPC records seeded.`);
  } else {
    console.log("⚠️ dpp_dpc.json file not found, skipping.");
  }
}

async function seedDataMasterWilayah() {
  console.log("Seeding Data Master Wilayah...");
  const wilayahPath = path.join(__dirname, "data/master_wilayah_kabupaten.json");

  if (fs.existsSync(wilayahPath)) {
    const raw = fs.readFileSync(wilayahPath, "utf-8");
    const list: any[] = JSON.parse(raw);

    const count = await prisma.dataMasterWilayah.count();
    if (count === 0) {
      await prisma.dataMasterWilayah.createMany({
        data: list.map((w) => ({
          kode_provinsi: w.kode_provinsi,
          nama_provinsi: w.nama_provinsi,
          kode_kabupaten: w.kode_kabupaten,
          nama_kabupaten: w.nama_kabupaten,
        })),
        skipDuplicates: true,
      });
      console.log(`✅ ${list.length} Master Wilayah Kabupaten records seeded.`);
    } else {
      console.log(`✅ DataMasterWilayah already contains ${count} records.`);
    }
  } else {
    console.log("⚠️ master_wilayah_kabupaten.json file not found, skipping.");
  }
}

// ============================================================
// ENTRY POINT
// ============================================================
main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

async function seedDpd() {
  console.log("Seeding DPD from Data Master Wilayah...");
  const provinces = await prisma.dataMasterWilayah.findMany({
    distinct: ['kode_provinsi'],
    select: {
      kode_provinsi: true,
      nama_provinsi: true
    }
  });

  const definitifList = [
    "SUMATERA UTARA", "SUMATERA BARAT", "LAMPUNG", "RIAU", "KEPULAUAN RIAU", 
    "BANTEN", "JAWA BARAT", "DAERAH ISTIMEWA YOGYAKARTA", "JAWA TENGAH", "JAWA TIMUR", 
    "BALI", "NUSA TENGGARA TIMUR", "KALIMANTAN BARAT", "KALIMANTAN TIMUR", 
    "KALIMANTAN SELATAN", "KALIMANTAN UTARA", "KALIMANTAN TENGAH", 
    "SULAWESI UTARA", "SULAWESI TENGGARA", "SULAWESI SELATAN", "MALUKU", "MALUKU UTARA"
  ];

  let dpdCount = 0;
  for (const prov of provinces) {
    if (!prov.kode_provinsi || !prov.nama_provinsi) continue;
    
    const isDefinitif = definitifList.includes(prov.nama_provinsi.toUpperCase());

    const existingDpd = await prisma.dpd.findFirst({
      where: { kodeProvinsi: prov.kode_provinsi }
    });

    if (!existingDpd) {
      await prisma.dpd.create({
        data: {
          kodeProvinsi: prov.kode_provinsi,
          dpd: prov.nama_provinsi,
          pengurus: null,
          noHandphone: null,
          keterangan: isDefinitif ? "Definitif" : null,
          penerbitanSk: null
        }
      });
      dpdCount++;
    } else {
      await prisma.dpd.update({
        where: { id: existingDpd.id },
        data: {
          dpd: prov.nama_provinsi,
          keterangan: isDefinitif ? "Definitif" : null,
        }
      });
    }
  }
  console.log(`✅ ${dpdCount} DPD records seeded from DataMasterWilayah.`);
}
