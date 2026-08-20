import { Request, Response } from "express";
import { prisma } from "../config/prisma";

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const scope = req.scope;

    // Default filters
    const seniorWhere: any = {};
    const newsWhere: any = {};
    const pendingWhere: any = {};

    if (!scope?.isAdmin) {
      // Public / Member level scope (if they ever hit this endpoint)
      seniorWhere.isApprovedByPCPS = true;
      seniorWhere.isApprovedByPNPS = true;
      
      pendingWhere.isApprovedByPCPS = false; // dummy for public
    } else {
      if (!scope.isSuperAdmin) {
        // ADMIN_CABANG
        seniorWhere.cabangUuid = scope.cabangId;
        newsWhere.cabangUuid = scope.cabangId;
        
        pendingWhere.isApprovedByPCPS = false;
        pendingWhere.cabangUuid = scope.cabangId;
      } else {
        // SUPER_ADMIN (PNPS)
        // All branches for counts, but pending approvals for PNPS means approved by PNPS = false
        pendingWhere.isApprovedByPNPS = false;
      }
    }

    const [totalAnggota, totalBerita, totalKelasGrit, pendingApprovalCount] =
      await Promise.all([
        prisma.senior.count({ where: seniorWhere }),
        prisma.newsUtama.count({ where: newsWhere }),
        prisma.kelas.count(), // global
        prisma.senior.count({ where: pendingWhere }),
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
