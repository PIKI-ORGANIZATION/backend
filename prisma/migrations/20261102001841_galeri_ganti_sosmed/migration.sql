-- Modul Galeri (foto, video YouTube/upload, post Instagram) menggantikan modul Sosmed.
-- Tabel sosmed belum pernah dipakai di production, sehingga aman dihapus.

-- DropTable
DROP TABLE IF EXISTS "sosmed";

-- CreateTable
CREATE TABLE "galeri" (
    "id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "deskripsi" TEXT,
    "url" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "embedUrl" TEXT,
    "kontenId" TEXT,
    "kategoriKegiatan" TEXT,
    "tanggal" DATE,
    "lokasi" TEXT,
    "duration" TEXT,
    "penempatan" TEXT[] DEFAULT ARRAY['GALERI']::TEXT[],
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "urutan" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "published_at" TIMESTAMP(3),
    "published_by" UUID,
    "deleted_at" TIMESTAMP(3),
    "deleted_by" UUID,
    "insert_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "insert_by" UUID,
    "update_at" TIMESTAMP(3) NOT NULL,
    "update_by" UUID,

    CONSTRAINT "galeri_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "galeri_type_status_idx" ON "galeri"("type", "status");


-- Permission SOSMED_MANAGE diganti nama menjadi GALERI_MANAGE (tautan ke role tetap)
UPDATE "Permission"
SET "namaPermission" = 'GALERI_MANAGE',
    "deskripsi" = 'Mengelola CMS Galeri (foto, video, Instagram)',
    "update_at" = NOW()
WHERE "namaPermission" = 'SOSMED_MANAGE'
  AND NOT EXISTS (SELECT 1 FROM "Permission" WHERE "namaPermission" = 'GALERI_MANAGE');

-- Jaga-jaga jika SOSMED_MANAGE tidak ada: buat GALERI_MANAGE & tautkan ke role pengelola
INSERT INTO "Permission" ("uuid", "namaPermission", "deskripsi", "statusPermission", "insert_at", "update_at")
VALUES (gen_random_uuid(), 'GALERI_MANAGE', 'Mengelola CMS Galeri (foto, video, Instagram)', 'ACTIVE', NOW(), NOW())
ON CONFLICT ("namaPermission") DO NOTHING;

INSERT INTO "PermissionRole" ("uuid", "permissionUuid", "roleUuid", "insert_at", "update_at")
SELECT gen_random_uuid(), p."uuid", r."uuid", NOW(), NOW()
FROM "Permission" p
CROSS JOIN "Role" r
WHERE p."namaPermission" = 'GALERI_MANAGE'
  AND r."namaRole" IN ('SUPER_ADMIN', 'ADMIN_CABANG', 'KETUA_CABANG')
ON CONFLICT ("permissionUuid", "roleUuid") DO NOTHING;

-- Bersihkan SOSMED_MANAGE yang tersisa (jika GALERI_MANAGE sudah ada sebelumnya)
DELETE FROM "PermissionRole" WHERE "permissionUuid" IN (SELECT "uuid" FROM "Permission" WHERE "namaPermission" = 'SOSMED_MANAGE');
DELETE FROM "Permission" WHERE "namaPermission" = 'SOSMED_MANAGE';
