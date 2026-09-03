import { Request, Response } from "express";
import { prisma } from "../config/prisma";

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const scope = req.scope;

    // Default filters
    const anggotaWhere: any = {};
    const newsWhere: any = {};
    const pendingWhere: any = {};

    if (!scope?.isAdmin) {
      // Public / Member level scope (if they ever hit this endpoint)
      anggotaWhere.isApprovedByDPC = true;
      anggotaWhere.isApprovedByDPP = true;
      
      pendingWhere.isApprovedByDPC = false; // dummy for public
    } else {
      if (!scope.isSuperAdmin) {
        // ADMIN_CABANG
        anggotaWhere.cabangUuid = scope.cabangId;
        newsWhere.cabangUuid = scope.cabangId;
        
        pendingWhere.isApprovedByDPC = false;
        pendingWhere.cabangUuid = scope.cabangId;
      } else {
        // SUPER_ADMIN (DPP)
        // All branches for counts, but pending approvals for DPP means approved by DPP = false
        pendingWhere.isApprovedByDPP = false;
      }
    }

    const [totalAnggota, totalBerita, totalKelasGrit, pendingApprovalCount] =
      await Promise.all([
        prisma.anggota.count({ where: anggotaWhere }),
        prisma.newsUtama.count({ where: newsWhere }),
        Promise.resolve(0), // prisma.kelas.count(), // global
        prisma.anggota.count({ where: pendingWhere }),
      ]);

    res.json({
      data: {
        totalAnggota,
        totalBerita,
        totalKelasGrit,
        pendingApprovalCount,
      },
    });
  } catch (error) {
    console.error("Dashboard Stats Error:", error);
    res.status(500).json({ message: "Gagal mengambil statistik dashboard" });
  }
};
