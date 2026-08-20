import { Request, Response } from "express";
import { prisma } from "../config/prisma";

// GET /permissions
export const getPermissions = async (req: Request, res: Response) => {
  try {
    const permissions = await prisma.permission.findMany();
    res.json(permissions);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch permissions" });
  }
};

// GET /permissions/:uuid
export const getPermissionById = async (req: Request, res: Response) => {
  try {
    const { uuid } = req.params;
    const permission = await prisma.permission.findUnique({
      where: { uuid },
    });

    if (!permission) {
      return res.status(404).json({ error: "Permission not found" });
    }

    res.json(permission);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch permission" });
  }
};

// GET /permissions/name/:name
export const getPermissionByName = async (req: Request, res: Response) => {
  try {
    const { nama } = req.params;
    const namaPermission = nama.toString().toUpperCase();
    const permission = await prisma.permission.findUnique({
      where: { namaPermission },
    });

    if (!permission) {
      return res.status(404).json({ error: "Permission not found" });
    }

    res.json(permission);
  } catch (error) {
        res.status(500).json({ error: "Failed to fetch permission" });
  }
};

export const createPermission = async (req: Request, res: Response) => {
  try {
    const { nama, deskripsi } = req.body;
    const permission = await prisma.permission.create({
      data: { namaPermission: nama.toUpperCase(), deskripsi },
    });
    res.status(201).json(permission);
  } catch (error) {
    res.status(500).json({ error: "Failed to create permission" });
  } 
};

export const updatePermission = async (req: Request, res: Response) => {
  try {
    const { uuid } = req.params;
    const { nama, deskripsi } = req.body;
    const dataUpdate: any = {};

    if (nama) dataUpdate.namaPermission = nama.toUpperCase();
    if (deskripsi !== undefined) dataUpdate.deskripsi = deskripsi;

    Object.keys(dataUpdate).forEach(key => {
      if (dataUpdate[key] === undefined || dataUpdate[key] === "") {
        delete dataUpdate[key];
      }
    });

    const updatedPermission = await prisma.permission.update({
      where: { uuid },
      data: dataUpdate,
    });

    res.json(updatedPermission);
  } catch (error) {
    res.status(500).json({ error: "Failed to update permission" });
  }
};

export const deletePermission = async (req: Request, res: Response) => {
  try {
    const { uuid } = req.params;
    await prisma.permission.update({
        where: { uuid },
        data: { statusPermission: "INACTIVE" },
    });
    res.json({ message: "Permission deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete permission" });
  }
};