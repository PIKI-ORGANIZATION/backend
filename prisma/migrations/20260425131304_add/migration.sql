-- CreateEnum
CREATE TYPE "JenisProduk" AS ENUM ('JASA', 'PRODUK_FISIK');

-- CreateEnum
CREATE TYPE "StatusProduk" AS ENUM ('ACTIVE', 'INACTIVE', 'OUT_OF_STOCK');

-- CreateEnum
CREATE TYPE "StatusOrder" AS ENUM ('WAITING_PAYMENT', 'WAITING_CONFIRMATION', 'SENDING', 'SENT', 'COMPLETED', 'CANCELED');

-- CreateEnum
CREATE TYPE "StatusPembayaran" AS ENUM ('PENDING', 'PAID');

-- AlterTable
ALTER TABLE "Cabang" ADD COLUMN     "endTimeCountdown" TIMESTAMP(3),
ADD COLUMN     "headlineHomeHero" TEXT,
ADD COLUMN     "isCountdownActive" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "keteranganCountdown" TEXT,
ADD COLUMN     "titleHomeHero" TEXT,
ADD COLUMN     "urlBannerImg" TEXT;

-- CreateTable
CREATE TABLE "ProdukKategori" (
    "uuid" UUID NOT NULL,
    "namaKategori" TEXT NOT NULL,
    "tipeProduk" "JenisProduk" NOT NULL DEFAULT 'PRODUK_FISIK',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "ProdukKategori_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "Produk" (
    "uuid" UUID NOT NULL,
    "namaProduk" TEXT NOT NULL,
    "harga" DECIMAL(12,2) NOT NULL,
    "stok" INTEGER NOT NULL,
    "statusProduk" "StatusProduk" NOT NULL DEFAULT 'ACTIVE',
    "produkKategoriUuid" UUID NOT NULL,
    "seniorUuid" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "Produk_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "SpesifikasiProduk" (
    "uuid" UUID NOT NULL,
    "namaSpesifikasi" TEXT NOT NULL,
    "produkUuid" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SpesifikasiProduk_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "SpesifikasiProdukValue" (
    "uuid" UUID NOT NULL,
    "namaValue" TEXT NOT NULL,
    "spesifikasiUuid" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SpesifikasiProdukValue_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "KeranjangBelanja" (
    "uuid" UUID NOT NULL,
    "produkUuid" UUID NOT NULL,
    "akunUuid" UUID,
    "jumlah" INTEGER NOT NULL DEFAULT 1,
    "totalHarga" DECIMAL(12,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KeranjangBelanja_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "KeranjangSpesifikasi" (
    "uuid" UUID NOT NULL,
    "keranjangUuid" UUID NOT NULL,
    "spesifikasiUuid" UUID NOT NULL,
    "valueUuid" UUID NOT NULL,

    CONSTRAINT "KeranjangSpesifikasi_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "PengaturanPesanan" (
    "uuid" UUID NOT NULL,
    "pajakPesanan" JSONB NOT NULL,
    "pajakProdukPesanan" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PengaturanPesanan_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "Pesanan" (
    "uuid" UUID NOT NULL,
    "seniorUuid" UUID NOT NULL,
    "akunUuid" UUID,
    "namaPenerima" TEXT NOT NULL,
    "alamat" TEXT NOT NULL,
    "noHp" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "kodePos" TEXT NOT NULL,
    "kota" TEXT NOT NULL,
    "nomorResi" TEXT,
    "statusPesanan" "StatusOrder" NOT NULL,
    "statusBayar" "StatusPembayaran" NOT NULL,
    "nomorPembayaran" TEXT,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "diskonTotal" DECIMAL(12,2) NOT NULL,
    "pajakTotal" DECIMAL(12,2) NOT NULL,
    "total" DECIMAL(12,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pesanan_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "ProdukPesanan" (
    "uuid" UUID NOT NULL,
    "pesananUuid" UUID NOT NULL,
    "produkUuid" UUID NOT NULL,
    "jumlah" INTEGER NOT NULL,
    "harga" DECIMAL(12,2) NOT NULL,
    "diskon" DECIMAL(12,2) NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "pajakTotal" DECIMAL(12,2) NOT NULL,
    "total" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "ProdukPesanan_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "ProdukPesananSpesifikasi" (
    "uuid" UUID NOT NULL,
    "produkPesananUuid" UUID NOT NULL,
    "spesifikasiUuid" UUID NOT NULL,
    "valueUuid" UUID NOT NULL,
    "namaSpesifikasi" TEXT NOT NULL,
    "namaValue" TEXT NOT NULL,

    CONSTRAINT "ProdukPesananSpesifikasi_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "PajakPesanan" (
    "uuid" UUID NOT NULL,
    "pesananUuid" UUID NOT NULL,
    "nama" TEXT NOT NULL,
    "rasio" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "PajakPesanan_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "PajakProdukPesanan" (
    "uuid" UUID NOT NULL,
    "produkPesananUuid" UUID NOT NULL,
    "nama" TEXT NOT NULL,
    "rasio" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "PajakProdukPesanan_pkey" PRIMARY KEY ("uuid")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProdukKategori_namaKategori_key" ON "ProdukKategori"("namaKategori");

-- CreateIndex
CREATE UNIQUE INDEX "KeranjangBelanja_produkUuid_akunUuid_key" ON "KeranjangBelanja"("produkUuid", "akunUuid");

-- AddForeignKey
ALTER TABLE "Produk" ADD CONSTRAINT "Produk_produkKategoriUuid_fkey" FOREIGN KEY ("produkKategoriUuid") REFERENCES "ProdukKategori"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Produk" ADD CONSTRAINT "Produk_seniorUuid_fkey" FOREIGN KEY ("seniorUuid") REFERENCES "Senior"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpesifikasiProduk" ADD CONSTRAINT "SpesifikasiProduk_produkUuid_fkey" FOREIGN KEY ("produkUuid") REFERENCES "Produk"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpesifikasiProdukValue" ADD CONSTRAINT "SpesifikasiProdukValue_spesifikasiUuid_fkey" FOREIGN KEY ("spesifikasiUuid") REFERENCES "SpesifikasiProduk"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KeranjangBelanja" ADD CONSTRAINT "KeranjangBelanja_produkUuid_fkey" FOREIGN KEY ("produkUuid") REFERENCES "Produk"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KeranjangBelanja" ADD CONSTRAINT "KeranjangBelanja_akunUuid_fkey" FOREIGN KEY ("akunUuid") REFERENCES "Akun"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KeranjangSpesifikasi" ADD CONSTRAINT "KeranjangSpesifikasi_keranjangUuid_fkey" FOREIGN KEY ("keranjangUuid") REFERENCES "KeranjangBelanja"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KeranjangSpesifikasi" ADD CONSTRAINT "KeranjangSpesifikasi_spesifikasiUuid_fkey" FOREIGN KEY ("spesifikasiUuid") REFERENCES "SpesifikasiProduk"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KeranjangSpesifikasi" ADD CONSTRAINT "KeranjangSpesifikasi_valueUuid_fkey" FOREIGN KEY ("valueUuid") REFERENCES "SpesifikasiProdukValue"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pesanan" ADD CONSTRAINT "Pesanan_seniorUuid_fkey" FOREIGN KEY ("seniorUuid") REFERENCES "Senior"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pesanan" ADD CONSTRAINT "Pesanan_akunUuid_fkey" FOREIGN KEY ("akunUuid") REFERENCES "Akun"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProdukPesanan" ADD CONSTRAINT "ProdukPesanan_pesananUuid_fkey" FOREIGN KEY ("pesananUuid") REFERENCES "Pesanan"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProdukPesanan" ADD CONSTRAINT "ProdukPesanan_produkUuid_fkey" FOREIGN KEY ("produkUuid") REFERENCES "Produk"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProdukPesananSpesifikasi" ADD CONSTRAINT "ProdukPesananSpesifikasi_produkPesananUuid_fkey" FOREIGN KEY ("produkPesananUuid") REFERENCES "ProdukPesanan"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PajakPesanan" ADD CONSTRAINT "PajakPesanan_pesananUuid_fkey" FOREIGN KEY ("pesananUuid") REFERENCES "Pesanan"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PajakProdukPesanan" ADD CONSTRAINT "PajakProdukPesanan_produkPesananUuid_fkey" FOREIGN KEY ("produkPesananUuid") REFERENCES "ProdukPesanan"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;
