import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import bcrypt from "bcrypt";
import { ApiResponse } from "../utils/apiResponse";

////////////////////////////////////////////////////
// GET ALL AKUN
////////////////////////////////////////////////////
export const getAkuns = async (req: Request, res: Response) => {
  try {
    const { search, statusAkun, currentPage, pageSize } = req.query as {
      search?: string;
      statusAkun?: string;
      currentPage?: string;
      pageSize?: string;
    };

    const scope = req.scope;

    const page = Number(currentPage) || 1;
    const size = Number(pageSize) || 10;
    const skip = (page - 1) * size;

    const whereCondition: any = {};

    ////////////////////////////////////////////////////
    // 🔍 SEARCH
    ////////////////////////////////////////////////////
    if (search) {
      whereCondition.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { username: { contains: search, mode: "insensitive" } },
      ];
    }

    ////////////////////////////////////////////////////
    // 🔍 STATUS FILTER
    ////////////////////////////////////////////////////
    if (statusAkun) {
      whereCondition.statusAkun = statusAkun;
    }

    ////////////////////////////////////////////////////
    // 🔥 ROLE BASED (SCOPE)
    ////////////////////////////////////////////////////

    if (!scope?.isAdmin) {
      // ❌ PUBLIC TIDAK BOLEH
      return res.status(403).json({
        message: "Forbidden - Public tidak boleh akses akun",
      });
    }

    if (!scope.isSuperAdmin) {
      // 🛠 ADMIN CABANG
      whereCondition.anggota = {
        is: {
          cabangUuid: scope.cabangId,
        },
      };
    }

    ////////////////////////////////////////////////////

    const total = await prisma.akun.count({
      where: whereCondition,
    });

    const akuns = await prisma.akun.findMany({
      where: whereCondition,
      include: {
        anggota: true,
        roles: {
          include: { role: true },
        },
      },
      skip,
      take: size,
    });

    const result = akuns.map((akunItem: any) => {
      const { password, roles, ...safeAkun } = akunItem;

      return {
        ...safeAkun,
        roles: roles.map((r: any) => r.role),
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
      message: "Failed to fetch akuns",
      error: error.message,
    });
  }
};

////////////////////////////////////////////////////
// GET AKUN BY UUID
////////////////////////////////////////////////////
export const getAkunById = async (req: Request, res: Response) => {
  try {
    const uuid = req.params.uuid as string;

    const akun = await prisma.akun.findUnique({
      where: { uuid: String(uuid) },
      include: {
        anggota: true,
        roles: {
          include: { role: true },
        },
      },
    });

    if (!akun) {
      return res.status(404).json({ message: "Akun not found" });
    }

    const akunObj = { ...akun } as any;
    delete akunObj.password;
    delete akunObj.roles;

    res.json({
      ...akunObj,
      roles: akun.roles.map((r: any) => r.role),
    });
  } catch {
    res.status(500).json({ message: "Failed to fetch akun" });
  }
};

////////////////////////////////////////////////////
// GET AKUN BY IDENTIFIER (email / username)
////////////////////////////////////////////////////
export const getAkunByIdentifier = async (
  req: Request,
  res: Response
) => {
  try {
    const identifier = req.params.identifier as string;

    const akun = await prisma.akun.findFirst({
      where: {
        OR: [
          { email: identifier },
          { username: identifier },
        ],
      },
      include: {
        anggota: true,
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!akun) {
      return res.status(404).json({
        message: "Akun not found",
      });
    }

    const akunObj = { ...akun } as any;
    delete akunObj.password;
    delete akunObj.roles;

    return res.json({
      ...akunObj,
      roles: akun.roles.map((r: any) => r.role),
    });
  } catch (error: any) {
    return res.status(500).json({
      message: error.message || "Failed to fetch akun by identifier",
    });
  }
};

////////////////////////////////////////////////////
// CREATE AKUN (ADMIN ONLY)
////////////////////////////////////////////////////
  export const createAkun = async (req: Request, res: Response) => {
    try {
      const { email, username, password, anggotaUuid, roleUuids } = req.body;
  
      if (!email || !username || !password || !anggotaUuid) {
        return res.status(400).json({
          message: "email, username, password dan anggotaUuid wajib diisi",
        });
      }
  
      const existing = await prisma.akun.findFirst({
        where: {
          OR: [{ email }, { username }],
        },
      });
  
      if (existing) {
        return res.status(409).json({
          message: "Email atau username sudah terdaftar",
        });
      }
  
      const hashedPassword = await bcrypt.hash(password, 10);
  
      const akun = await prisma.$transaction(async (tx) => {
        const created = await tx.akun.create({
          data: {
            email,
            username,
            password: hashedPassword,
            anggotaUuid,
          },
        });
  
        if (roleUuids && Array.isArray(roleUuids) && roleUuids.length > 0) {
          // Add provided roles
          const rolesData = roleUuids.map((uuid: string) => ({
            akunUuid: created.uuid,
            roleUuid: uuid,
          }));
          await tx.akunRole.createMany({ data: rolesData });
        } else {
          // Default to USER role if no roles provided
          const roleUser = await tx.role.findUnique({
            where: { namaRole: "USER" },
          });
          
          if (roleUser) {
            await tx.akunRole.create({
              data: {
                akunUuid: created.uuid,
                roleUuid: roleUser.uuid,
              },
            });
          }
        }
  
        return created;
      });

    const { password: _, ...safeAkun } = akun;

    res.status(201).json(safeAkun);
  } catch (error: any) {
    res.status(500).json({
      message: error.message || "Failed to create akun",
    });
  }
};

////////////////////////////////////////////////////
// UPDATE AKUN
////////////////////////////////////////////////////
  export const updateAkun = async (req: Request, res: Response) => {
    try {
      const uuid = String(req.params.uuid);
      const { email, username, password, statusAkun, roleUuids } = req.body;
  
      let hashedPassword: string | undefined;
      if (password) {
        hashedPassword = await bcrypt.hash(password, 10);
      }
  
      const data: any = {
        email,
        username,
        statusAkun,
      };
  
      if (hashedPassword) {
        data.password = hashedPassword;
      }
  
      Object.keys(data).forEach(
        (key) => data[key] === undefined && delete data[key]
      );
  
      const updated = await prisma.$transaction(async (tx) => {
        const result = await tx.akun.update({
          where: { uuid },
          data,
        });

        if (roleUuids && Array.isArray(roleUuids)) {
          // Delete old roles
          await tx.akunRole.deleteMany({
            where: { akunUuid: uuid },
          });

          // Insert new roles
          if (roleUuids.length > 0) {
            const rolesData = roleUuids.map((roleUuid: string) => ({
              akunUuid: uuid,
              roleUuid: roleUuid,
            }));
            await tx.akunRole.createMany({ data: rolesData });
          }
        }
        return result;
      });
  
      const { password: _, ...safeAkun } = updated;

    res.json(safeAkun);
  } catch (error: any) {
    res.status(500).json({
      message: error.message || "Failed to update akun",
    });
  }
};

////////////////////////////////////////////////////
// SOFT DELETE
////////////////////////////////////////////////////
export const deleteAkun = async (req: Request, res: Response) => {
  try {
    const uuid = req.params.uuid as string;

    await prisma.akun.update({
      where: { uuid },
      data: { statusAkun: "INACTIVE" },
    });

    res.json({ message: "Akun dinonaktifkan" });
  } catch {
    res.status(500).json({ message: "Failed to delete akun" });
  }
};
