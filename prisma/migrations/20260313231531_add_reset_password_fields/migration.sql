/*
  Warnings:

  - A unique constraint covering the columns `[resetPasswordToken]` on the table `Akun` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Akun" ADD COLUMN     "resetPasswordExpiry" TIMESTAMP(3),
ADD COLUMN     "resetPasswordToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Akun_resetPasswordToken_key" ON "Akun"("resetPasswordToken");
