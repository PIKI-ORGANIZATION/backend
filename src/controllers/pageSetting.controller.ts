import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { ApiResponse } from "../utils/apiResponse";

////////////////////////////////////////////////////
// GET ALL
////////////////////////////////////////////////////
export const getPageSetting = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      search,
      currentPage,
      pageSize,
      tableFilter,
    } = req.query as any;

    const page = Number(currentPage) || 1;
    const size = Number(pageSize) || 10;
    const skip = (page - 1) * size;

    // =================================================
    // DEFAULT FILTER
    // =================================================
    const whereCondition: any = {};

    // =================================================
    // SEARCH
    // =================================================
    if (search) {
      whereCondition.OR = [
        {
          key: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          nama: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          value: {
            contains: search,
            mode: "insensitive",
          },
        },
      ];
    }

    // =================================================
    // TABLE FILTER OVERRIDE
    // =================================================
    if (tableFilter) {
      Object.keys(tableFilter).forEach((key) => {
        const value = tableFilter[key];

        if (
          value !== undefined &&
          value !== null &&
          value !== ""
        ) {
          if (Array.isArray(value)) {
            whereCondition[key] = {
              in: value,
            };
          } else {
            whereCondition[key] = value;
          }
        }
      });
    }

    const total = await prisma.pageSetting.count({
      where: whereCondition,
    });

    const data = await prisma.pageSetting.findMany({
      where: whereCondition,
      orderBy: {
        insert_at: "desc",
      },
      skip,
      take: size,
    });

    return res.status(200).json(
      ApiResponse.success({
        result: data,
        pagination: {
          currentPage: page,
          pageSize: size,
          total,
        },
      })
    );

  } catch (error: any) {

    res.status(500).json({
      message: error.message,
    });
  }
};

////////////////////////////////////////////////////
// GET BY ID
////////////////////////////////////////////////////
export const getPageSettingById = async (
  req: Request,
  res: Response
) => {
  try {
    const { uuid } = req.params;

    const data = await prisma.pageSetting.findUnique({
      where: { uuid },
    });

    if (!data) {
      return res.status(404).json({
        message: "Page setting not found",
      });
    }

    return res.status(200).json(
      ApiResponse.success({
        data,
      })
    );

  } catch (error: any) {

    res.status(500).json({
      message: error.message,
    });
  }
};

////////////////////////////////////////////////////
// GET BY KEY (public)
////////////////////////////////////////////////////
export const getPageSettingByKey = async (
  req: Request,
  res: Response
) => {
  try {
    const { key } = req.params;

    const data = await prisma.pageSetting.findUnique({
      where: { key },
    });

    if (!data) {
      return res.status(404).json({
        message: "Page setting not found",
      });
    }

    return res.status(200).json(
      ApiResponse.success({
        data,
      })
    );

  } catch (error: any) {

    res.status(500).json({
      message: error.message,
    });
  }
};

////////////////////////////////////////////////////
// GET BULK BY KEYS (public)
////////////////////////////////////////////////////
export const getBulkPageSettings = async (
  req: Request,
  res: Response
) => {
  try {
    const { keys } = req.query;

    if (!keys || typeof keys !== "string") {
      return res.status(400).json({
        message: "Query parameter 'keys' is required (comma-separated)",
      });
    }

    const keyList = keys.split(",").map((k) => k.trim()).filter(Boolean);

    if (keyList.length === 0) {
      return res.status(400).json({
        message: "At least one key must be provided",
      });
    }

    const data = await prisma.pageSetting.findMany({
      where: {
        key: { in: keyList },
      },
    });

    return res.status(200).json(
      ApiResponse.success({
        data,
      })
    );

  } catch (error: any) {
    res.status(500).json({
      message: error.message,
    });
  }
};

////////////////////////////////////////////////////
// CREATE
////////////////////////////////////////////////////
export const createPageSetting = async (
  req: Request,
  res: Response
) => {
  try {
    const user = req.user!;

    const data = Array.isArray(req.body)
      ? req.body
      : [req.body];

    const result = await prisma.pageSetting.createMany({
      data: data.map((d) => ({
        ...d,
        insert_by: user.sub,
      })),
    });

    return res.status(201).json(
      ApiResponse.success({
        message: `${result.count} page setting berhasil dibuat`,
      })
    );

  } catch (error: any) {

    if (error.code === "P2002") {
      return res.status(400).json({
        message: "Key already exists",
      });
    }

    res.status(500).json({
      message: error.message,
    });
  }
};

////////////////////////////////////////////////////
// UPDATE
////////////////////////////////////////////////////
export const updatePageSetting = async (
  req: Request,
  res: Response
) => {
  try {
    const { uuid } = req.params;
    const user = req.user!;

    const updated = await prisma.pageSetting.update({
      where: { uuid },

      data: {
        ...req.body,
        update_by: user.sub,
      },
    });

    return res.status(200).json(
      ApiResponse.success({
        message: "Page setting berhasil diupdate",
        data: updated,
      })
    );

  } catch (error: any) {

    if (error.code === "P2002") {
      return res.status(400).json({
        message: "Key already exists",
      });
    }

    res.status(500).json({
      message: error.message,
    });
  }
};

////////////////////////////////////////////////////
// DELETE (HARD DELETE)
////////////////////////////////////////////////////
export const deletePageSetting = async (
  req: Request,
  res: Response
) => {
  try {
    const { uuid } = req.params;

    await prisma.pageSetting.delete({
      where: { uuid },
    });

    return res.status(200).json(
      ApiResponse.success({
        message: "Page setting berhasil dihapus",
      })
    );

  } catch (error: any) {

    res.status(500).json({
      message: error.message,
    });
  }
};
