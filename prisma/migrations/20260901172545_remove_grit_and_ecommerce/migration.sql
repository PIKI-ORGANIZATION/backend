/*
  Warnings:

  - You are about to drop the column `kelasUuid` on the `AlbumGaleri` table. All the data in the column will be lost.
  - You are about to drop the column `kelasUuid` on the `NewsUtama` table. All the data in the column will be lost.
  - You are about to drop the `Kelas` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `KelasMentor` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `KelasTopikEdukasi` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `KeranjangBelanja` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `KeranjangSpesifikasi` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Mentor` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PajakPesanan` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PajakProdukPesanan` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Pembayaran` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PendaftaranKelas` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PengaturanPesanan` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Pesanan` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Produk` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProdukKategori` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProdukPesanan` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProdukPesananSpesifikasi` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SpesifikasiProduk` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SpesifikasiProdukValue` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TopikEdukasi` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UlasanProduk` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "AlbumGaleri" DROP CONSTRAINT "AlbumGaleri_kelasUuid_fkey";

-- DropForeignKey
ALTER TABLE "Kelas" DROP CONSTRAINT "Kelas_insert_by_fkey";

-- DropForeignKey
ALTER TABLE "KelasMentor" DROP CONSTRAINT "KelasMentor_kelasUuid_fkey";

-- DropForeignKey
ALTER TABLE "KelasMentor" DROP CONSTRAINT "KelasMentor_mentorUuid_fkey";

-- DropForeignKey
ALTER TABLE "KelasTopikEdukasi" DROP CONSTRAINT "KelasTopikEdukasi_kelasUuid_fkey";

-- DropForeignKey
ALTER TABLE "KelasTopikEdukasi" DROP CONSTRAINT "KelasTopikEdukasi_topikEdukasiUuid_fkey";

-- DropForeignKey
ALTER TABLE "KeranjangBelanja" DROP CONSTRAINT "KeranjangBelanja_akunUuid_fkey";

-- DropForeignKey
ALTER TABLE "KeranjangBelanja" DROP CONSTRAINT "KeranjangBelanja_produkUuid_fkey";

-- DropForeignKey
ALTER TABLE "KeranjangSpesifikasi" DROP CONSTRAINT "KeranjangSpesifikasi_keranjangUuid_fkey";

-- DropForeignKey
ALTER TABLE "KeranjangSpesifikasi" DROP CONSTRAINT "KeranjangSpesifikasi_spesifikasiUuid_fkey";

-- DropForeignKey
ALTER TABLE "KeranjangSpesifikasi" DROP CONSTRAINT "KeranjangSpesifikasi_valueUuid_fkey";

-- DropForeignKey
ALTER TABLE "Mentor" DROP CONSTRAINT "Mentor_insert_by_fkey";

-- DropForeignKey
ALTER TABLE "NewsUtama" DROP CONSTRAINT "NewsUtama_kelasUuid_fkey";

-- DropForeignKey
ALTER TABLE "PajakPesanan" DROP CONSTRAINT "PajakPesanan_pesananUuid_fkey";

-- DropForeignKey
ALTER TABLE "PajakProdukPesanan" DROP CONSTRAINT "PajakProdukPesanan_produkPesananUuid_fkey";

-- DropForeignKey
ALTER TABLE "Pembayaran" DROP CONSTRAINT "Pembayaran_pesananUuid_fkey";

-- DropForeignKey
ALTER TABLE "PendaftaranKelas" DROP CONSTRAINT "PendaftaranKelas_kelasUuid_fkey";

-- DropForeignKey
ALTER TABLE "Pesanan" DROP CONSTRAINT "Pesanan_akunUuid_fkey";

-- DropForeignKey
ALTER TABLE "Pesanan" DROP CONSTRAINT "Pesanan_seniorUuid_fkey";

-- DropForeignKey
ALTER TABLE "Produk" DROP CONSTRAINT "Produk_produkKategoriUuid_fkey";

-- DropForeignKey
ALTER TABLE "Produk" DROP CONSTRAINT "Produk_seniorUuid_fkey";

-- DropForeignKey
ALTER TABLE "ProdukPesanan" DROP CONSTRAINT "ProdukPesanan_pesananUuid_fkey";

-- DropForeignKey
ALTER TABLE "ProdukPesanan" DROP CONSTRAINT "ProdukPesanan_produkUuid_fkey";

-- DropForeignKey
ALTER TABLE "ProdukPesananSpesifikasi" DROP CONSTRAINT "ProdukPesananSpesifikasi_produkPesananUuid_fkey";

-- DropForeignKey
ALTER TABLE "SpesifikasiProduk" DROP CONSTRAINT "SpesifikasiProduk_produkUuid_fkey";

-- DropForeignKey
ALTER TABLE "SpesifikasiProdukValue" DROP CONSTRAINT "SpesifikasiProdukValue_spesifikasiUuid_fkey";

-- DropForeignKey
ALTER TABLE "TopikEdukasi" DROP CONSTRAINT "TopikEdukasi_insert_by_fkey";

-- DropForeignKey
ALTER TABLE "UlasanProduk" DROP CONSTRAINT "UlasanProduk_akunUuid_fkey";

-- DropForeignKey
ALTER TABLE "UlasanProduk" DROP CONSTRAINT "UlasanProduk_produkPesananUuid_fkey";

-- DropIndex
DROP INDEX "NewsUtama_kelasUuid_key";

-- AlterTable
ALTER TABLE "AlbumGaleri" DROP COLUMN "kelasUuid";

-- AlterTable
ALTER TABLE "NewsUtama" DROP COLUMN "kelasUuid";

-- DropTable
DROP TABLE "Kelas";

-- DropTable
DROP TABLE "KelasMentor";

-- DropTable
DROP TABLE "KelasTopikEdukasi";

-- DropTable
DROP TABLE "KeranjangBelanja";

-- DropTable
DROP TABLE "KeranjangSpesifikasi";

-- DropTable
DROP TABLE "Mentor";

-- DropTable
DROP TABLE "PajakPesanan";

-- DropTable
DROP TABLE "PajakProdukPesanan";

-- DropTable
DROP TABLE "Pembayaran";

-- DropTable
DROP TABLE "PendaftaranKelas";

-- DropTable
DROP TABLE "PengaturanPesanan";

-- DropTable
DROP TABLE "Pesanan";

-- DropTable
DROP TABLE "Produk";

-- DropTable
DROP TABLE "ProdukKategori";

-- DropTable
DROP TABLE "ProdukPesanan";

-- DropTable
DROP TABLE "ProdukPesananSpesifikasi";

-- DropTable
DROP TABLE "SpesifikasiProduk";

-- DropTable
DROP TABLE "SpesifikasiProdukValue";

-- DropTable
DROP TABLE "TopikEdukasi";

-- DropTable
DROP TABLE "UlasanProduk";

-- DropEnum
DROP TYPE "JenisProduk";

-- DropEnum
DROP TYPE "MetodePembayaran";

-- DropEnum
DROP TYPE "StatusOrder";

-- DropEnum
DROP TYPE "StatusPembayaran";

-- DropEnum
DROP TYPE "StatusProduk";
