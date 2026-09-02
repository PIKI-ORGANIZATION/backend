import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { ApiResponse } from "../utils/apiResponse";

////////////////////////////////////////////////////
// GET MEDIA BY ALBUM
////////////////////////////////////////////////////
export const getMediaByAlbum = async (req: Request, res: Response) => {
  try {
    const { albumUuid } = req.params;

    const data = await prisma.mediaGaleri.findMany({
      where: { albumUuid },
      orderBy: { urutan: "asc" },
    });

    return res.status(200).json(ApiResponse.success(data));
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

////////////////////////////////////////////////////
// CREATE MEDIA (WAJIB ADA ALBUM)
////////////////////////////////////////////////////
export const createMediaGaleri = async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const data = Array.isArray(req.body) ? req.body : [req.body];

    ////////////////////////////////////////////////////
    // VALIDASI ALBUM
    ////////////////////////////////////////////////////
    const albumUuids = [...new Set(data.map((d) => d.albumUuid))];

    const albums = await prisma.albumGaleri.findMany({
      where: { uuid: { in: albumUuids } },
      select: { uuid: true },
    });

    const foundUuids = albums.map((a) => a.uuid);

    const notFound = albumUuids.filter(
      (uuid) => !foundUuids.includes(uuid)
    );

    if (notFound.length > 0) {
      return res.status(400).json({
        message: "Beberapa album tidak ditemukan",
        invalidAlbumUuids: notFound,
      });
    }

    ////////////////////////////////////////////////////
    // GROUPING DATA PER ALBUM
    ////////////////////////////////////////////////////
    const grouped: Record<string, any[]> = {};

    data.forEach((item) => {
      if (!grouped[item.albumUuid]) {
        grouped[item.albumUuid] = [];
      }
      grouped[item.albumUuid].push(item);
    });

    ////////////////////////////////////////////////////
    // GENERATE URUTAN
    ////////////////////////////////////////////////////
    const finalData: any[] = [];

    for (const albumUuid of Object.keys(grouped)) {
      const items = grouped[albumUuid];

      // ambil urutan terbesar saat ini
      const lastMedia = await prisma.mediaGaleri.findFirst({
        where: { albumUuid },
        orderBy: { urutan: "desc" },
        select: { urutan: true },
      });

      let start = lastMedia?.urutan ?? -1;

      items.forEach((item, index) => {
        finalData.push({
          ...item,
          urutan: start + index + 1,
          insert_by: user.sub,
        });
      });
    }

    ////////////////////////////////////////////////////
    // CREATE
    ////////////////////////////////////////////////////
    const result = await prisma.mediaGaleri.createMany({
      data: finalData,
    });

    return res.status(201).json(
      ApiResponse.success({
        message: `${result.count} media berhasil ditambahkan`,
      })
    );
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

////////////////////////////////////////////////////
// UPDATE
////////////////////////////////////////////////////
export const updateMediaGaleri = async (req: Request, res: Response) => {
  try {
    const { uuid } = req.params;
    const user = req.user!;

    const updated = await prisma.mediaGaleri.update({
      where: { uuid },
      data: {
        ...req.body,
        update_by: user.sub,
      },
    });

    return res.status(200).json(
      ApiResponse.success({
        message: "Media berhasil diupdate",
        data: updated,
      })
    );
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

////////////////////////////////////////////////////
// DELETE HARD
////////////////////////////////////////////////////
export const deleteMediaGaleri = async (req: Request, res: Response) => {
  try {
    const { uuid } = req.params;

    await prisma.mediaGaleri.delete({
      where: { uuid },
    });

    return res.status(200).json(
      ApiResponse.success({
        message: "Media berhasil dihapus",
      })
    );
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
