-- AlterTable
ALTER TABLE "Senior" ADD COLUMN     "approvedAtPCPS" TIMESTAMP(3),
ADD COLUMN     "approvedAtPNPS" TIMESTAMP(3),
ADD COLUMN     "approvedByPCPSUuid" UUID,
ADD COLUMN     "approvedByPNPSUuid" UUID;

-- AddForeignKey
ALTER TABLE "Senior" ADD CONSTRAINT "Senior_approvedByPCPSUuid_fkey" FOREIGN KEY ("approvedByPCPSUuid") REFERENCES "Senior"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Senior" ADD CONSTRAINT "Senior_approvedByPNPSUuid_fkey" FOREIGN KEY ("approvedByPNPSUuid") REFERENCES "Senior"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;
