import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../config/prisma";
import { ApiResponse } from "../utils/apiResponse";

/** Resolve Anggota UUID from Akun UUID (for audit FK fields) */
async function getAnggotaUuid(akunUuid: string): Promise<string | null> {
  const akun = await prisma.akun.findUnique({
    where: { uuid: akunUuid },
    select: { anggotaUuid: true },
  });
  return akun?.anggotaUuid ?? null;
}

////////////////////////////////////////////////////
// GET ALL ANGGOTA (paginated)
////////////////////////////////////////////////////
export const getAnggotas = async (req: Request, res: Response) => {
  try {
    const {
      search,
      isApprovedByDPC,
      isApprovedByDPP,
      approvalStatus,
      currentPage,
      pageSize,
      pekerjaanUuid,
      pendidikanUuid,
      bidangStudiUuid,
      bidangMinatUuid,
      cabangUuid,
      angkatanFrom,
      angkatanTo,
    } = req.query as {
      search?: string;
      isApprovedByDPC?: string;
      isApprovedByDPP?: string;
      approvalStatus?: string;
      currentPage?: string;
      pageSize?: string;
      pekerjaanUuid?: string | string[];
      pendidikanUuid?: string | string[];
      bidangStudiUuid?: string | string[];
      bidangMinatUuid?: string | string[];
      cabangUuid?: string | string[];
      angkatanFrom?: string;
      angkatanTo?: string;
    };

    const scope = req.scope;

    const page = Number(currentPage) || 1;
    const size = Number(pageSize) || 10;
    const skip = (page - 1) * size;


    const where: any = {};
    const andConditions: any[] = [];

    ////////////////////////////////////////////////////
    // SEARCH
    ////////////////////////////////////////////////////
    if (search) {
      andConditions.push({
        OR: [
          { namaLengkap: { contains: search, mode: "insensitive" } },
          { namaPanggil: { contains: search, mode: "insensitive" } },
          { tempatLahir: { contains: search, mode: "insensitive" } },
          { alamat: { contains: search, mode: "insensitive" } },
          { bio: { contains: search, mode: "insensitive" } },
          { angkatan: { contains: search, mode: "insensitive" } },
          { provinsi: { contains: search, mode: "insensitive" } },
          { kotaDomisili: { contains: search, mode: "insensitive" } },
          { noWa: { contains: search, mode: "insensitive" } },
          { instagram: { contains: search, mode: "insensitive" } },
          { facebook: { contains: search, mode: "insensitive" } },
          { akun: { is: { email: { contains: search, mode: "insensitive" } } } },
          { pendidikanRef: { nama: { contains: search, mode: "insensitive" } } },
          { pekerjaanRef: { nama: { contains: search, mode: "insensitive" } } },
          { bidangStudiRef: { nama: { contains: search, mode: "insensitive" } } },
          { bidangMinatRef: { nama: { contains: search, mode: "insensitive" } } },
          { cabang: { namaCabang: { contains: search, mode: "insensitive" } } },
        ],
      });
    }

    ////////////////////////////////////////////////////
    // FILTERS
    ////////////////////////////////////////////////////
    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

    const extractArray = (q: any, field: string): string | string[] | undefined => {
      if (Array.isArray(q[field])) return q[field];
      
      // Handle comma-separated strings from simple-rest data provider
      if (typeof q[field] === 'string') {
        if (q[field].includes(',')) {
          return q[field].split(',').map((s: string) => s.trim());
        }
        return q[field];
      }
      
      const arr: string[] = [];
      let i = 0;
      while (q[`${field}[${i}]`] !== undefined) {
        arr.push(q[`${field}[${i}]`]);
        i++;
      }
      return arr.length > 0 ? arr : undefined;
    };
    
    const buildUuidCondition = (field: string, queryObj: any) => {
      const value = extractArray(queryObj, field);
      if (Array.isArray(value)) {
        const validUuids = value.filter(v => typeof v === 'string' && uuidRegex.test(v));
        if (validUuids.length > 0) return { [field]: { in: validUuids } };
      } else if (typeof value === 'string' && uuidRegex.test(value)) {
        return { [field]: value };
      }
      return null;
    };

    const pekerjaanCond = buildUuidCondition('pekerjaanUuid', req.query);
    if (pekerjaanCond) andConditions.push(pekerjaanCond);

    const pendidikanCond = buildUuidCondition('pendidikanUuid', req.query);
    if (pendidikanCond) andConditions.push(pendidikanCond);

    const bidangStudiCond = buildUuidCondition('bidangStudiUuid', req.query);
    if (bidangStudiCond) andConditions.push(bidangStudiCond);

    const bidangMinatCond = buildUuidCondition('bidangMinatUuid', req.query);
    if (bidangMinatCond) andConditions.push(bidangMinatCond);

    const cabangCond = buildUuidCondition('cabangUuid', req.query);
    if (cabangCond) andConditions.push(cabangCond);

    // Angkatan range filter
    if (angkatanFrom || angkatanTo) {
      const angkatanCondition: any = {};
      if (angkatanFrom) angkatanCondition.gte = String(angkatanFrom);
      if (angkatanTo) angkatanCondition.lte = String(angkatanTo);
      andConditions.push({ angkatan: angkatanCondition });
    }

    ////////////////////////////////////////////////////
    // OPTIONAL FILTER (ADMIN ONLY)
    ////////////////////////////////////////////////////
    if (approvalStatus === "pending") {
      andConditions.push({
        OR: [
          { isApprovedByDPC: false },
          { isApprovedByDPP: false },
        ]
      });
    } else if (approvalStatus === "approved") {
      andConditions.push({
        isApprovedByDPC: true,
        isApprovedByDPP: true,
      });
    }

    if (isApprovedByDPC !== undefined) {
      andConditions.push({ isApprovedByDPC: isApprovedByDPC === "true" });
    }

    if (isApprovedByDPP !== undefined) {
      andConditions.push({ isApprovedByDPP: isApprovedByDPP === "true" });
    }

    ////////////////////////////////////////////////////
    // ROLE BASED (SCOPE)
    ////////////////////////////////////////////////////

    if (!scope?.isAdmin) {
      // PUBLIC
      andConditions.push({
        isApprovedByDPC: true,
        isApprovedByDPP: true,
      });
    } else {
      // 🛠 ADMIN

      if (!scope.isSuperAdmin) {
        // ADMIN CABANG
        andConditions.push({ cabangUuid: scope.cabangId });
      }
    }

    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    ////////////////////////////////////////////////////

    const [anggotas, total] = await Promise.all([
      prisma.anggota.findMany({
        where,
        orderBy: { insert_at: "desc" },
        skip,
        take: size,
        include: {
          cabang: true,
          akun: {
            select: {
              uuid: true,
              email: true,
              username: true,
              statusAkun: true,
            },
          },
          strukturDPP: {
            select: {
              uuid: true,
              atasanUuid: true,
              urutan: true,
              periode: {
                select: {
                  uuid: true,
                  namaPeriode: true,
                  tahunMulai: true,
                  tahunSelesai: true,
                },
              },
              jabatan: {
                select: {
                  uuid: true,
                  namaJabatan: true,
                },
              },
              bidang: {
                select: {
                  uuid: true,
                  namaBidang: true,
                },
              },
            },
          },
          pendidikanRef: true,
          pekerjaanRef: true,
          bidangStudiRef: true,
          bidangMinatRef: true,
        },
      }),
      prisma.anggota.count({ where }),
    ]);

    res.json({
      data: anggotas,
      pagination: {
        total,
        currentPage: page,
        pageSize: size,
        totalPages: Math.ceil(total / size),
      },
    });
  } catch {
    res.status(500).json({ message: "Failed to fetch anggotas" });
  }
};

export const getAnggotaSearch = async (req: Request, res: Response) => {
  try {
    const { search, isApprovedByDPC, isApprovedByDPP } = req.query;

    const filters: any[] = [];

    if (search) {
    filters.push({
        OR: [
        {
            namaLengkap: {
            contains: String(search),
            mode: "insensitive",
            },
        },
        {
            akun: {
            is: {
                email: {
                contains: String(search),
                mode: "insensitive",
                },
            },
            },
        },
        ],
    });
    }

    if (isApprovedByDPC !== undefined) {
    filters.push({
        isApprovedByDPC: isApprovedByDPC === "true",
    });
    }

    if (isApprovedByDPP !== undefined) {
    filters.push({
        isApprovedByDPP: isApprovedByDPP === "true",
    });
    }

    const anggotas = await prisma.anggota.findMany({
    where: {
        AND: filters,
    },
    orderBy: { insert_at: "desc" },
    include: {
        akun: true,
        cabang: true,
        strukturDPP: {
          select: {
              uuid: true,
              atasanUuid: true,
              urutan: true,
              periode: {
                select: {
                  uuid: true,
                  namaPeriode: true,
                  tahunMulai: true,
                  tahunSelesai: true,
                },
              },
              jabatan: {
                select: {
                  uuid: true,
                  namaJabatan: true,
                },
              },
              bidang: {
                select: {
                  uuid: true,
                  namaBidang: true,
              },
            }
          },
        },
        pendidikanRef: true,
        pekerjaanRef: true,
        bidangStudiRef: true,
        bidangMinatRef: true,
    },
    });

    res.json(anggotas);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

////////////////////////////////////////////////////
// CREATE ANGGOTA
////////////////////////////////////////////////////
export const createAnggota = async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const anggotaUuid = await getAnggotaUuid(user.sub);

    const anggotas = Array.isArray(req.body) ? req.body : [req.body];

    const result = await prisma.anggota.createMany({
      data: anggotas.map((s: any) => ({
        ...s,
        insert_by: user.sub,
      })),
      skipDuplicates: true,
    });

    return res.status(201).json({
      message: "Anggota berhasil dibuat",
      totalInserted: result.count,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: error.message || "Failed to create anggota",
    });
  }
};

////////////////////////////////////////////////////
// GET ANGGOTA BY UUID
////////////////////////////////////////////////////
export const getAnggotaById = async (req: Request, res: Response) => {
  try {
    const { uuid } = req.params;

    const anggota = await prisma.anggota.findUnique({
      where: { uuid: uuid as string },
      include: {
        cabang: true,
        akun: {
          select: {
            uuid: true,
            email: true,
            username: true,
          },
        },
        approverDPC: { select: { uuid: true, namaLengkap: true, strukturDPP: true } },
        approverDPP: { select: { uuid: true, namaLengkap: true, strukturDPP: true } },
        strukturDPP: {
          select: {
              uuid: true,
              atasanUuid: true,
              urutan: true,
              periode: {
                select: {
                  uuid: true,
                  namaPeriode: true,
                  tahunMulai: true,
                  tahunSelesai: true,
                },
              },
              jabatan: {
                select: {
                  uuid: true,
                  namaJabatan: true,
                },
              },
              bidang: {
                select: {
                  uuid: true,
                  namaBidang: true,
              },
            }
          },
        },
        pendidikanRef: true,
        pekerjaanRef: true,
        bidangStudiRef: true,
        bidangMinatRef: true,
      },
    });

    if (!anggota) {
      return res.status(404).json({ message: "Anggota not found" });
    }

    res.json(anggota);
  } catch {
    res.status(500).json({ message: "Failed to fetch anggota" });
  }
};

////////////////////////////////////////////////////
// UPDATE ANGGOTA
////////////////////////////////////////////////////
export const updateAnggota = async (req: Request, res: Response) => {
  try {
    const { uuid } = req.params;
    const user = req.user!;
    // const anggotaUuid = await getAnggotaUuid(user.sub);

    const body = { ...req.body };
    // Prisma DateTime @db.Date requires a Date object, not a string
    if (body.tanggalLahir !== undefined) {
      body.tanggalLahir = body.tanggalLahir ? new Date(body.tanggalLahir) : null;
    }

    const updated = await prisma.anggota.update({
      where: { uuid: uuid as string },
      data: {
        ...body,
        update_by: user.sub,
      },
    });

    return res.status(200).json(
      ApiResponse.success({
        message: "Anggota berhasil diperbarui",
        data: updated,
      })
    );
  } catch (error: any) {
    res.status(500).json({
      message: error.message || "Failed to update anggota",
    });
  }
};

////////////////////////////////////////////////////
// APPROVAL DPC
////////////////////////////////////////////////////
export const approve = async (req: Request, res: Response) => {
  try {
    const { uuid } = req.params;
    const user = req.user!;

    // Look up the approver's cabang via Akun → Anggota → Cabang
    const approver = await prisma.akun.findUnique({
      where: { uuid: user.sub },
      include: {
        anggota: {
          include: { cabang: true },
        },
      },
    });

    if (!approver?.anggota?.cabang) {
      return res.status(403).json({
        message: "Tidak dapat melakukan approval: data cabang tidak ditemukan",
      });
    }

    const isDPC = approver.anggota.cabang.isCabang === true;

    // SECURITY CHECK: Target Anggota
    const targetAnggota = await prisma.anggota.findUnique({
      where: { uuid: uuid as string },
      select: { cabangUuid: true, cabang: { select: { isCabang: true } } }
    });

    if (!targetAnggota) {
      return res.status(404).json({ message: "Data anggota tidak ditemukan" });
    }

    if (isDPC && targetAnggota.cabangUuid !== approver.anggota.cabang.uuid) {
      return res.status(403).json({
        message: "Akses ditolak: DPC hanya dapat menyetujui anggota dari cabangnya sendiri",
      });
    }

    const now = new Date();

    const updateData: Record<string, unknown> = {
      update_by: user.sub,
    };

    if (isDPC) {
      updateData.isApprovedByDPC = true;
      updateData.approvedByDPCUuid = approver.anggotaUuid;
      updateData.approvedAtDPC = now;
    } else {
      // Pusat (DPP)
      updateData.isApprovedByDPP = true;
      updateData.approvedByDPPUuid = approver.anggotaUuid;
      updateData.approvedAtDPP = now;
      
      // Auto-approve DPC level if the anggota belongs to DPP Pusat (not a cabang)
      if (targetAnggota.cabang?.isCabang === false) {
        updateData.isApprovedByDPC = true;
        updateData.approvedByDPCUuid = approver.anggotaUuid;
        updateData.approvedAtDPC = now;
      }

      updateData.statusKeanggotaan = "MEMBER";
    }

    const updated = await prisma.anggota.update({
      where: { uuid: uuid as string },
      data: updateData,
      include: {
        approverDPC: { select: { namaLengkap: true } },
        approverDPP: { select: { namaLengkap: true } },
      },
    });

    res.json({
      message: `Approved by ${isDPC ? "DPC" : "DPP"}`,
      data: updated,
    });
  } catch {
    res.status(500).json({ message: "Approval failed" });
  }
};

////////////////////////////////////////////////////
// GENERATE PUBLIC LINK
////////////////////////////////////////////////////
export const generatePublicLink = async (req: Request, res: Response) => {
  try {
    const { uuid } = req.params;
    const { expiresIn } = req.body; // e.g., '1d', '3d', '7d', '30d'

    // Verify anggota exists
    const anggota = await prisma.anggota.findUnique({
      where: { uuid: uuid as string },
    });

    if (!anggota) {
      return res.status(404).json({ message: "Anggota tidak ditemukan" });
    }

    const expiry = expiresIn || "7d";
    const secret = process.env.JWT_SECRET;
    
    if (!secret) {
      return res.status(500).json({ message: "JWT_SECRET is not configured on the server" });
    }

    const token = jwt.sign(
      { 
        sub: anggota.uuid, 
        type: "anggota_public_update" 
      }, 
      secret, 
      { expiresIn: expiry }
    );

    res.json({
      message: "Public link token generated successfully",
      token,
      expiresIn: expiry
    });
  } catch (error: any) {
    res.status(500).json({
      message: error.message || "Failed to generate public link",
    });
  }
};

////////////////////////////////////////////////////
// GET ANGGOTA BY PUBLIC TOKEN (no auth required)
////////////////////////////////////////////////////
export const getAnggotaByToken = async (req: Request, res: Response) => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== "string") {
      return res.status(400).json({ message: "Token diperlukan" });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ message: "JWT_SECRET is not configured" });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, secret);
    } catch (err: any) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({ message: "Link sudah kedaluwarsa" });
      }
      return res.status(401).json({ message: "Token tidak valid" });
    }

    if (decoded.type !== "anggota_public_update") {
      return res.status(401).json({ message: "Token tidak valid untuk aksi ini" });
    }

    const anggota = await prisma.anggota.findUnique({
      where: { uuid: decoded.sub },
      include: {
        cabang: { select: { uuid: true, namaCabang: true } },
      },
    });

    if (!anggota) {
      return res.status(404).json({ message: "Anggota tidak ditemukan" });
    }

    res.json(anggota);
  } catch (error: any) {
    res.status(500).json({
      message: error.message || "Failed to fetch anggota data",
    });
  }
};

////////////////////////////////////////////////////
// UPDATE ANGGOTA BY PUBLIC TOKEN (no auth required)
////////////////////////////////////////////////////
export const updateAnggotaByToken = async (req: Request, res: Response) => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== "string") {
      return res.status(400).json({ message: "Token diperlukan" });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ message: "JWT_SECRET is not configured" });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, secret);
    } catch (err: any) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({ message: "Link sudah kedaluwarsa" });
      }
      return res.status(401).json({ message: "Token tidak valid" });
    }

    if (decoded.type !== "anggota_public_update") {
      return res.status(401).json({ message: "Token tidak valid untuk aksi ini" });
    }

    // Whitelist only personal data fields
    const allowedFields = [
      "namaLengkap", "namaPanggil", "tempatLahir", "tanggalLahir",
      "alamat", "bio",
      "noWa", "pesanKesan", "angkatan",
      "instagram", "facebook",
      "profileImg",
      "pendidikanUuid", "pekerjaanUuid", "bidangStudiUuid", "bidangMinatUuid",
      "provinsi", "kotaDomisili"
    ];

    const updateData: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        if (field === "tanggalLahir") {
          // Prisma DateTime @db.Date requires a Date object, not a string
          updateData[field] = req.body[field] ? new Date(req.body[field]) : null;
        } else {
          updateData[field] = req.body[field];
        }
      }
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "Tidak ada data yang diperbarui" });
    }

    const updated = await prisma.anggota.update({
      where: { uuid: decoded.sub },
      data: updateData,
    });

    res.json({
      message: "Data anggota berhasil diperbarui",
      data: updated,
    });
  } catch (error: any) {
    res.status(500).json({
      message: error.message || "Failed to update anggota data",
    });
  }
};
