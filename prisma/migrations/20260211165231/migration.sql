/*
  Warnings:

  - A unique constraint covering the columns `[username]` on the table `Akun` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[namaRole]` on the table `Role` will be added. If there are existing duplicate values, this will fail.
  - The required column `username` was added to the `Akun` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- AlterTable
ALTER TABLE "Akun" ADD COLUMN     "username" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Akun_username_key" ON "Akun"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Role_namaRole_key" ON "Role"("namaRole");
