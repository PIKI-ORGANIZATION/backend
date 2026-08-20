/*
  Warnings:

  - A unique constraint covering the columns `[emailVerifyToken]` on the table `Akun` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Akun" ADD COLUMN     "emailVerifyExpiry" TIMESTAMP(3),
ADD COLUMN     "emailVerifyToken" TEXT,
ALTER COLUMN "statusAkun" SET DEFAULT 'PENDING_VERIFICATION';

-- CreateIndex
CREATE UNIQUE INDEX "Akun_emailVerifyToken_key" ON "Akun"("emailVerifyToken");
