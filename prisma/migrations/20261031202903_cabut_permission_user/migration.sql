-- Anggota (role USER) hanya mengakses data diri & KTA (/auth/me, /auth/profile,
-- /auth/change-password, /kta/download) yang cukup login, sehingga tidak butuh permission.
DELETE FROM "PermissionRole"
WHERE "roleUuid" IN (SELECT "uuid" FROM "Role" WHERE "namaRole" = 'USER');
