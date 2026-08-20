-- AlterTable
ALTER TABLE "AlbumGaleri" ADD COLUMN     "kelasUuid" UUID,
ADD COLUMN     "newsUtamaUuid" UUID;

-- AddForeignKey
ALTER TABLE "AlbumGaleri" ADD CONSTRAINT "AlbumGaleri_newsUtamaUuid_fkey" FOREIGN KEY ("newsUtamaUuid") REFERENCES "NewsUtama"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlbumGaleri" ADD CONSTRAINT "AlbumGaleri_kelasUuid_fkey" FOREIGN KEY ("kelasUuid") REFERENCES "Kelas"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;
