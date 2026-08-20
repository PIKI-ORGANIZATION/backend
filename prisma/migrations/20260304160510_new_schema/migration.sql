-- CreateTable
CREATE TABLE "PeriodeKepengurusan" (
    "uuid" UUID NOT NULL,
    "namaperiode" TEXT NOT NULL,
    "tahunMulai" INTEGER NOT NULL,
    "tahunSelesai" INTEGER NOT NULL,
    "isAktif" BOOLEAN NOT NULL DEFAULT false,
    "tipeOrganisasi" TEXT NOT NULL,
    "insert_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "insert_by" UUID,
    "update_at" TIMESTAMP(3) NOT NULL,
    "update_by" UUID,

    CONSTRAINT "PeriodeKepengurusan_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "StrukturOrganisasi" (
    "uuid" UUID NOT NULL,
    "periodeUuid" UUID NOT NULL,
    "seniorUuid" UUID NOT NULL,
    "namaJabatan" TEXT NOT NULL,
    "bidang" TEXT,
    "urutan" INTEGER NOT NULL DEFAULT 0,
    "tipeJabatan" TEXT NOT NULL DEFAULT 'ANGGOTA',
    "asalCabang" TEXT,
    "insert_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "insert_by" UUID,
    "update_at" TIMESTAMP(3) NOT NULL,
    "update_by" UUID,

    CONSTRAINT "StrukturOrganisasi_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "ProgramKerja" (
    "uuid" UUID NOT NULL,
    "namaProgram" TEXT NOT NULL,
    "deskripsi" TEXT,
    "tujuan" TEXT,
    "sasaran" TEXT,
    "bidang" TEXT,
    "statusProgram" TEXT NOT NULL DEFAULT 'AKTIF',
    "tahun" INTEGER NOT NULL,
    "thumbnail" TEXT,
    "insert_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "insert_by" UUID,
    "update_at" TIMESTAMP(3) NOT NULL,
    "update_by" UUID,

    CONSTRAINT "ProgramKerja_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "AgendaKegiatan" (
    "uuid" UUID NOT NULL,
    "namaAgenda" TEXT NOT NULL,
    "deskripsi" TEXT,
    "tanggalMulai" TIMESTAMP(3) NOT NULL,
    "tanggalSelesai" TIMESTAMP(3),
    "lokasi" TEXT,
    "jenisKegiatan" TEXT NOT NULL DEFAULT 'OFFLINE',
    "statusAgenda" TEXT NOT NULL DEFAULT 'UPCOMING',
    "thumbnail" TEXT,
    "linkPendaftaran" TEXT,
    "programUuid" UUID,
    "insert_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "insert_by" UUID,
    "update_at" TIMESTAMP(3) NOT NULL,
    "update_by" UUID,

    CONSTRAINT "AgendaKegiatan_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "ArsipKegiatan" (
    "uuid" UUID NOT NULL,
    "judul" TEXT NOT NULL,
    "deskripsi" TEXT,
    "tanggalArsip" TIMESTAMP(3) NOT NULL,
    "jenisArsip" TEXT NOT NULL DEFAULT 'LAPORAN',
    "fileUrl" TEXT,
    "thumbnail" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "agendaUuid" UUID,
    "insert_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "insert_by" UUID,
    "update_at" TIMESTAMP(3) NOT NULL,
    "update_by" UUID,

    CONSTRAINT "ArsipKegiatan_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "AlbumFoto" (
    "uuid" UUID NOT NULL,
    "namaAlbum" TEXT NOT NULL,
    "deskripsi" TEXT,
    "tanggal" TIMESTAMP(3) NOT NULL,
    "coverFoto" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "statusAlbum" TEXT NOT NULL DEFAULT 'ACTIVE',
    "insert_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "insert_by" UUID,
    "update_at" TIMESTAMP(3) NOT NULL,
    "update_by" UUID,

    CONSTRAINT "AlbumFoto_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "FotoKegiatan" (
    "uuid" UUID NOT NULL,
    "urlFoto" TEXT NOT NULL,
    "keterangan" TEXT,
    "urutan" INTEGER NOT NULL DEFAULT 0,
    "albumUuid" UUID NOT NULL,
    "insert_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "insert_by" UUID,
    "update_at" TIMESTAMP(3) NOT NULL,
    "update_by" UUID,

    CONSTRAINT "FotoKegiatan_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "VideoDocumentasi" (
    "uuid" UUID NOT NULL,
    "judul" TEXT NOT NULL,
    "deskripsi" TEXT,
    "urlVideo" TEXT NOT NULL,
    "thumbnail" TEXT,
    "tanggal" TIMESTAMP(3) NOT NULL,
    "durasi" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "statusVideo" TEXT NOT NULL DEFAULT 'ACTIVE',
    "insert_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "insert_by" UUID,
    "update_at" TIMESTAMP(3) NOT NULL,
    "update_by" UUID,

    CONSTRAINT "VideoDocumentasi_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "FormPengaduan" (
    "uuid" UUID NOT NULL,
    "namaPelapor" TEXT NOT NULL,
    "emailPelapor" TEXT NOT NULL,
    "noWaPelapor" TEXT,
    "subjek" TEXT NOT NULL,
    "isiBadan" TEXT NOT NULL,
    "kategoriAduan" TEXT NOT NULL DEFAULT 'UMUM',
    "statusPengaduan" TEXT NOT NULL DEFAULT 'MASUK',
    "tanggapan" TEXT,
    "tanggalTanggapan" TIMESTAMP(3),
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "insert_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "insert_by" UUID,
    "update_at" TIMESTAMP(3) NOT NULL,
    "update_by" UUID,

    CONSTRAINT "FormPengaduan_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "FAQ" (
    "uuid" UUID NOT NULL,
    "pertanyaan" TEXT NOT NULL,
    "jawaban" TEXT NOT NULL,
    "kategori" TEXT NOT NULL DEFAULT 'UMUM',
    "urutan" INTEGER NOT NULL DEFAULT 0,
    "isPublish" BOOLEAN NOT NULL DEFAULT true,
    "statusFAQ" TEXT NOT NULL DEFAULT 'ACTIVE',
    "insert_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "insert_by" UUID,
    "update_at" TIMESTAMP(3) NOT NULL,
    "update_by" UUID,

    CONSTRAINT "FAQ_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "LayananEdukasi" (
    "uuid" UUID NOT NULL,
    "namaLayanan" TEXT NOT NULL,
    "deskripsi" TEXT,
    "kurikulum" TEXT,
    "tujuan" TEXT,
    "targetPeserta" TEXT,
    "thumbnail" TEXT,
    "statusLayanan" TEXT NOT NULL DEFAULT 'ACTIVE',
    "insert_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "insert_by" UUID,
    "update_at" TIMESTAMP(3) NOT NULL,
    "update_by" UUID,

    CONSTRAINT "LayananEdukasi_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "Mentor" (
    "uuid" UUID NOT NULL,
    "namaLengkap" TEXT NOT NULL,
    "namaPanggil" TEXT,
    "bio" TEXT,
    "keahlian" TEXT,
    "pendidikan" TEXT,
    "pengalaman" TEXT,
    "profileImg" TEXT,
    "instagram" TEXT,
    "linkedin" TEXT,
    "email" TEXT,
    "statusMentor" TEXT NOT NULL DEFAULT 'ACTIVE',
    "insert_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "insert_by" UUID,
    "update_at" TIMESTAMP(3) NOT NULL,
    "update_by" UUID,

    CONSTRAINT "Mentor_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "Kelas" (
    "uuid" UUID NOT NULL,
    "namaKelas" TEXT NOT NULL,
    "deskripsi" TEXT,
    "jenisKelas" TEXT NOT NULL DEFAULT 'WORKSHOP',
    "metodePembelajaran" TEXT NOT NULL DEFAULT 'OFFLINE',
    "tanggalMulai" TIMESTAMP(3) NOT NULL,
    "tanggalSelesai" TIMESTAMP(3),
    "lokasi" TEXT,
    "linkOnline" TEXT,
    "harga" DECIMAL(12,2),
    "maxPeserta" INTEGER,
    "thumbnail" TEXT,
    "statusKelas" TEXT NOT NULL DEFAULT 'UPCOMING',
    "layananUuid" UUID,
    "mentorUuid" UUID,
    "insert_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "insert_by" UUID,
    "update_at" TIMESTAMP(3) NOT NULL,
    "update_by" UUID,

    CONSTRAINT "Kelas_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "PendaftaranKelas" (
    "uuid" UUID NOT NULL,
    "kelasUuid" UUID NOT NULL,
    "namaPeserta" TEXT NOT NULL,
    "emailPeserta" TEXT NOT NULL,
    "noWaPeserta" TEXT,
    "statusPendaftaran" TEXT NOT NULL DEFAULT 'PENDING',
    "catatanPeserta" TEXT,
    "tanggalDaftar" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "insert_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "insert_by" UUID,
    "update_at" TIMESTAMP(3) NOT NULL,
    "update_by" UUID,

    CONSTRAINT "PendaftaranKelas_pkey" PRIMARY KEY ("uuid")
);

-- CreateIndex
CREATE UNIQUE INDEX "PendaftaranKelas_kelasUuid_emailPeserta_key" ON "PendaftaranKelas"("kelasUuid", "emailPeserta");

-- AddForeignKey
ALTER TABLE "StrukturOrganisasi" ADD CONSTRAINT "StrukturOrganisasi_periodeUuid_fkey" FOREIGN KEY ("periodeUuid") REFERENCES "PeriodeKepengurusan"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StrukturOrganisasi" ADD CONSTRAINT "StrukturOrganisasi_seniorUuid_fkey" FOREIGN KEY ("seniorUuid") REFERENCES "Senior"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramKerja" ADD CONSTRAINT "ProgramKerja_insert_by_fkey" FOREIGN KEY ("insert_by") REFERENCES "Akun"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgendaKegiatan" ADD CONSTRAINT "AgendaKegiatan_programUuid_fkey" FOREIGN KEY ("programUuid") REFERENCES "ProgramKerja"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgendaKegiatan" ADD CONSTRAINT "AgendaKegiatan_insert_by_fkey" FOREIGN KEY ("insert_by") REFERENCES "Akun"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArsipKegiatan" ADD CONSTRAINT "ArsipKegiatan_agendaUuid_fkey" FOREIGN KEY ("agendaUuid") REFERENCES "AgendaKegiatan"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArsipKegiatan" ADD CONSTRAINT "ArsipKegiatan_insert_by_fkey" FOREIGN KEY ("insert_by") REFERENCES "Akun"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlbumFoto" ADD CONSTRAINT "AlbumFoto_insert_by_fkey" FOREIGN KEY ("insert_by") REFERENCES "Akun"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FotoKegiatan" ADD CONSTRAINT "FotoKegiatan_albumUuid_fkey" FOREIGN KEY ("albumUuid") REFERENCES "AlbumFoto"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoDocumentasi" ADD CONSTRAINT "VideoDocumentasi_insert_by_fkey" FOREIGN KEY ("insert_by") REFERENCES "Akun"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormPengaduan" ADD CONSTRAINT "FormPengaduan_insert_by_fkey" FOREIGN KEY ("insert_by") REFERENCES "Akun"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FAQ" ADD CONSTRAINT "FAQ_insert_by_fkey" FOREIGN KEY ("insert_by") REFERENCES "Akun"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LayananEdukasi" ADD CONSTRAINT "LayananEdukasi_insert_by_fkey" FOREIGN KEY ("insert_by") REFERENCES "Akun"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mentor" ADD CONSTRAINT "Mentor_insert_by_fkey" FOREIGN KEY ("insert_by") REFERENCES "Akun"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Kelas" ADD CONSTRAINT "Kelas_layananUuid_fkey" FOREIGN KEY ("layananUuid") REFERENCES "LayananEdukasi"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Kelas" ADD CONSTRAINT "Kelas_mentorUuid_fkey" FOREIGN KEY ("mentorUuid") REFERENCES "Mentor"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Kelas" ADD CONSTRAINT "Kelas_insert_by_fkey" FOREIGN KEY ("insert_by") REFERENCES "Akun"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PendaftaranKelas" ADD CONSTRAINT "PendaftaranKelas_kelasUuid_fkey" FOREIGN KEY ("kelasUuid") REFERENCES "Kelas"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;
