-- CreateTable
CREATE TABLE "Akun" (
    "uuid" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "statusAkun" TEXT NOT NULL,
    "lastLogin" TIMESTAMP(3),
    "ipLogin" TEXT,
    "namaLengkap" TEXT,
    "namaPanggil" TEXT,
    "bio" TEXT,
    "asalCabang" TEXT,
    "angkatan" TEXT,
    "jabatan" TEXT,
    "bidangStudi" TEXT,
    "bidangMinat" TEXT,
    "profileImg" TEXT,
    "noWa" TEXT,
    "instagram" TEXT,
    "facebook" TEXT,
    "insert_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "insert_by" UUID,
    "update_at" TIMESTAMP(3) NOT NULL,
    "update_by" UUID,

    CONSTRAINT "Akun_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "Role" (
    "uuid" UUID NOT NULL,
    "namaRole" TEXT NOT NULL,
    "deskripsi" TEXT,
    "statusRole" TEXT NOT NULL,
    "insert_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "insert_by" UUID,
    "update_at" TIMESTAMP(3) NOT NULL,
    "update_by" UUID,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "Permission" (
    "uuid" UUID NOT NULL,
    "listPermission" TEXT NOT NULL,
    "deskripsi" TEXT,
    "modul" TEXT NOT NULL,
    "statusPermission" TEXT NOT NULL,
    "insert_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "insert_by" UUID,
    "update_at" TIMESTAMP(3) NOT NULL,
    "update_by" UUID,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "AkunRole" (
    "uuid" UUID NOT NULL,
    "akunUuid" UUID NOT NULL,
    "roleUuid" UUID NOT NULL,
    "insert_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "insert_by" UUID,
    "update_at" TIMESTAMP(3) NOT NULL,
    "update_by" UUID,

    CONSTRAINT "AkunRole_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "PermissionRole" (
    "uuid" UUID NOT NULL,
    "permissionUuid" UUID NOT NULL,
    "roleUuid" UUID NOT NULL,
    "insert_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "insert_by" UUID,
    "update_at" TIMESTAMP(3) NOT NULL,
    "update_by" UUID,

    CONSTRAINT "PermissionRole_pkey" PRIMARY KEY ("uuid")
);

-- CreateIndex
CREATE UNIQUE INDEX "Akun_email_key" ON "Akun"("email");

-- CreateIndex
CREATE UNIQUE INDEX "AkunRole_akunUuid_roleUuid_key" ON "AkunRole"("akunUuid", "roleUuid");

-- CreateIndex
CREATE UNIQUE INDEX "PermissionRole_permissionUuid_roleUuid_key" ON "PermissionRole"("permissionUuid", "roleUuid");

-- AddForeignKey
ALTER TABLE "Akun" ADD CONSTRAINT "Akun_insert_by_fkey" FOREIGN KEY ("insert_by") REFERENCES "Akun"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Akun" ADD CONSTRAINT "Akun_update_by_fkey" FOREIGN KEY ("update_by") REFERENCES "Akun"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AkunRole" ADD CONSTRAINT "AkunRole_akunUuid_fkey" FOREIGN KEY ("akunUuid") REFERENCES "Akun"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AkunRole" ADD CONSTRAINT "AkunRole_roleUuid_fkey" FOREIGN KEY ("roleUuid") REFERENCES "Role"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PermissionRole" ADD CONSTRAINT "PermissionRole_permissionUuid_fkey" FOREIGN KEY ("permissionUuid") REFERENCES "Permission"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PermissionRole" ADD CONSTRAINT "PermissionRole_roleUuid_fkey" FOREIGN KEY ("roleUuid") REFERENCES "Role"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;
