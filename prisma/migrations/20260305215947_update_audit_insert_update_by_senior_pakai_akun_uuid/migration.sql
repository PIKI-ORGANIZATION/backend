-- DropForeignKey
ALTER TABLE "Senior" DROP CONSTRAINT "Senior_insert_by_fkey";

-- DropForeignKey
ALTER TABLE "Senior" DROP CONSTRAINT "Senior_update_by_fkey";

-- AddForeignKey
ALTER TABLE "Senior" ADD CONSTRAINT "Senior_insert_by_fkey" FOREIGN KEY ("insert_by") REFERENCES "Akun"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Senior" ADD CONSTRAINT "Senior_update_by_fkey" FOREIGN KEY ("update_by") REFERENCES "Akun"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;
