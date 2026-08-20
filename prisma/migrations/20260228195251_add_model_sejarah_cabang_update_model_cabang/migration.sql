/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `Cabang` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `deskripsiCabang` to the `Cabang` table without a default value. This is not possible if the table is not empty.
  - Added the required column `email` to the `Cabang` table without a default value. This is not possible if the table is not empty.
  - Added the required column `facebook` to the `Cabang` table without a default value. This is not possible if the table is not empty.
  - Added the required column `instagram` to the `Cabang` table without a default value. This is not possible if the table is not empty.
  - Added the required column `misi` to the `Cabang` table without a default value. This is not possible if the table is not empty.
  - Added the required column `noWa` to the `Cabang` table without a default value. This is not possible if the table is not empty.
  - Added the required column `visi` to the `Cabang` table without a default value. This is not possible if the table is not empty.
  - Added the required column `youtube` to the `Cabang` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Cabang" ADD COLUMN     "deskripsiCabang" TEXT NOT NULL,
ADD COLUMN     "email" TEXT NOT NULL,
ADD COLUMN     "facebook" TEXT NOT NULL,
ADD COLUMN     "instagram" TEXT NOT NULL,
ADD COLUMN     "misi" TEXT NOT NULL,
ADD COLUMN     "noWa" TEXT NOT NULL,
ADD COLUMN     "visi" TEXT NOT NULL,
ADD COLUMN     "youtube" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "SejarahCabang" (
    "uuid" UUID NOT NULL,
    "timeline" TEXT NOT NULL,
    "deskripsiTimeline" TEXT NOT NULL,
    "cabang_uuid" UUID NOT NULL,
    "insert_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "insert_by" UUID,
    "update_at" TIMESTAMP(3) NOT NULL,
    "update_by" UUID,

    CONSTRAINT "SejarahCabang_pkey" PRIMARY KEY ("uuid")
);

-- CreateIndex
CREATE UNIQUE INDEX "Cabang_email_key" ON "Cabang"("email");

-- AddForeignKey
ALTER TABLE "SejarahCabang" ADD CONSTRAINT "SejarahCabang_cabang_uuid_fkey" FOREIGN KEY ("cabang_uuid") REFERENCES "Cabang"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;
