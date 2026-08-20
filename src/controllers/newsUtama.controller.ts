import { Request, Response } from "express";
import { trackViewNewsUtama } from "../services/newsUtama.services";
import { prisma } from "../config/prisma";
import { clearCachePattern } from "../utils/cacheInvalidation";
import { ApiResponse } from "../utils/apiResponse";

export const getNewsUtama = async (req: Request, res: Response) => {
  try {
    const {
      search,
      currentPage,
      pageSize,
      fixed,
      kategori,
      tag,
      statusNewsUtama,
    } = req.query as {
      search?: string;
      currentPage?: string;
      pageSize?: string;
      fixed?: string;
      kategori?: string;
      tag?: string;
      statusNewsUtama?: string;
    };

    const scope = req.scope;

    const page = Number(currentPage) || 1;
    const size = Number(pageSize) || 10;
    const skip = (page - 1) * size;

    const whereCondition: any = {};

    // SEARCH
    if (search) {
      whereCondition.OR = [
        { judul: { contains: search, mode: "insensitive" } },
        { ringkasan: { contains: search, mode: "insensitive" } },
        { konten: { contains: search, mode: "insensitive" } },
      ];
    }

    // 🏷️ FILTER
    if (kategori) {
      whereCondition.kategori = {
        some: { kategori: { uuid: kategori } },
      };
    }

    if (tag) {
      whereCondition.tags = {
        some: { tag: { uuid: tag } },
      };
    }

    const includeAll = fixed?.toLowerCase() === "all";

    // =====================================================
    // LOGIC UTAMA (ROLE BASED)
    // =====================================================

    if (!scope?.isAdmin) {
      // USER PUBLIC
      whereCondition.statusNewsUtama = "PUBLISHED";
    } else {
      // 🛠 ADMIN
      const isManageAllCabang = req.user?.permissions?.includes("MANAGE_ALL_CABANG");

      if (!scope.isSuperAdmin && !isManageAllCabang) {
        // ADMIN CABANG
        whereCondition.cabangUuid = scope.cabangId;
      }

      // Status filter: explicit query param > fixed=all (show all) > default PUBLISHED
      if (statusNewsUtama) {
        whereCondition.statusNewsUtama = statusNewsUtama;
      } else if (!includeAll) {
        whereCondition.statusNewsUtama = "PUBLISHED";
      }
    }

    // =====================================================

    const total = await prisma.newsUtama.count({
      where: whereCondition,
    });

    const newsUtama = await prisma.newsUtama.findMany({
      where: whereCondition,
      include: {
        author: {
          select: {
            uuid: true,
            username: true,
            email: true,
          },
        },
        cabang: { select: { namaCabang: true } }, publisher: {
          select: {
            uuid: true,
            username: true,
          },
        },
        tags: {
          include: { tag: true },
        },
        kategori: {
          include: { kategori: true },
        },
        albumList: {
          include: { mediaList: true },
        },
      },
      orderBy: {
        insert_at: "desc",
      },
      skip,
      take: size,
    });

    const result = newsUtama.map((item: any) => {
      const { tags, kategori, ...news } = item;

      return {
        ...news,
        tags: tags.map((t: any) => t.tag),
        kategori: kategori.map((k: any) => k.kategori),
      };
    });

    return res.status(200).json(
      ApiResponse.success({
        result,
        pagination: {
          currentPage: page,
          pageSize: size,
          total,
        },
      })
    );
  } catch (error: any) {
    res.status(500).json({
      message: "Failed to fetch news utama",
      error: error.message,
    });
  }
};

export const getNewsUtamaById = async (req: Request, res: Response) => {
  try {
    const uuid = req.params.uuid as string;

    const newsUtama = await prisma.newsUtama.findUnique({
      where: { uuid },
      include: {
        author: true,
        cabang: { select: { namaCabang: true } },
        publisher: true,
        tags: { include: { tag: true } },
        kategori: { include: { kategori: true } },
        albumList: { include: { mediaList: true } },
      },
    });

    if (!newsUtama) {
      return res.status(404).json({ error: "News utama not found" });
    }

    // NON-BLOCKING VIEW TRACKING
    trackViewNewsUtama(req, newsUtama.uuid);

    return res.status(200).json(
      ApiResponse.success({
        result: newsUtama,
      })
    );
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch news utama by ID" });
  }
};

export const getNewsUtamaByCabang = async (req: Request, res: Response) => {
  try {
    const uuid = req.params.cabangUuid as string;

    const newsUtama = await prisma.newsUtama.findMany({
      where: { cabangUuid: uuid, statusNewsUtama: "PUBLISHED" },
      include: {
        author: true,
        cabang: { select: { namaCabang: true } },
        publisher: true,
        tags: { include: { tag: true } },
        kategori: { include: { kategori: true } },
        albumList: { include: { mediaList: true } },
      },
    });

    if (!newsUtama) {
      return res.status(404).json({ error: "News utama not found" });
    }

    return res.status(200).json(
      ApiResponse.success({
        result: newsUtama,
      })
    );
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch news utama by ID" });
  }
};

export const getNewsUtamaAdminByCabang = async (req: Request, res: Response) => {
  try {
    const uuid = req.user?.cabangId;
    // const isCabangUser = req.user?.isCabang;
    const isManageAllCabang = req.user?.permissions.includes("MANAGE_ALL_CABANG");

    let whereCondition: any = {};

    // hanya filter cabang kalau dia user cabang biasa
    if (!isManageAllCabang) {
      whereCondition.cabangUuid = uuid;
    }

    const newsUtama = await prisma.newsUtama.findMany({
      where: whereCondition,
      include: {
        author: true,
        cabang: { select: { namaCabang: true } },
        publisher: true,
        tags: { include: { tag: true } },
        kategori: { include: { kategori: true } },
        albumList: { include: { mediaList: true } },
      },
    });

    if (!newsUtama || newsUtama.length === 0) {
      return res.status(404).json({ error: "News utama not found" });
    }

    return res.status(200).json(
      ApiResponse.success({
        result: newsUtama,
      })
    );
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch news utama by ID" });
  }
};

export const getNewsUtamaBySlug = async (req: Request, res: Response) => {
  try {
    const slug = req.params.slug as string;

    const newsUtama = await prisma.newsUtama.findUnique({
      where: { slug },
      include: {
        author: true,
        cabang: { select: { namaCabang: true } },
        publisher: true,
        tags: { include: { tag: true } },
        kategori: { include: { kategori: true } },
        albumList: { include: { mediaList: true } },
      },
    });

    if (!newsUtama) {
      return res.status(404).json({ error: "News utama not found" });
    }

    trackViewNewsUtama(req, newsUtama.uuid);

    res.json(newsUtama);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch news utama by slug" });
  }
};

export const getNewsUtamaByKategori = async (req: Request, res: Response) => {
  try {
    const kategori = req.params.kategori as string;

    const newsUtama = await prisma.newsUtama.findMany({
      where: {
        kategori: {
          some: {
            kategori: {
                nama_kategori: kategori,
            },
          },
        },
      },
      include: {
        kategori: { include: { kategori: true } },
        tags: { include: { tag: true } },
      },
    });

    res.json(newsUtama);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch news utama by category" });
  }
};

export const getNewsUtamaByTag = async (req: Request, res: Response) => {
  try {
    const tag = req.params.tag as string;

    const newsUtama = await prisma.newsUtama.findMany({
      where: {
        tags: {
          some: {
            tag: {
              nama_tag: tag,
            },
          },
        },
      },
      include: {
        tags: { include: { tag: true } },
        kategori: { include: { kategori: true } },
      },
    });

    res.json(newsUtama);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch news utama by tag" });
  }
};

export const getNewsUtamaSearch = async (req: Request, res: Response) => {
  try {
    
    const { search, status } = req.query;

    const filters: any[] = [];

    if (search) {
      filters.push({
        OR: [
          { judul: { contains: String(search), mode: "insensitive" } },
          {
            kategori: {
              some: {
                kategori: {
                  nama_kategori: {
                    contains: String(search),
                    mode: "insensitive",
                  },
                },
              },
            },
          },
          {
            tags: {
              some: {
                tag: {
                  nama_tag: {
                    contains: String(search),
                    mode: "insensitive",
                  },
                },
              },
            },
          },
        ],
      });
    }

    if (status) {
      filters.push({ statusNewsUtama: String(status) });
    }

    const news = await prisma.newsUtama.findMany({
      where: {
        AND: filters,
      },
      include: {
        author: true,
        cabang: { select: { namaCabang: true } },
        publisher: true,
        tags: { include: { tag: true } },
        kategori: { include: { kategori: true } },
      },
    });

    res.json(news);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// helper untuk estimasi durasi baca berdasarkan jumlah kata, dengan asumsi 200 wpm
const estimateReadingTime = (text: string) => {
  const wordsPerMinute = 200;
  const wordCount = text.split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
};

export const createNewsUtama = async (
  req: Request,
  res: Response
) => {
  try {
    const userUuid = req.user?.sub;
    const scope = req.scope;

    if (!userUuid) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const {
      judul,
      ringkasan,
      konten,
      slug,
      url_thumbnail_img,
      statusNewsUtama = "DRAFT",
      tags = [],
      kategori = [],
      albumList = [],
    } = req.body;

    const isPublished =
      statusNewsUtama === "PUBLISHED";

    const newsUtama = await prisma.$transaction(
      async (tx) => {

        // =================================================
        // VALIDASI TAG
        // =================================================

        if (tags.length > 0) {
          const tagCount = await tx.newsTag.count({
            where: {
              uuid: {
                in: tags,
              },
            },
          });

          if (tagCount !== tags.length) {
            throw new Error(
              "Beberapa tag tidak ditemukan"
            );
          }
        }

        // =================================================
        // VALIDASI KATEGORI
        // =================================================

        if (kategori.length > 0) {
          const kategoriCount =
            await tx.newsKategori.count({
              where: {
                uuid: {
                  in: kategori,
                },
              },
            });

          if (
            kategoriCount !== kategori.length
          ) {
            throw new Error(
              "Beberapa kategori tidak ditemukan"
            );
          }
        }

        // =================================================
        // CREATE NEWS
        // =================================================

        const created =
          await tx.newsUtama.create({
            data: {
              judul,
              ringkasan,
              konten,
              slug,
              url_thumbnail_img,

              statusNewsUtama,

              author_akun_uuid: userUuid,

              insert_by: userUuid,

              // =========================================
              // CABANG
              // =========================================
              cabangUuid: scope?.cabangId || null,

              durasi_baca:
                req.body.durasi_baca ??
                estimateReadingTime(konten),

              published_at: isPublished
                ? new Date()
                : null,

              published_by: isPublished
                ? userUuid
                : null,

              // =========================================
              // TAGS
              // =========================================
              tags: {
                create: tags.map(
                  (tagUuid: string) => ({
                    news_tag_uuid: tagUuid,
                  })
                ),
              },

              // =========================================
              // KATEGORI
              // =========================================
              kategori: {
                create: kategori.map(
                  (kategoriUuid: string) => ({
                    news_kategori_uuid:
                      kategoriUuid,
                  })
                ),
              },
            },
          });

        // =================================================
        // ALBUM
        // =================================================

        if (
          albumList &&
          albumList.length > 0
        ) {
          for (const album of albumList) {
            if (album.uuid) {

              // UPDATE EXISTING ALBUM

              await tx.albumGaleri.update({
                where: {
                  uuid: album.uuid,
                },
                data: {
                  newsUtamaUuid: created.uuid,
                  namaAlbum: album.namaAlbum,
                  deskripsi:
                    album.deskripsi || null,
                  tanggalKegiatan: new Date(
                    album.tanggalKegiatan
                  ),
                  update_by: userUuid,
                },
              });

              if (album.mediaList) {
                await tx.mediaGaleri.deleteMany({
                  where: {
                    albumUuid: album.uuid,
                  },
                });

                if (
                  album.mediaList.length > 0
                ) {
                  await tx.mediaGaleri.createMany({
                    data: album.mediaList.map(
                      (m: any, idx: number) => ({
                        albumUuid: album.uuid,
                        tipeMedia: m.tipeMedia,
                        urlMedia: m.urlMedia,
                        thumbnail:
                          m.thumbnail || null,
                        keterangan:
                          m.keterangan || null,
                        urutan: idx + 1,
                        insert_by: userUuid,
                      })
                    ),
                  });
                }
              }

            } else {

              // CREATE NEW ALBUM

              await tx.albumGaleri.create({
                data: {
                  newsUtamaUuid: created.uuid,
                  namaAlbum: album.namaAlbum,
                  deskripsi:
                    album.deskripsi || null,
                  tanggalKegiatan: new Date(
                    album.tanggalKegiatan
                  ),
                  isPublic: true,
                  insert_by: userUuid,

                  ...(album.mediaList &&
                    album.mediaList.length > 0 && {
                      mediaList: {
                        create:
                          album.mediaList.map(
                            (
                              m: any,
                              idx: number
                            ) => ({
                              tipeMedia:
                                m.tipeMedia,
                              urlMedia:
                                m.urlMedia,
                              thumbnail:
                                m.thumbnail ||
                                null,
                              keterangan:
                                m.keterangan ||
                                null,
                              urutan: idx + 1,
                              insert_by:
                                userUuid,
                            })
                          ),
                      },
                    }),
                },
              });
            }
          }
        }

        // =================================================
        // UPDATE JUMLAH TAG
        // =================================================

        if (tags.length > 0) {
          await tx.newsTag.updateMany({
            where: {
              uuid: {
                in: tags,
              },
            },
            data: {
              jumlah_penggunaan: {
                increment: 1,
              },
            },
          });
        }

        return created;
      }
    );

    return res.status(201).json({
      message:
        "News utama created successfully",
      data: newsUtama,
    });

  } catch (error: any) {

    if (error.code === "P2002") {
      return res.status(400).json({
        message: "Slug already exists",
      });
    }

    return res.status(500).json({
      message:
        "Failed to create news utama",
      error: error.message,
    });
  }
};

export const updateNewsUtama = async (req: Request, res: Response) => {
  try {
    const userUuid = req.user?.sub;
    const uuid = req.params.uuid as string;

    if (!userUuid) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const {
      judul,
      ringkasan,
      konten,
      slug,
      url_thumbnail_img,
      statusNewsUtama,
      tags,
      kategori,
      albumList,
    } = req.body;

    const result = await prisma.$transaction(async (tx) => {

      const existingNews = await tx.newsUtama.findUnique({
        where: { uuid },
      });

      if (!existingNews) {
        throw new Error("News not found");
      }

      const isPublishingNow =
        existingNews.statusNewsUtama !== "PUBLISHED" &&
        statusNewsUtama === "PUBLISHED";

      const isUnPublishing =
        existingNews.statusNewsUtama === "PUBLISHED" &&
        statusNewsUtama !== "PUBLISHED";

      // VALIDATE SLUG UNIQUENESS
      if (slug && slug !== existingNews.slug) {
        const slugExists = await tx.newsUtama.findFirst({
          where: {
            slug,
            NOT: { uuid },
          },
        });

        if (slugExists) {
          throw new Error("Slug already exists");
        }
      }

      // ===== UPDATE NEWS =====
      const updatedNews = await tx.newsUtama.update({
        where: { uuid },
        data: {
          ...(judul && { judul }),
          ...(ringkasan && { ringkasan }),

          ...(konten && {
            konten,
            durasi_baca: req.body.durasi_baca ?? estimateReadingTime(konten), // AUTO UPDATE
          }),

          ...(slug && { slug }),
          ...(url_thumbnail_img !== undefined && { url_thumbnail_img }),
          ...(statusNewsUtama && { statusNewsUtama }),

          update_by: userUuid,

          ...(isPublishingNow && {
            published_at: new Date(),
            published_by: userUuid,
          }),

          ...(isUnPublishing && {
            published_at: null,
            published_by: null,
          }),
        },
      });

      // ===== UPDATE TAG (only if provided) =====
      if (tags !== undefined) {

        const oldTags = await tx.newsUtamaTag.findMany({
          where: { news_utama_uuid: uuid },
          select: { news_tag_uuid: true },
        });

        const oldTagIds = oldTags.map((t) => t.news_tag_uuid);

        const tagsToAdd = tags.filter((id: string) => !oldTagIds.includes(id));
        const tagsToRemove = oldTagIds.filter((id) => !tags.includes(id));

        await tx.newsUtamaTag.deleteMany({
          where: { news_utama_uuid: uuid },
        });

        if (tags.length > 0) {
          await tx.newsUtamaTag.createMany({
            data: tags.map((tagUuid: string) => ({
              news_utama_uuid: uuid,
              news_tag_uuid: tagUuid,
            })),
          });
        }

        if (tagsToAdd.length > 0) {
          await tx.newsTag.updateMany({
            where: { uuid: { in: tagsToAdd } },
            data: { jumlah_penggunaan: { increment: 1 } },
          });
        }

        if (tagsToRemove.length > 0) {
          await tx.newsTag.updateMany({
            where: { uuid: { in: tagsToRemove } },
            data: { jumlah_penggunaan: { decrement: 1 } },
          });
        }
      }

      // ===== UPDATE KATEGORI (only if provided) =====
      if (kategori !== undefined) {
        await tx.newsUtamaKategori.deleteMany({
          where: { news_utama_uuid: uuid },
        });

        if (kategori.length > 0) {
          await tx.newsUtamaKategori.createMany({
            data: kategori.map((kategoriUuid: string) => ({
              news_utama_uuid: uuid,
              news_kategori_uuid: kategoriUuid,
            })),
          });
        }
      }

      // ===== UPDATE ALBUM GALERI (only if provided) =====
      if (albumList !== undefined) {
        const existingAlbums = await tx.albumGaleri.findMany({
          where: { newsUtamaUuid: uuid },
          select: { uuid: true },
        });
        const existingAlbumUuids = existingAlbums.map((a: { uuid: string }) => a.uuid);
        
        const incomingAlbumUuids = albumList.filter((a: any) => a.uuid).map((a: any) => a.uuid);
        const albumsToDetach = existingAlbumUuids.filter(id => !incomingAlbumUuids.includes(id));
        
        // Detach removed albums rather than hard delete, allowing safe reuse
        if (albumsToDetach.length > 0) {
          await tx.albumGaleri.updateMany({
            where: { uuid: { in: albumsToDetach } },
            data: { newsUtamaUuid: null }
          });
        }
        
        // Upsert albums sequentially
        for (const album of albumList) {
          if (album.uuid) {
            // Update & Attach
            await tx.albumGaleri.update({
              where: { uuid: album.uuid },
              data: {
                newsUtamaUuid: uuid, // Ensure it's correctly attached
                namaAlbum: album.namaAlbum,
                deskripsi: album.deskripsi || null,
                tanggalKegiatan: new Date(album.tanggalKegiatan),
                update_by: userUuid,
              },
            });
            
            // Handle mediaList for this album
            if (album.mediaList !== undefined) {
               // Simply delete all media and recreate for simplicity to guarantee order and sync
               await tx.mediaGaleri.deleteMany({ where: { albumUuid: album.uuid } });
               if (album.mediaList.length > 0) {
                 await tx.mediaGaleri.createMany({
                   data: album.mediaList.map((m: any, idx: number) => ({
                     albumUuid: album.uuid,
                     tipeMedia: m.tipeMedia,
                     urlMedia: m.urlMedia,
                     thumbnail: m.thumbnail || null,
                     keterangan: m.keterangan || null,
                     urutan: idx + 1,
                     insert_by: userUuid, // We set insert_by because we're technically re-creating
                   })),
                 });
               }
            }
          } else {
            // Create
            await tx.albumGaleri.create({
              data: {
                newsUtamaUuid: uuid,
                namaAlbum: album.namaAlbum,
                deskripsi: album.deskripsi || null,
                tanggalKegiatan: new Date(album.tanggalKegiatan),
                isPublic: true,
                insert_by: userUuid,
                ...(album.mediaList && album.mediaList.length > 0 && {
                  mediaList: {
                    create: album.mediaList.map((m: any, idx: number) => ({
                      tipeMedia: m.tipeMedia,
                      urlMedia: m.urlMedia,
                      thumbnail: m.thumbnail || null,
                      keterangan: m.keterangan || null,
                      urutan: idx + 1,
                      insert_by: userUuid,
                    })),
                  },
                }),
              },
            });
          }
        }
      }

      return updatedNews;
    });

    await clearCachePattern("cache:*:*/newsUtama*");
    await clearCachePattern("cache:*:*/page/*");

    return res.json({
      message: "News utama updated successfully",
      data: result,
    });

  } catch (error: any) {
    console.error(error);

    return res.status(500).json({
      message: "Failed to update news utama",
      error: error.message,
    });
  }
};

export const archiveNewsUtama = async (req: Request, res: Response) => {
  try {
    const uuid = req.params.uuid as string;

    await prisma.newsUtama.update({
      where: { uuid },
      data: {
        statusNewsUtama: "ARCHIVED",
      },
    });

    await clearCachePattern("cache:*:*/newsUtama*");
    await clearCachePattern("cache:*:*/page/*");

    return res.status(200).json(
      ApiResponse.success({
        message: "News utama successfully archived",
      })
    );
  } catch (error) {
    res.status(500).json({ error: "Failed to archive news utama" });
  }
};
