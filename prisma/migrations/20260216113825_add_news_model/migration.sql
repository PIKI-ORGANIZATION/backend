/*
  Warnings:

  - You are about to drop the `AppSetting` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Article` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Category` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `History` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Program` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Tag` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TeamMember` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_ArticleToTag` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Article" DROP CONSTRAINT "Article_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "_ArticleToTag" DROP CONSTRAINT "_ArticleToTag_A_fkey";

-- DropForeignKey
ALTER TABLE "_ArticleToTag" DROP CONSTRAINT "_ArticleToTag_B_fkey";

-- DropTable
DROP TABLE "AppSetting";

-- DropTable
DROP TABLE "Article";

-- DropTable
DROP TABLE "Category";

-- DropTable
DROP TABLE "History";

-- DropTable
DROP TABLE "Program";

-- DropTable
DROP TABLE "Tag";

-- DropTable
DROP TABLE "TeamMember";

-- DropTable
DROP TABLE "User";

-- DropTable
DROP TABLE "_ArticleToTag";

-- CreateTable
CREATE TABLE "NewsUtama" (
    "uuid" UUID NOT NULL,
    "judul" TEXT NOT NULL,
    "ringkasan" TEXT,
    "konten" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "url_thumbnail_img" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "author_akun_uuid" UUID NOT NULL,
    "published_at" TIMESTAMP(3),
    "published_by" UUID,
    "insert_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "insert_by" UUID,
    "update_at" TIMESTAMP(3) NOT NULL,
    "update_by" UUID,

    CONSTRAINT "NewsUtama_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "NewsTag" (
    "uuid" UUID NOT NULL,
    "nama_tag" TEXT NOT NULL,
    "jumlah_penggunaan" INTEGER NOT NULL DEFAULT 0,
    "insert_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "insert_by" UUID,
    "update_at" TIMESTAMP(3) NOT NULL,
    "update_by" UUID,

    CONSTRAINT "NewsTag_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "NewsKategori" (
    "uuid" UUID NOT NULL,
    "nama_kategori" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "deskripsi" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "insert_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "insert_by" UUID,
    "update_at" TIMESTAMP(3) NOT NULL,
    "update_by" UUID,

    CONSTRAINT "NewsKategori_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "NewsUtamaTag" (
    "uuid" UUID NOT NULL,
    "news_utama_uuid" UUID NOT NULL,
    "news_tag_uuid" UUID NOT NULL,
    "insert_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "insert_by" UUID,
    "update_at" TIMESTAMP(3) NOT NULL,
    "update_by" UUID,

    CONSTRAINT "NewsUtamaTag_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "NewsUtamaKategori" (
    "uuid" UUID NOT NULL,
    "news_utama_uuid" UUID NOT NULL,
    "news_kategori_uuid" UUID NOT NULL,
    "insert_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "insert_by" UUID,
    "update_at" TIMESTAMP(3) NOT NULL,
    "update_by" UUID,

    CONSTRAINT "NewsUtamaKategori_pkey" PRIMARY KEY ("uuid")
);

-- CreateIndex
CREATE UNIQUE INDEX "NewsUtama_slug_key" ON "NewsUtama"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "NewsTag_nama_tag_key" ON "NewsTag"("nama_tag");

-- CreateIndex
CREATE UNIQUE INDEX "NewsKategori_slug_key" ON "NewsKategori"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "NewsUtamaTag_news_utama_uuid_news_tag_uuid_key" ON "NewsUtamaTag"("news_utama_uuid", "news_tag_uuid");

-- CreateIndex
CREATE UNIQUE INDEX "NewsUtamaKategori_news_utama_uuid_news_kategori_uuid_key" ON "NewsUtamaKategori"("news_utama_uuid", "news_kategori_uuid");

-- AddForeignKey
ALTER TABLE "NewsUtama" ADD CONSTRAINT "NewsUtama_author_akun_uuid_fkey" FOREIGN KEY ("author_akun_uuid") REFERENCES "Akun"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsUtama" ADD CONSTRAINT "NewsUtama_published_by_fkey" FOREIGN KEY ("published_by") REFERENCES "Akun"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsUtamaTag" ADD CONSTRAINT "NewsUtamaTag_news_utama_uuid_fkey" FOREIGN KEY ("news_utama_uuid") REFERENCES "NewsUtama"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsUtamaTag" ADD CONSTRAINT "NewsUtamaTag_news_tag_uuid_fkey" FOREIGN KEY ("news_tag_uuid") REFERENCES "NewsTag"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsUtamaKategori" ADD CONSTRAINT "NewsUtamaKategori_news_utama_uuid_fkey" FOREIGN KEY ("news_utama_uuid") REFERENCES "NewsUtama"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsUtamaKategori" ADD CONSTRAINT "NewsUtamaKategori_news_kategori_uuid_fkey" FOREIGN KEY ("news_kategori_uuid") REFERENCES "NewsKategori"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;
