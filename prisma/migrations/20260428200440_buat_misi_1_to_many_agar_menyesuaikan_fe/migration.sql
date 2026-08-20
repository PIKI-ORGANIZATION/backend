/*
  Warnings:

  - You are about to drop the column `misi` on the `Cabang` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Cabang" DROP COLUMN "misi";

-- CreateTable
CREATE TABLE "MisiCabang" (
    "uuid" UUID NOT NULL,
    "teks" TEXT NOT NULL,
    "cabang_uuid" UUID NOT NULL,
    "insert_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MisiCabang_pkey" PRIMARY KEY ("uuid")
);

-- AddForeignKey
ALTER TABLE "MisiCabang" ADD CONSTRAINT "MisiCabang_cabang_uuid_fkey" FOREIGN KEY ("cabang_uuid") REFERENCES "Cabang"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;
