-- DropForeignKey
ALTER TABLE "StrukturOrganisasi" DROP CONSTRAINT "StrukturOrganisasi_anggotaUuid_fkey";

-- AlterTable
ALTER TABLE "StrukturOrganisasi" ALTER COLUMN "anggotaUuid" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "StrukturOrganisasi" ADD CONSTRAINT "StrukturOrganisasi_anggotaUuid_fkey" FOREIGN KEY ("anggotaUuid") REFERENCES "Anggota"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;
