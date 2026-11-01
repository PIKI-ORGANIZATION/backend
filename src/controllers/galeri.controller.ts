import { Request, Response } from "express";
import { Galeri } from "@prisma/client";
import { prisma } from "../config/prisma";
import { ApiResponse } from "../utils/apiResponse";
import { clearCachePattern } from "../utils/cacheInvalidation";
import { normalisasiLink, ambilJudulYoutube } from "../utils/linkMedia";
import { CreateGaleriInput, UpdateGaleriInput } from "../validators/galeri.schema";

////////////////////////////////////////////////////
// URUTAN TAMPIL: urutan (jika diisi) -> tanggal kegiatan terbaru -> terbaru dibuat
////////////////////////////////////////////////////
const GALERI_ORDER_BY = [
  { urutan: { sort: "asc" as const, nulls: "last" as const } },
  { tanggal: { sort: "desc" as const, nulls: "last" as const } },
  { insert_at: "desc" as const },
];

const httpError = (statusCode: number, message: string) =>
  Object.assign(new Error(message), { statusCode });

const kirimError = (res: Response, error: any, fallback: string) =>
  res.status(error.statusCode || 500).json({ message: error.message || fallback });

const isPengelola = (req: Request) => {
  const permissions = req.user?.permissions ?? [];
  return permissions.includes("MANAGE_ALL_CABANG") || permissions.includes("GALERI_MANAGE");
};

const isLinkYoutube = (url: string) => /youtube\.com|youtu\.be/i.test(url);

const isFileVideo = (url: string) => /\.(mp4|webm|mov)(\?.*)?$/i.test(url.trim());

const keTanggal = (val?: string | null) =>
  val ? new Date(`${val}T00:00:00.000Z`) : val === null ? null : undefined;

// Bersihkan cache halaman landing setelah data berubah
const clearGaleriCache = async () => {
  await clearCachePattern("cache:*:*/page/*");
};

////////////////////////////////////////////////////
// FORMAT RESPONSE: sama dengan GaleriItem di frontend
////////////////////////////////////////////////////
const keGaleriItem = (g: Galeri) => ({
  id: g.id,
  title: g.title,
  deskripsi: g.deskripsi,
  type: g.type,
  url: g.url,
  thumbnailUrl: g.thumbnailUrl,
  embedUrl: g.embedUrl,
  kategoriKegiatan: g.kategoriKegiatan,
  tanggal: g.tanggal ? g.tanggal.toISOString().slice(0, 10) : null,
  lokasi: g.lokasi,
  duration: g.duration,
  youtubeVideoId: g.type === "VIDEO" && g.kontenId ? g.kontenId : null,
  instagramUrl: g.type === "INSTAGRAM" ? g.url : null,
  sumberVideo: g.type === "VIDEO" ? (g.kontenId ? "YOUTUBE" : "UPLOAD") : null,
  penempatan: g.penempatan,
  featured: g.featured,
  urutan: g.urutan,
  status: g.status,
  publishedAt: g.published_at,
  createdAt: g.insert_at,
  updatedAt: g.update_at,
});

////////////////////////////////////////////////////
// OLAH MEDIA PER TYPE
// PHOTO: thumbnail = foto jika kosong
// VIDEO: link YouTube (embed + thumbnail + judul otomatis) atau file video upload (cover wajib)
// INSTAGRAM: link post/reel (embed), cover wajib
////////////////////////////////////////////////////
const siapkanMedia = async (input: {
  type: string;
  url: string;
  title?: string | null;
  thumbnailUrl?: string | null;
}) => {
  const url = input.url.trim();
  const thumbnailUrl = input.thumbnailUrl?.trim() || null;
  let title = input.title?.trim() || null;
  let hasil: { embedUrl: string | null; kontenId: string | null; thumbnailUrl: string | null };

  if (input.type === "PHOTO") {
    hasil = { embedUrl: null, kontenId: null, thumbnailUrl: thumbnailUrl || url };
  } else if (input.type === "VIDEO" && isLinkYoutube(url)) {
    const konten = normalisasiLink("YOUTUBE", url);
    if (!konten) throw httpError(400, `Link YouTube tidak valid: ${url}`);
    hasil = { embedUrl: konten.embedUrl, kontenId: konten.kontenId, thumbnailUrl: thumbnailUrl || konten.thumbnail };
    if (!title) title = await ambilJudulYoutube(konten.kontenId);
  } else if (input.type === "VIDEO") {
    if (!isFileVideo(url)) {
      throw httpError(400, "Video harus berupa link YouTube atau file video hasil upload (mp4/webm/mov)");
    }
    if (!thumbnailUrl) throw httpError(400, "thumbnailUrl (cover) wajib diisi untuk video upload");
    hasil = { embedUrl: null, kontenId: null, thumbnailUrl };
  } else {
    const konten = normalisasiLink("INSTAGRAM", url);
    if (!konten) throw httpError(400, `Link post/reel Instagram tidak valid: ${url}`);
    if (!thumbnailUrl) throw httpError(400, "thumbnailUrl (cover) wajib diisi untuk Instagram");
    hasil = { embedUrl: konten.embedUrl, kontenId: konten.kontenId, thumbnailUrl };
  }

  if (!title || title.length < 3) {
    throw httpError(400, "title wajib diisi (minimal 3 karakter)");
  }

  return { ...hasil, url, title };
};

// YouTube / Instagram yang sama tidak boleh dobel (selama belum dihapus)
const cekKontenDobel = async (type: string, kontenId: string | null, kecualiId?: string) => {
  if (!kontenId) return;
  const dobel = await prisma.galeri.findFirst({
    where: { type, kontenId, deleted_at: null, ...(kecualiId && { NOT: { id: kecualiId } }) },
  });
  if (dobel) throw httpError(409, `Konten sudah ada di galeri: "${dobel.title}" (${dobel.status})`);
};

const cariGaleri = async (id: string) => {
  const galeri = await prisma.galeri.findFirst({ where: { id, deleted_at: null } });
  if (!galeri) throw httpError(404, "Item galeri tidak ditemukan");
  return galeri;
};

////////////////////////////////////////////////////
// GET ALL GALERI
// Publik: hanya PUBLISHED. Pengelola: ?status= atau ?fixed=all (semua status)
////////////////////////////////////////////////////
export const getGaleri = async (req: Request, res: Response) => {
  try {
    const { search, currentPage, pageSize, fixed, type, kategori, penempatan, status } = req.query as {
      search?: string;
      currentPage?: string;
      pageSize?: string;
      fixed?: string;
      type?: string;
      kategori?: string;
      penempatan?: string;
      status?: string;
    };

    const page = Number(currentPage) || 1;
    const size = Number(pageSize) || 10;
    const skip = (page - 1) * size;

    const whereCondition: any = { deleted_at: null };

    if (!isPengelola(req)) {
      whereCondition.status = "PUBLISHED";
    } else if (status) {
      whereCondition.status = status.toUpperCase();
    } else if (fixed !== "all") {
      whereCondition.status = "PUBLISHED";
    }

    if (type) whereCondition.type = type.toUpperCase();
    if (kategori) whereCondition.kategoriKegiatan = { equals: kategori, mode: "insensitive" };
    if (penempatan) whereCondition.penempatan = { has: penempatan.toUpperCase() };

    if (search) {
      whereCondition.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { deskripsi: { contains: search, mode: "insensitive" } },
        { lokasi: { contains: search, mode: "insensitive" } },
        { kategoriKegiatan: { contains: search, mode: "insensitive" } },
      ];
    }

    const [total, galeri] = await Promise.all([
      prisma.galeri.count({ where: whereCondition }),
      prisma.galeri.findMany({
        where: whereCondition,
        orderBy: GALERI_ORDER_BY,
        skip,
        take: size,
      }),
    ]);

    return res.status(200).json(
      ApiResponse.success({
        result: galeri.map(keGaleriItem),
        pagination: {
          currentPage: page,
          pageSize: size,
          total,
        },
      })
    );
  } catch (error: any) {
    return res.status(500).json({
      message: "Failed to fetch galeri",
      error: error.message,
    });
  }
};

////////////////////////////////////////////////////
// STATISTIK DASHBOARD (format GaleriStats frontend)
////////////////////////////////////////////////////
export const getGaleriStats = async (_req: Request, res: Response) => {
  try {
    const items = await prisma.galeri.findMany({
      where: { deleted_at: null },
      select: { type: true, status: true, featured: true },
    });

    const hitung = (fn: (i: (typeof items)[number]) => boolean) => items.filter(fn).length;

    return res.status(200).json(
      ApiResponse.success({
        total: items.length,
        photoCount: hitung((i) => i.type === "PHOTO"),
        videoCount: hitung((i) => i.type === "VIDEO"),
        instagramCount: hitung((i) => i.type === "INSTAGRAM"),
        publishedCount: hitung((i) => i.status === "PUBLISHED"),
        draftCount: hitung((i) => i.status === "DRAFT"),
        archivedCount: hitung((i) => i.status === "ARCHIVED"),
        spotlightCount: hitung((i) => i.featured),
      })
    );
  } catch (error: any) {
    return res.status(500).json({
      message: "Failed to fetch galeri stats",
      error: error.message,
    });
  }
};

////////////////////////////////////////////////////
// GET GALERI BY ID
////////////////////////////////////////////////////
export const getGaleriById = async (req: Request, res: Response) => {
  try {
    const galeri = await cariGaleri(String(req.params.id));
    return res.status(200).json(ApiResponse.success(keGaleriItem(galeri)));
  } catch (error: any) {
    return kirimError(res, error, "Failed to fetch galeri");
  }
};

////////////////////////////////////////////////////
// PREVIEW LINK YOUTUBE / INSTAGRAM (tanpa menyimpan)
////////////////////////////////////////////////////
export const previewGaleri = async (req: Request, res: Response) => {
  try {
    const { type, url } = req.body as { type: "VIDEO" | "INSTAGRAM"; url: string };

    if (type === "VIDEO" && !isLinkYoutube(url)) {
      throw httpError(400, "Preview video hanya untuk link YouTube");
    }

    const konten = normalisasiLink(type === "VIDEO" ? "YOUTUBE" : "INSTAGRAM", url);
    if (!konten) throw httpError(400, `Link tidak valid untuk ${type}: ${url}`);

    const title = type === "VIDEO" ? await ambilJudulYoutube(konten.kontenId) : null;

    return res.status(200).json(
      ApiResponse.success({
        type,
        url,
        embedUrl: konten.embedUrl,
        thumbnailUrl: konten.thumbnail,
        title,
        youtubeVideoId: type === "VIDEO" ? konten.kontenId : null,
        instagramUrl: type === "INSTAGRAM" ? url : null,
      })
    );
  } catch (error: any) {
    return kirimError(res, error, "Failed to preview galeri");
  }
};

////////////////////////////////////////////////////
// CREATE GALERI (satu data atau banyak sekaligus)
////////////////////////////////////////////////////
export const createGaleri = async (req: Request, res: Response) => {
  try {
    const user = req.user!;

    const data: CreateGaleriInput[] = Array.isArray(req.body) ? req.body : [req.body];

    if (data.filter((d) => d.featured).length > 1) {
      throw httpError(400, "Spotlight (featured) hanya boleh satu item");
    }

    const siap = await Promise.all(
      data.map(async (item) => ({ ...item, ...(await siapkanMedia(item)) }))
    );

    ////////////////////////////////////////////////////
    // CEGAH KONTEN YOUTUBE / INSTAGRAM DOBEL
    ////////////////////////////////////////////////////
    const kunci = siap.filter((s) => s.kontenId).map((s) => `${s.type}:${s.kontenId}`);
    if (new Set(kunci).size !== kunci.length) {
      throw httpError(409, "Ada konten yang sama lebih dari sekali di data yang dikirim");
    }
    for (const s of siap) await cekKontenDobel(s.type, s.kontenId);

    const created = await prisma.$transaction(async (tx) => {
      if (siap.some((s) => s.featured)) {
        await tx.galeri.updateMany({ where: { featured: true }, data: { featured: false } });
      }

      const hasil = [];
      for (const s of siap) {
        const status = s.status ?? "DRAFT";
        hasil.push(
          await tx.galeri.create({
            data: {
              type: s.type,
              title: s.title,
              deskripsi: s.deskripsi ?? null,
              url: s.url,
              thumbnailUrl: s.thumbnailUrl,
              embedUrl: s.embedUrl,
              kontenId: s.kontenId,
              kategoriKegiatan: s.kategoriKegiatan ?? null,
              tanggal: keTanggal(s.tanggal) ?? null,
              lokasi: s.lokasi ?? null,
              duration: s.duration ?? null,
              ...(s.penempatan && { penempatan: [...new Set(s.penempatan)] }),
              featured: s.featured ?? false,
              urutan: s.urutan ?? null,
              status,
              ...(status === "PUBLISHED" && { published_at: new Date(), published_by: user.sub }),
              insert_by: user.sub,
            },
          })
        );
      }
      return hasil;
    });

    await clearGaleriCache();

    return res.status(201).json(
      ApiResponse.success(
        Array.isArray(req.body) ? created.map(keGaleriItem) : keGaleriItem(created[0]),
        `${created.length} item galeri berhasil dibuat`
      )
    );
  } catch (error: any) {
    return kirimError(res, error, "Failed to create galeri");
  }
};

////////////////////////////////////////////////////
// UPDATE GALERI
////////////////////////////////////////////////////
export const updateGaleri = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const user = req.user!;
    const body = req.body as UpdateGaleriInput;

    const existing = await cariGaleri(id);

    ////////////////////////////////////////////////////
    // VALIDASI TRANSISI STATUS
    ////////////////////////////////////////////////////
    if (existing.status === "ARCHIVED" && body.status === "DRAFT") {
      throw httpError(400, "Item yang diarsipkan hanya bisa dikembalikan ke PUBLISHED");
    }

    const data: any = {
      ...(body.deskripsi !== undefined && { deskripsi: body.deskripsi || null }),
      ...(body.kategoriKegiatan !== undefined && { kategoriKegiatan: body.kategoriKegiatan || null }),
      ...(body.tanggal !== undefined && { tanggal: keTanggal(body.tanggal) }),
      ...(body.lokasi !== undefined && { lokasi: body.lokasi || null }),
      ...(body.duration !== undefined && { duration: body.duration || null }),
      ...(body.penempatan && { penempatan: [...new Set(body.penempatan)] }),
      ...(body.urutan !== undefined && { urutan: body.urutan }),
      ...(body.featured !== undefined && { featured: body.featured }),
      ...(body.status && { status: body.status }),
      update_by: user.sub,
    };

    if (body.status === "PUBLISHED" && existing.status !== "PUBLISHED") {
      data.published_at = new Date();
      data.published_by = user.sub;
    }
    if (body.status === "ARCHIVED") data.featured = false;

    ////////////////////////////////////////////////////
    // TYPE / URL / THUMBNAIL / TITLE BERUBAH -> OLAH ULANG MEDIA
    ////////////////////////////////////////////////////
    const adaPerubahanMedia =
      (body.type && body.type !== existing.type) ||
      (body.url && body.url !== existing.url) ||
      body.thumbnailUrl !== undefined ||
      body.title !== undefined;

    if (adaPerubahanMedia) {
      // Thumbnail otomatis lama (foto itu sendiri / thumbnail YouTube) ikut diganti jika link berubah;
      // cover yang diisi admin tetap dipertahankan
      const thumbnailOtomatis =
        existing.thumbnailUrl === existing.url ||
        (!!existing.kontenId && !!existing.thumbnailUrl?.includes(`/vi/${existing.kontenId}/`));
      const linkBerubah = !!body.url && body.url !== existing.url;

      const media = await siapkanMedia({
        type: body.type ?? existing.type,
        url: body.url ?? existing.url,
        title: body.title !== undefined ? body.title : existing.title,
        thumbnailUrl:
          body.thumbnailUrl !== undefined
            ? body.thumbnailUrl
            : linkBerubah && thumbnailOtomatis
              ? null
              : existing.thumbnailUrl,
      });
      await cekKontenDobel(body.type ?? existing.type, media.kontenId, id);
      Object.assign(data, { type: body.type ?? existing.type, ...media });
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (data.featured === true) {
        await tx.galeri.updateMany({ where: { featured: true, NOT: { id } }, data: { featured: false } });
      }
      return tx.galeri.update({ where: { id }, data });
    });

    await clearGaleriCache();

    return res.status(200).json(ApiResponse.success(keGaleriItem(updated), "Item galeri berhasil diperbarui"));
  } catch (error: any) {
    return kirimError(res, error, "Failed to update galeri");
  }
};

////////////////////////////////////////////////////
// TOGGLE STATUS: PUBLISHED <-> DRAFT (ARCHIVED -> PUBLISHED)
////////////////////////////////////////////////////
export const toggleStatusGaleri = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const user = req.user!;
    const existing = await cariGaleri(id);

    const status = existing.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";

    const updated = await prisma.galeri.update({
      where: { id },
      data: {
        status,
        ...(status === "PUBLISHED" && { published_at: new Date(), published_by: user.sub }),
        update_by: user.sub,
      },
    });

    await clearGaleriCache();

    return res.status(200).json(ApiResponse.success(keGaleriItem(updated), `Status diubah menjadi ${status}`));
  } catch (error: any) {
    return kirimError(res, error, "Failed to toggle status galeri");
  }
};

////////////////////////////////////////////////////
// TOGGLE SPOTLIGHT (hanya satu item featured)
////////////////////////////////////////////////////
export const toggleFeaturedGaleri = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const user = req.user!;
    const existing = await cariGaleri(id);

    if (!existing.featured && existing.status === "ARCHIVED") {
      throw httpError(400, "Item yang diarsipkan tidak bisa dijadikan spotlight");
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (!existing.featured) {
        await tx.galeri.updateMany({ where: { featured: true }, data: { featured: false } });
      }
      return tx.galeri.update({
        where: { id },
        data: { featured: !existing.featured, update_by: user.sub },
      });
    });

    await clearGaleriCache();

    return res.status(200).json(
      ApiResponse.success(
        keGaleriItem(updated),
        updated.featured ? "Item dijadikan spotlight" : "Spotlight dinonaktifkan"
      )
    );
  } catch (error: any) {
    return kirimError(res, error, "Failed to toggle featured galeri");
  }
};

////////////////////////////////////////////////////
// ARSIPKAN (bisa dikembalikan ke PUBLISHED)
////////////////////////////////////////////////////
export const archiveGaleri = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const user = req.user!;
    await cariGaleri(id);

    const updated = await prisma.galeri.update({
      where: { id },
      data: { status: "ARCHIVED", featured: false, update_by: user.sub },
    });

    await clearGaleriCache();

    return res.status(200).json(ApiResponse.success(keGaleriItem(updated), "Item galeri berhasil diarsipkan"));
  } catch (error: any) {
    return kirimError(res, error, "Failed to archive galeri");
  }
};

////////////////////////////////////////////////////
// HAPUS (soft delete, hilang dari CMS & publik)
////////////////////////////////////////////////////
export const deleteGaleri = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const user = req.user!;
    await cariGaleri(id);

    await prisma.galeri.update({
      where: { id },
      data: { deleted_at: new Date(), deleted_by: user.sub, featured: false },
    });

    await clearGaleriCache();

    return res.status(200).json(ApiResponse.success(null, "Item galeri berhasil dihapus"));
  } catch (error: any) {
    return kirimError(res, error, "Failed to delete galeri");
  }
};
