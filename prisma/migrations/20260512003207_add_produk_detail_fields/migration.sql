-- AlterTable
ALTER TABLE "Produk" ADD COLUMN     "deskripsi" TEXT,
ADD COLUMN     "diskonPersen" INTEGER DEFAULT 0,
ADD COLUMN     "gambarProduk" TEXT,
ADD COLUMN     "hargaAsli" DECIMAL(12,5);
