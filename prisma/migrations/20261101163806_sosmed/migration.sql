-- CMS konten sosmed (Instagram / YouTube) untuk landing page. Tabel baru, tidak mengubah tabel lain.

-- CreateTable
CREATE TABLE "sosmed" (
    "uuid" UUID NOT NULL,
    "platform" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "embedUrl" TEXT NOT NULL,
    "kontenId" TEXT NOT NULL,
    "judul" TEXT,
    "thumbnail" TEXT,
    "penempatan" TEXT[] DEFAULT ARRAY['BERANDA']::TEXT[],
    "urutan" INTEGER,
    "statusSosmed" TEXT NOT NULL DEFAULT 'DRAFT',
    "published_at" TIMESTAMP(3),
    "published_by" UUID,
    "insert_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "insert_by" UUID,
    "update_at" TIMESTAMP(3) NOT NULL,
    "update_by" UUID,

    CONSTRAINT "sosmed_pkey" PRIMARY KEY ("uuid")
);

-- CreateIndex
CREATE UNIQUE INDEX "sosmed_platform_kontenId_key" ON "sosmed"("platform", "kontenId");

