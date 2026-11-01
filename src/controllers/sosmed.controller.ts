import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { ApiResponse } from "../utils/apiResponse";
import { clearCachePattern } from "../utils/cacheInvalidation";
import { normalisasiLinkSosmed, ambilJudulYoutube, PlatformSosmed } from "../utils/sosmedEmbed";
import { CreateSosmedInput, UpdateSosmedInput } from "../validators/sosmed.schema";

////////////////////////////////////////////////////
// URUTAN TAMPIL: urutan (jika diisi) -> terbaru tayang -> terbaru dibuat
////////////////////////////////////////////////////
const SOSMED_ORDER_BY = [
  { urutan: { sort: "asc" as const, nulls: "last" as const } },
  { published_at: { sort: "desc" as const, nulls: "last" as const } },
  { insert_at: "desc" as const },
];

const httpError = (statusCode: number, message: string) =>
  Object.assign(new Error(message), { statusCode });

const kirimError = (res: Response, error: any, fallback: string) =>
  res.status(error.statusCode || 500).json({ message: error.message || fallback });

// Bersihkan cache halaman landing setelah data berubah
const clearSosmedCache = async () => {
  await clearCachePattern("cache:*:*/page/*");
};

// Link -> kontenId, embedUrl, thumbnail. Judul YouTube diisi otomatis jika kosong.
const siapkanKonten = async (platform: PlatformSosmed, url: string, judul?: string | null) => {
  const konten = normalisasiLinkSosmed(platform, url);
  if (!konten) {
    throw httpError(400, `Link tidak valid untuk platform ${platform}: ${url}`);
  }
  const judulFinal =
    judul?.trim() || (platform === "YOUTUBE" ? await ambilJudulYoutube(konten.kontenId) : null);
  return { ...konten, judul: judulFinal };
};

////////////////////////////////////////////////////
// GET ALL SOSMED
// Publik: hanya PUBLISHED. Pengelola CMS: ?fixed=all (semua status) atau ?statusSosmed=
////////////////////////////////////////////////////
export const getSosmed = async (req: Request, res: Response) => {
  try {
    const { search, currentPage, pageSize, fixed, platform, penempatan, statusSosmed } = req.query as {
      search?: string;
      currentPage?: string;
      pageSize?: string;
      fixed?: string;
      platform?: string;
      penempatan?: string;
      statusSosmed?: string;
    };

    const page = Number(currentPage) || 1;
    const size = Number(pageSize) || 10;
    const skip = (page - 1) * size;

    const permissions = req.user?.permissions ?? [];
    const isPengelola = permissions.includes("MANAGE_ALL_CABANG") || permissions.includes("SOSMED_MANAGE");

    const whereCondition: any = {};

    if (!isPengelola) {
      whereCondition.statusSosmed = "PUBLISHED";
    } else if (statusSosmed) {
      whereCondition.statusSosmed = statusSosmed;
    } else if (fixed !== "all") {
      whereCondition.statusSosmed = "PUBLISHED";
    }

    if (platform) whereCondition.platform = platform.toUpperCase();
    if (penempatan) whereCondition.penempatan = { has: penempatan.toUpperCase() };

    if (search) {
      whereCondition.OR = [
        { judul: { contains: search, mode: "insensitive" } },
        { url: { contains: search, mode: "insensitive" } },
      ];
    }

    const [total, sosmed] = await Promise.all([
      prisma.sosmed.count({ where: whereCondition }),
      prisma.sosmed.findMany({
        where: whereCondition,
        orderBy: SOSMED_ORDER_BY,
        skip,
        take: size,
      }),
    ]);

    return res.status(200).json(
      ApiResponse.success({
        result: sosmed,
        pagination: {
          currentPage: page,
          pageSize: size,
          total,
        },
      })
    );
  } catch (error: any) {
    return res.status(500).json({
      message: "Failed to fetch sosmed",
      error: error.message,
    });
  }
};

////////////////////////////////////////////////////
// GET SOSMED BY ID
////////////////////////////////////////////////////
export const getSosmedById = async (req: Request, res: Response) => {
  try {
    const uuid = String(req.params.uuid);

    const sosmed = await prisma.sosmed.findUnique({ where: { uuid } });

    if (!sosmed) {
      return res.status(404).json({ message: "Konten sosmed tidak ditemukan" });
    }

    return res.status(200).json(ApiResponse.success(sosmed));
  } catch (error: any) {
    return res.status(500).json({
      message: "Failed to fetch sosmed",
      error: error.message,
    });
  }
};

////////////////////////////////////////////////////
// PREVIEW LINK (validasi + embed tanpa menyimpan)
////////////////////////////////////////////////////
export const previewSosmed = async (req: Request, res: Response) => {
  try {
    const { platform, url } = req.body as { platform: PlatformSosmed; url: string };

    const konten = await siapkanKonten(platform, url);

    return res.status(200).json(ApiResponse.success({ platform, url, ...konten }));
  } catch (error: any) {
    return kirimError(res, error, "Failed to preview sosmed");
  }
};

////////////////////////////////////////////////////
// CREATE SOSMED (satu data atau banyak sekaligus, status awal DRAFT)
////////////////////////////////////////////////////
export const createSosmed = async (req: Request, res: Response) => {
  try {
    const user = req.user!;

    const data: CreateSosmedInput[] = Array.isArray(req.body) ? req.body : [req.body];

    const siap = await Promise.all(
      data.map(async (item) => ({
        ...item,
        ...(await siapkanKonten(item.platform, item.url, item.judul)),
      }))
    );

    ////////////////////////////////////////////////////
    // CEGAH KONTEN DOBEL (di dalam payload & di database)
    ////////////////////////////////////////////////////
    const kunci = siap.map((s) => `${s.platform}:${s.kontenId}`);
    if (new Set(kunci).size !== kunci.length) {
      throw httpError(409, "Ada konten yang sama lebih dari sekali di data yang dikirim");
    }

    const sudahAda = await prisma.sosmed.findMany({
      where: { OR: siap.map((s) => ({ platform: s.platform, kontenId: s.kontenId })) },
      select: { platform: true, url: true, statusSosmed: true },
    });
    if (sudahAda.length > 0) {
      throw httpError(
        409,
        `Konten sudah ada di CMS: ${sudahAda.map((s) => `${s.url} (${s.statusSosmed})`).join(", ")}`
      );
    }

    const result = await prisma.sosmed.createMany({
      data: siap.map((s) => ({
        platform: s.platform,
        url: s.url,
        embedUrl: s.embedUrl,
        kontenId: s.kontenId,
        thumbnail: s.thumbnail,
        judul: s.judul,
        ...(s.penempatan && { penempatan: [...new Set(s.penempatan)] }),
        urutan: s.urutan ?? null,
        statusSosmed: "DRAFT",
        insert_by: user.sub,
      })),
    });

    await clearSosmedCache();

    return res.status(201).json(
      ApiResponse.success({
        message: `${result.count} konten sosmed berhasil dibuat (DRAFT)`,
      })
    );
  } catch (error: any) {
    return kirimError(res, error, "Failed to create sosmed");
  }
};

////////////////////////////////////////////////////
// UPDATE SOSMED (data & status)
////////////////////////////////////////////////////
export const updateSosmed = async (req: Request, res: Response) => {
  try {
    const uuid = String(req.params.uuid);
    const user = req.user!;
    const body = req.body as UpdateSosmedInput;

    const existing = await prisma.sosmed.findUnique({ where: { uuid } });

    if (!existing) {
      return res.status(404).json({ message: "Konten sosmed tidak ditemukan" });
    }

    ////////////////////////////////////////////////////
    // VALIDASI TRANSISI STATUS
    ////////////////////////////////////////////////////
    if (existing.statusSosmed === "ARCHIVED" && body.statusSosmed === "DRAFT") {
      throw httpError(400, "Konten yang diarsipkan hanya bisa dikembalikan ke PUBLISHED");
    }

    const data: any = {
      ...(body.judul !== undefined && { judul: body.judul?.trim() || null }),
      ...(body.penempatan && { penempatan: [...new Set(body.penempatan)] }),
      ...(body.urutan !== undefined && { urutan: body.urutan }),
      ...(body.statusSosmed && { statusSosmed: body.statusSosmed }),
      update_by: user.sub,
    };

    if (body.statusSosmed === "PUBLISHED" && existing.statusSosmed !== "PUBLISHED") {
      data.published_at = new Date();
      data.published_by = user.sub;
    }

    ////////////////////////////////////////////////////
    // LINK / PLATFORM BERUBAH -> HITUNG ULANG EMBED
    ////////////////////////////////////////////////////
    const platform = (body.platform ?? existing.platform) as PlatformSosmed;
    const url = body.url ?? existing.url;

    if (platform !== existing.platform || url !== existing.url) {
      // Judul lama milik konten lama: ambil ulang jika admin tidak mengirim judul baru
      const konten = await siapkanKonten(platform, url, body.judul);

      const dobel = await prisma.sosmed.findFirst({
        where: { platform, kontenId: konten.kontenId, NOT: { uuid } },
      });
      if (dobel) {
        throw httpError(409, `Konten sudah ada di CMS: ${dobel.url} (${dobel.statusSosmed})`);
      }

      Object.assign(data, {
        platform,
        url,
        embedUrl: konten.embedUrl,
        kontenId: konten.kontenId,
        thumbnail: konten.thumbnail,
        judul: konten.judul ?? (body.judul === undefined ? existing.judul : null),
      });
    }

    const updated = await prisma.sosmed.update({ where: { uuid }, data });

    await clearSosmedCache();

    return res.status(200).json(
      ApiResponse.success({
        message: "Konten sosmed berhasil diperbarui",
        data: updated,
      })
    );
  } catch (error: any) {
    return kirimError(res, error, "Failed to update sosmed");
  }
};

////////////////////////////////////////////////////
// ARSIPKAN SOSMED (pengganti hapus, bisa dikembalikan ke PUBLISHED)
////////////////////////////////////////////////////
export const archiveSosmed = async (req: Request, res: Response) => {
  try {
    const uuid = String(req.params.uuid);
    const user = req.user!;

    const existing = await prisma.sosmed.findUnique({ where: { uuid } });

    if (!existing) {
      return res.status(404).json({ message: "Konten sosmed tidak ditemukan" });
    }

    await prisma.sosmed.update({
      where: { uuid },
      data: {
        statusSosmed: "ARCHIVED",
        update_by: user.sub,
      },
    });

    await clearSosmedCache();

    return res.status(200).json(
      ApiResponse.success({
        message: "Konten sosmed berhasil diarsipkan",
      })
    );
  } catch (error: any) {
    return kirimError(res, error, "Failed to archive sosmed");
  }
};
