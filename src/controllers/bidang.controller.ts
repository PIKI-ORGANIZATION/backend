import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { ApiResponse } from "../utils/apiResponse";

////////////////////////////////////////////////////
// GET ALL BIDANG
////////////////////////////////////////////////////
// export const getBidang = async (req: Request, res: Response) => {
//   try {
//     const { search, currentPage, pageSize } = req.query as any;

//     const page = Number(currentPage) || 1;
//     const size = Number(pageSize) || 10;
//     const skip = (page - 1) * size;

//     const where: any = {};

//     if (search) {
//       where.namaBidang = {
//         contains: search,
//         mode: "insensitive",
//       };
//     }

//     const total = await prisma.bidang.count({ where });

//     const data = await prisma.bidang.findMany({
//       where,
//       orderBy: { namaBidang: "asc" },
//       skip,
//       take: size,
//     });

//     return res.status(200).json(
//       ApiResponse.success({
//         result: data,
//         pagination: { currentPage: page, pageSize: size, total },
//       })
//     );
//   } catch (error: any) {
//     res.status(500).json({ message: error.message });
//   }
// };

export const getBidang = async (req: Request, res: Response) => {
  try {
    const { search, currentPage, pageSize, fixed } = req.query as any;

    const scope = req.scope;

    const page = Number(currentPage) || 1;
    const size = Number(pageSize) || 10;
    const skip = (page - 1) * size;

    const where: any = {};

    ////////////////////////////////////////////////////
    // SEARCH
    ////////////////////////////////////////////////////
    if (search) {
      where.namaBidang = {
        contains: search,
        mode: "insensitive",
      };
    }

    const includeAll = fixed?.toLowerCase() === "all";

    ////////////////////////////////////////////////////
    // ROLE BASED (VIA RELATION)
    ////////////////////////////////////////////////////

    if (!scope?.isAdmin) {
      // 🌍 PUBLIC → hanya yang punya struktur aktif
      where.strukturList = {
        some: {
          periode: {
            isAktif: true,
          },
        },
      };
    } else {
      // ADMIN

      where.strukturList = {
        some: {
          ...( !scope.isSuperAdmin && {
            periode: {
              cabangUuid: scope.cabangId,
            },
          }),
          ...( !includeAll && {
            periode: {
              ...( !scope.isSuperAdmin && { cabangUuid: scope.cabangId }),
              isAktif: true,
            },
          }),
        },
      };
    }

    ////////////////////////////////////////////////////

    const total = await prisma.bidang.count({ where });

    const data = await prisma.bidang.findMany({
      where,
      orderBy: { namaBidang: "asc" },
      skip,
      take: size,
    });

    return res.status(200).json(
      ApiResponse.success({
        result: data,
        pagination: { currentPage: page, pageSize: size, total },
      })
    );
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

////////////////////////////////////////////////////
// GET BY ID
////////////////////////////////////////////////////
export const getBidangById = async (req: Request, res: Response) => {
  try {
    const { uuid } = req.params;

    const data = await prisma.bidang.findUnique({
      where: { uuid },
    });

    if (!data) {
      return res.status(404).json({ message: "Bidang not found" });
    }

    return res.status(200).json(ApiResponse.success(data));
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

////////////////////////////////////////////////////
// CREATE
////////////////////////////////////////////////////
export const createBidang = async (req: Request, res: Response) => {
  try {
    const user = req.user!;

    // Support single object or array of objects
    const dataArray = Array.isArray(req.body) ? req.body : [req.body];

    const result = await prisma.bidang.createMany({
      data: dataArray.map((item) => ({
        ...item,
        insert_by: user.sub,
      })),
      skipDuplicates: true,
    });

    return res.status(201).json(
      ApiResponse.success({
        message: `${result.count} bidang berhasil dibuat`,
      })
    );
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

////////////////////////////////////////////////////
// UPDATE
////////////////////////////////////////////////////
export const updateBidang = async (req: Request, res: Response) => {
  try {
    const { uuid } = req.params;
    const user = req.user!;

    const updated = await prisma.bidang.update({
      where: { uuid },
      data: {
        ...req.body,
        update_by: user.sub,
      },
    });

    return res.status(200).json(
      ApiResponse.success({
        message: "Berhasil update bidang",
        data: updated,
      })
    );
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

////////////////////////////////////////////////////
// DELETE
////////////////////////////////////////////////////
export const deleteBidang = async (req: Request, res: Response) => {
  try {
    const { uuid } = req.params;

    await prisma.bidang.delete({
      where: { uuid },
    });

    return res.status(200).json(
      ApiResponse.success({
        message: "Bidang berhasil dihapus",
      })
    );
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};