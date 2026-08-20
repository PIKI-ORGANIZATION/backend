/*
  Warnings:

  - You are about to drop the column `bidangMinat` on the `Senior` table. All the data in the column will be lost.
  - You are about to drop the column `bidangStudi` on the `Senior` table. All the data in the column will be lost.
  - You are about to drop the column `pekerjaan` on the `Senior` table. All the data in the column will be lost.
  - You are about to drop the column `pendidikan` on the `Senior` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Senior" DROP COLUMN "bidangMinat",
DROP COLUMN "bidangStudi",
DROP COLUMN "pekerjaan",
DROP COLUMN "pendidikan";
