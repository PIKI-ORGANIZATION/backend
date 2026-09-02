import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import type { Prisma } from "@prisma/client";

// Shared include for permission relations
const withPermissions = {
  permissions: {
    include: {
      permission: {
        select: {
          uuid: true,
          namaPermission: true,
          deskripsi: true,
          statusPermission: true,
        },
      },
    },
  },
} satisfies Prisma.RoleInclude;

type RoleWithPermissions = Prisma.RoleGetPayload<{ include: typeof withPermissions }>;

/** Flatten PermissionRole join into a simple `permissions` array */
function flattenPermissions(role: RoleWithPermissions) {
  const { permissions: permRoles, ...rest } = role;
  return {
    ...rest,
    permissions: permRoles.map((pr) => pr.permission),
  };
}

// GET /roles
export const getRoles = async (req: Request, res: Response) => {
  try {
    const { search, currentPage, pageSize } = req.query as {
      search?: string;
      currentPage?: string;
      pageSize?: string;
    };

    const page = Number(currentPage) || 1;
    const size = Number(pageSize) || 10;
    const skip = (page - 1) * size;

    const where: Prisma.RoleWhereInput = {};
    if (search) {
      where.OR = [
        { namaRole: { contains: search, mode: "insensitive" } },
        { deskripsi: { contains: search, mode: "insensitive" } },
      ];
    }

    const [roles, total] = await Promise.all([
      prisma.role.findMany({
        where,
        include: withPermissions,
        skip,
        take: size,
        orderBy: { insert_at: "desc" }
      }),
      prisma.role.count({ where }),
    ]);

    res.json({
      result: roles.map(flattenPermissions),
      pagination: { currentPage: page, pageSize: size, total },
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch roles" });
  }
};

// GET /roles/:uuid
export const getRoleById = async (req: Request, res: Response) => {
  try {
    const uuid = req.params.uuid as string;
    const role = await prisma.role.findUnique({
      where: { uuid },
      include: withPermissions,
    });

    if (!role) return res.status(404).json({ error: "Role not found" });
    res.json(flattenPermissions(role));
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch role" });
  }
};

// GET /roles/name/:name
export const getRoleByName = async (req: Request, res: Response) => {
  try {
    const nama = req.params.nama as string;
    const role = await prisma.role.findUnique({
      where: { namaRole: nama.toUpperCase() },
      include: withPermissions,
    });

    if (!role) return res.status(404).json({ error: "Role not found" });
    res.json(flattenPermissions(role));
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch role" });
  }
};

// POST /roles
export const createRole = async (req: Request, res: Response) => {
  try {
    const { nama, deskripsi, permissionUuids } = req.body;

    const role = await prisma.$transaction(async (tx) => {
      const newRole = await tx.role.create({
        data: { namaRole: (nama as string).toUpperCase(), deskripsi },
      });

      if (Array.isArray(permissionUuids) && permissionUuids.length > 0) {
        await tx.permissionRole.createMany({
          data: permissionUuids.map((permUuid: string) => ({
            permissionUuid: permUuid,
            roleUuid: newRole.uuid,
          })),
          skipDuplicates: true,
        });
      }

      return tx.role.findUniqueOrThrow({
        where: { uuid: newRole.uuid },
        include: withPermissions,
      });
    });

    res.status(201).json(flattenPermissions(role));
  } catch (error) {
    res.status(500).json({ error: "Failed to create role" });
  }
};

// POST /roles/:uuid/update
export const updateRole = async (req: Request, res: Response) => {
  try {
    const uuid = req.params.uuid as string;
    const { nama, deskripsi, status, permissionUuids } = req.body;

    if (status && !["ACTIVE", "INACTIVE"].includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    const role = await prisma.$transaction(async (tx) => {
      const updateData: Record<string, unknown> = {};
      if (nama) updateData.namaRole = (nama as string).toUpperCase();
      if (deskripsi !== undefined) updateData.deskripsi = deskripsi;
      if (status && status !== "") updateData.statusRole = status;

      await tx.role.update({ where: { uuid }, data: updateData });

      // Sync permissions if provided (delete-and-recreate)
      if (Array.isArray(permissionUuids)) {
        await tx.permissionRole.deleteMany({ where: { roleUuid: uuid } });

        if (permissionUuids.length > 0) {
          await tx.permissionRole.createMany({
            data: permissionUuids.map((permUuid: string) => ({
              permissionUuid: permUuid,
              roleUuid: uuid,
            })),
            skipDuplicates: true,
          });
        }
      }

      return tx.role.findUniqueOrThrow({
        where: { uuid },
        include: withPermissions,
      });
    });

    res.json(flattenPermissions(role));
  } catch (error) {
    res.status(500).json({ error: "Failed to update role" });
  }
};

// POST /roles/:uuid/delete (soft delete)
export const deleteRole = async (req: Request, res: Response) => {
  try {
    const uuid = req.params.uuid as string;
    await prisma.role.update({
      where: { uuid },
      data: { statusRole: "INACTIVE" },
    });
    res.json({ message: "Role deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete role" });
  }
};
