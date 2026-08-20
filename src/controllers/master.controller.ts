import { Request, Response } from "express";
import { prisma } from "../config/prisma";

export const getMasterPendidikan = async (req: Request, res: Response) => {
  try {
    const { search } = req.query as { search?: string };
    const data = await prisma.masterPendidikan.findMany({
      where: search ? { nama: { contains: search, mode: "insensitive" } } : undefined,
      orderBy: { nama: "asc" },
    });
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: "Gagal mengambil data pendidikan" });
  }
};

export const createMasterPendidikan = async (req: Request, res: Response) => {
  try {
    const { nama } = req.body;
    if (!nama) return res.status(400).json({ message: "Nama diperlukan" });
    const data = await prisma.masterPendidikan.create({ data: { nama } });
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ message: "Gagal menyimpan data" });
  }
};

export const getMasterPekerjaan = async (req: Request, res: Response) => {
  try {
    const { search } = req.query as { search?: string };
    const data = await prisma.masterPekerjaan.findMany({
      where: search ? { nama: { contains: search, mode: "insensitive" } } : undefined,
      orderBy: { nama: "asc" },
    });
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: "Gagal mengambil data pekerjaan" });
  }
};

export const createMasterPekerjaan = async (req: Request, res: Response) => {
  try {
    const { nama } = req.body;
    if (!nama) return res.status(400).json({ message: "Nama diperlukan" });
    const data = await prisma.masterPekerjaan.create({ data: { nama } });
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ message: "Gagal menyimpan data" });
  }
};

export const getMasterBidangStudi = async (req: Request, res: Response) => {
  try {
    const { search } = req.query as { search?: string };
    const data = await prisma.masterBidangStudi.findMany({
      where: search ? { nama: { contains: search, mode: "insensitive" } } : undefined,
      orderBy: { nama: "asc" },
    });
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: "Gagal mengambil data bidang studi" });
  }
};

export const createMasterBidangStudi = async (req: Request, res: Response) => {
  try {
    const { nama } = req.body;
    if (!nama) return res.status(400).json({ message: "Nama diperlukan" });
    const data = await prisma.masterBidangStudi.create({ data: { nama } });
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ message: "Gagal menyimpan data" });
  }
};

export const getMasterBidangMinat = async (req: Request, res: Response) => {
  try {
    const { search } = req.query as { search?: string };
    const data = await prisma.masterBidangMinat.findMany({
      where: search ? { nama: { contains: search, mode: "insensitive" } } : undefined,
      orderBy: { nama: "asc" },
    });
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: "Gagal mengambil data bidang minat" });
  }
};

export const createMasterBidangMinat = async (req: Request, res: Response) => {
  try {
    const { nama } = req.body;
    if (!nama) return res.status(400).json({ message: "Nama diperlukan" });
    const data = await prisma.masterBidangMinat.create({ data: { nama } });
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ message: "Gagal menyimpan data" });
  }
};



export const getWilayahProvinces = async (req: Request, res: Response) => {
  try {
    const response = await fetch("https://wilayah.id/api/provinces.json");
    if (!response.ok) throw new Error("Failed to fetch provinces");
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: "Gagal mengambil data provinsi" });
  }
};

let cachedAllRegencies: any = null;

export const getAllWilayahRegencies = async (req: Request, res: Response) => {
  try {
    if (cachedAllRegencies) {
      return res.json(cachedAllRegencies);
    }
    const response = await fetch("https://wilayah.id/api/provinces.json");
    if (!response.ok) throw new Error("Failed to fetch provinces");
    const provData = await response.json();
    const provinces = provData.data || [];
    
    const promises = provinces.map((p: any) => 
      fetch(`https://wilayah.id/api/regencies/${p.code}.json`)
        .then(r => r.json())
        .then(rJson => rJson.data || [])
        .catch(() => [])
    );
    
    const results = await Promise.all(promises);
    cachedAllRegencies = { data: results.flat() };
    res.json(cachedAllRegencies);
  } catch (error) {
    res.status(500).json({ message: "Gagal mengambil semua data kota/kabupaten" });
  }
};

export const getWilayahRegencies = async (req: Request, res: Response) => {
  try {
    const { provinceId } = req.params;
    const response = await fetch(`https://wilayah.id/api/regencies/${provinceId}.json`);
    if (!response.ok) throw new Error("Failed to fetch regencies");
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: "Gagal mengambil data kota/kabupaten" });
  }
};
