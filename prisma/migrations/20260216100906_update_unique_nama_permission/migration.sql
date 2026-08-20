/*
  Warnings:

  - A unique constraint covering the columns `[namaPermission]` on the table `Permission` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Permission_namaPermission_key" ON "Permission"("namaPermission");
