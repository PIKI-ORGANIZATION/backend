import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { ApiResponse } from "../utils/apiResponse";

////////////////////////////////////////////////////
// GET ALL JABATAN
////////////////////////////////////////////////////
// export const getJabatan = async (req: Request, res: Response) => {
//   try {
//     const { search, currentPage, pageSize } = req.query as any;

//     const page = Number(currentPage) || 1;
//     const size = Number(pageSize) || 10;
//     const skip = (page - 1) * size;

//     const where: any = {};

//     if (search) {
//       where.namaJabatan = {
//         contains: search,
//         mode: "insensitive",
//       };
//     }

//     const total = await prisma.jabatan.count({ where });

//     const data = await prisma.jabatan.findMany({
//       where,
//       orderBy: { levelJabatan: "asc" },
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

export const getJabatan = async (req: Request, res: Response) => {
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
      where.namaJabatan = {
        contains: search,
        mode: "insensitive",
      };
    }

    const includeAll = fixed?.toLowerCase() === "all";

    ////////////////////////////////////////////////////
    // ROLE BASED (VIA RELATION)
    ////////////////////////////////////////////////////

    if (!scope?.isAdmin) {
      where.strukturList = {
        some: {
          periode: {
            isAktif: true,
          },
        },
      };
    } else {
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

    const total = await prisma.jabatan.count({ where });

    const data = await prisma.jabatan.findMany({
      where,
      orderBy: { levelJabatan: "asc" },
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
export const getJabatanById = async (req: Request, res: Response) => {
  try {
    const { uuid } = req.params;

    const data = await prisma.jabatan.findUnique({
      where: { uuid },
    });

    if (!data) {
      return res.status(404).json({ message: "Jabatan not found" });
    }

    return res.status(200).json(ApiResponse.success(data));
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

////////////////////////////////////////////////////
// CREATE
////////////////////////////////////////////////////
export const createJabatan = async (req: Request, res: Response) => {
  try {
    const user = req.user!;

    // Support single object or array of objects
    const dataArray = Array.isArray(req.body) ? req.body : [req.body];

    const result = await prisma.jabatan.createMany({
      data: dataArray.map((item) => ({
        ...item,
        insert_by: user.sub,
      })),
      skipDuplicates: true,
    });

    return res.status(201).json(
      ApiResponse.success({
        message: `${result.count} jabatan berhasil dibuat`,
      })
    );
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

////////////////////////////////////////////////////
// UPDATE
////////////////////////////////////////////////////
export const updateJabatan = async (req: Request, res: Response) => {
  try {
    const { uuid } = req.params;
    const user = req.user!;

    const updated = await prisma.jabatan.update({
      where: { uuid },
      data: {
        ...req.body,
        update_by: user.sub,
      },
    });

    return res.status(200).json(
      ApiResponse.success({
        message: "Berhasil update jabatan",
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
export const deleteJabatan = async (req: Request, res: Response) => {
  try {
    const { uuid } = req.params;

    await prisma.jabatan.delete({
      where: { uuid },
    });

    return res.status(200).json(
      ApiResponse.success({
        message: "Jabatan berhasil dihapus",
      })
    );
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
