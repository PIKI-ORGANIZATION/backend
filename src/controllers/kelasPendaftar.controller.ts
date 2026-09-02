import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { ApiResponse } from "../utils/apiResponse";
import {
  sendPendaftaranKelasEmail,
  sendUpdateStatusPendaftaranEmail,
  sendPembatalanPendaftaranEmail,
} from "../config/email";

////////////////////////////////////////////////////
// GET ALL
////////////////////////////////////////////////////
export const getPendaftaranKelas = async (
  req: Request,
  res: Response
) => {
  try {
    const { search, kelasUuid, statusPendaftaran, currentPage, pageSize } = req.query as any;

    const page = Number(currentPage) || 1;
    const size = Number(pageSize) || 10;
    const skip = (page - 1) * size;

    const where: any = {};

    ////////////////////////////////////////////////////
    // FILTER STATUS
    ////////////////////////////////////////////////////
    if (statusPendaftaran) {
      where.statusPendaftaran = statusPendaftaran;
    }

    ////////////////////////////////////////////////////
    // FILTER KELAS
    ////////////////////////////////////////////////////
    if (kelasUuid) {
      where.kelasUuid = kelasUuid;
    }

    ////////////////////////////////////////////////////
    // SEARCH
    ////////////////////////////////////////////////////
    if (search) {
      where.OR = [
        {
          namaPeserta: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          emailPeserta: {
            contains: search,
            mode: "insensitive",
          },
        },
      ];
    }

    const total = await prisma.pendaftaranKelas.count({ where });

    const data = await prisma.pendaftaranKelas.findMany({
      where,
      include: {
        kelas: true,
      },
      skip,
      take: size,
      orderBy: { tanggalDaftar: "desc" },
    });

    return res.json(
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
    return res.status(500).json({
      message: "Failed to fetch pendaftaran kelas",
      error: error.message,
    });
  }
};

////////////////////////////////////////////////////
// GET BY ID
////////////////////////////////////////////////////
export const getPendaftaranKelasById = async (
  req: Request,
  res: Response
) => {
  try {
    const { uuid } = req.params;

    const data = await prisma.pendaftaranKelas.findUnique({
      where: { uuid },
      include: {
        kelas: true,
      },
    });

    if (!data) {
      return res.status(404).json({
        message: "Pendaftaran tidak ditemukan",
      });
    }

    return res.json(ApiResponse.success(data));
  } catch (error: any) {
    return res.status(500).json({
      message: "Failed to fetch pendaftaran",
      error: error.message,
    });
  }
};

////////////////////////////////////////////////////
// GET BY EMAIL PENDAFTAR
////////////////////////////////////////////////////
export const getPendaftaranKelasByEmailPendaftar = async (
  req: Request,
  res: Response
) => {
  try {
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({
        message: "Email wajib diisi",
      });
    }

    const data = await prisma.pendaftaranKelas.findMany({
      where: {
        emailPeserta: {
          equals: email,
          mode: "insensitive",
        },
      },
      include: {
        kelas: true,
      },
      orderBy: {
        tanggalDaftar: "desc",
      },
    });

    return res.json(ApiResponse.success(data));
  } catch (error: any) {
    return res.status(500).json({
      message: "Failed to fetch pendaftaran by email",
      error: error.message,
    });
  }
};

////////////////////////////////////////////////////
// CREATE
////////////////////////////////////////////////////
export const createPendaftaranKelas = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      kelasUuid,
      namaPeserta,
      emailPeserta,
      noWaPeserta,
      catatanPeserta,
      buktiTransferUrl,
    } = req.body;

    ////////////////////////////////////////////////////
    // VALIDASI WAJIB
    ////////////////////////////////////////////////////
    if (!kelasUuid || !namaPeserta || !emailPeserta) {
      return res.status(400).json({
        message: "kelasUuid, namaPeserta, dan emailPeserta wajib diisi",
      });
    }

    ////////////////////////////////////////////////////
    // VALIDASI KELAS EXIST
    ////////////////////////////////////////////////////
    const kelas = await prisma.kelas.findUnique({
      where: { uuid: kelasUuid },
    });

    if (!kelas) {
      return res.status(400).json({
        message: "Kelas tidak ditemukan",
      });
    }

    ////////////////////////////////////////////////////
    // CEK DUPLIKAT
    ////////////////////////////////////////////////////
    const exist = await prisma.pendaftaranKelas.findUnique({
      where: {
        kelasUuid_emailPeserta: {
          kelasUuid,
          emailPeserta,
        },
      },
    });

    if (exist) {
      return res.status(400).json({
        message: "Email sudah terdaftar di kelas ini",
      });
    }

    ////////////////////////////////////////////////////
    // HITUNG KUOTA TERPAKAI
    ////////////////////////////////////////////////////
    const acceptedCount = await prisma.pendaftaranKelas.count({
      where: {
        kelasUuid,
        statusPendaftaran: "DITERIMA",
      },
    });

    const maxPeserta = kelas.maxPeserta ?? Infinity;

    ////////////////////////////////////////////////////
    // LOGIC STATUS
    ////////////////////////////////////////////////////
    const isGratis = !kelas.harga || Number(kelas.harga) === 0;
    const isKuotaAvailable = acceptedCount < maxPeserta;

    const status: "PENDING" | "DITERIMA" =
      isGratis && isKuotaAvailable ? "DITERIMA" : "PENDING";

    ////////////////////////////////////////////////////
    // CREATE
    ////////////////////////////////////////////////////
    const created = await prisma.pendaftaranKelas.create({
      data: {
        kelasUuid,
        namaPeserta,
        emailPeserta,
        noWaPeserta,
        catatanPeserta,
        buktiTransferUrl,
        statusPendaftaran: status,
      },
    });

    ////////////////////////////////////////////////////
    // SEND EMAIL — non-blocking
    ////////////////////////////////////////////////////
    sendPendaftaranKelasEmail(
      emailPeserta,
      namaPeserta,
      kelas.namaKelas,
      status
    ).catch((err) => console.error("Email pendaftaran gagal dikirim:", err));

    ////////////////////////////////////////////////////
    // RESPONSE
    ////////////////////////////////////////////////////
    return res.status(201).json(
      ApiResponse.success({
        message: "Pendaftaran berhasil",
        data: created,
      })
    );
  } catch (error: any) {
    return res.status(500).json({
      message: "Failed to create pendaftaran",
      error: error.message,
    });
  }
};

////////////////////////////////////////////////////
// UPDATE (ADMIN)
////////////////////////////////////////////////////
export const updatePendaftaranKelas = async (
  req: Request,
  res: Response
) => {
  try {
    const { uuid } = req.params;
    const user = req.user!;

    const existing = await prisma.pendaftaranKelas.findUnique({
      where: { uuid },
      include: { kelas: true },
    });

    if (!existing) {
      return res.status(404).json({
        message: "Pendaftaran tidak ditemukan",
      });
    }

    const allowedStatus = ["PENDING", "DITERIMA", "DITOLAK", "HADIR"];

    if (
      req.body.statusPendaftaran &&
      !allowedStatus.includes(req.body.statusPendaftaran)
    ) {
      return res.status(400).json({
        message: "Status tidak valid",
      });
    }

    const updated = await prisma.pendaftaranKelas.update({
      where: { uuid },
      data: {
        ...req.body,
        update_by: user.sub,
      },
    });

    ////////////////////////////////////////////////////
    // SEND EMAIL — non-blocking
    ////////////////////////////////////////////////////
    sendUpdateStatusPendaftaranEmail(
      existing.emailPeserta,
      existing.namaPeserta,
      existing.kelas.namaKelas,
      updated.statusPendaftaran
    ).catch((err) => console.error("Email update status gagal dikirim:", err));

    return res.json(
      ApiResponse.success({
        message: "Pendaftaran berhasil diupdate",
        data: updated,
      })
    );
  } catch (error: any) {
    return res.status(500).json({
      message: "Failed to update pendaftaran",
      error: error.message,
    });
  }
};

////////////////////////////////////////////////////
// DELETE (HARD DELETE — hanya Admin)
////////////////////////////////////////////////////
export const deletePendaftaranKelas = async (
  req: Request,
  res: Response
) => {
  try {
    const { uuid } = req.params;

    const existing = await prisma.pendaftaranKelas.findUnique({
      where: { uuid },
      include: { kelas: true },
    });

    if (!existing) {
      return res.status(404).json({
        message: "Pendaftaran tidak ditemukan",
      });
    }

    await prisma.pendaftaranKelas.delete({
      where: { uuid },
    });

    ////////////////////////////////////////////////////
    // SEND EMAIL — non-blocking
    ////////////////////////////////////////////////////
    sendPembatalanPendaftaranEmail(
      existing.emailPeserta,
      existing.namaPeserta,
      existing.kelas.namaKelas
    ).catch((err) => console.error("Email pembatalan gagal dikirim:", err));

    return res.json(
      ApiResponse.success({
        message: "Pendaftaran berhasil dihapus",
      })
    );
  } catch (error: any) {
    return res.status(500).json({
      message: "Failed to delete pendaftaran",
      error: error.message,
    });
  }
};
