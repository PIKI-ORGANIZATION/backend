-- DropForeignKey
ALTER TABLE "Akun" DROP CONSTRAINT "Akun_seniorUuid_fkey";

-- AlterTable
ALTER TABLE "registrasi" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "registrasi_log" ALTER COLUMN "id" DROP DEFAULT;

-- AddForeignKey
ALTER TABLE "Akun" ADD CONSTRAINT "Akun_seniorUuid_fkey" FOREIGN KEY ("seniorUuid") REFERENCES "Senior"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;
