-- Akses CMS Sejarah PIKI & Sosmed untuk DPP (SUPER_ADMIN), ADMIN_CABANG, dan KETUA_CABANG.
-- Role USER tidak diberi akses. Aman dijalankan ulang (ON CONFLICT DO NOTHING).

INSERT INTO "Permission" ("uuid", "namaPermission", "deskripsi", "statusPermission", "insert_at", "update_at")
VALUES
  (gen_random_uuid(), 'SEJARAH_MANAGE', 'Mengelola CMS Sejarah PIKI', 'ACTIVE', NOW(), NOW()),
  (gen_random_uuid(), 'SOSMED_MANAGE', 'Mengelola CMS konten sosmed (Instagram & YouTube)', 'ACTIVE', NOW(), NOW())
ON CONFLICT ("namaPermission") DO NOTHING;

INSERT INTO "PermissionRole" ("uuid", "permissionUuid", "roleUuid", "insert_at", "update_at")
SELECT gen_random_uuid(), p."uuid", r."uuid", NOW(), NOW()
FROM "Permission" p
CROSS JOIN "Role" r
WHERE p."namaPermission" IN ('SEJARAH_MANAGE', 'SOSMED_MANAGE')
  AND r."namaRole" IN ('SUPER_ADMIN', 'ADMIN_CABANG', 'KETUA_CABANG')
ON CONFLICT ("permissionUuid", "roleUuid") DO NOTHING;
