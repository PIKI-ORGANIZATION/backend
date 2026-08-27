import { Request, Response } from 'express';
import { KtaService } from '../services/kta.service';
import prisma from '../config/prisma';

export class KtaController {
  public static async downloadKta(req: Request, res: Response): Promise<void> {
    try {
      // Data user dari Auth Middleware
      const user = (req as any).user;
      
      const templateId = parseInt(req.query.template as string, 10) || 1;

      if (![1, 2, 3].includes(templateId)) {
        res.status(400).json({ message: "Template ID tidak valid. Harus 1, 2, atau 3." });
        return;
      }

      const akun = await prisma.akun.findUnique({
        where: { uuid: user.sub },
        include: { senior: { include: { cabang: true } } },
      });

      let noKta = "BELUM ADA NIA";
      if (akun?.email) {
        const registrasi = await prisma.registrasi.findFirst({
          where: { email: akun.email, statusKta: "ACTIVE" },
        });
        if (registrasi?.noKta) {
          noKta = registrasi.noKta;
        }
      }

      const userData = {
        uuid: user.sub || "preview-uuid",
        namaLengkap: akun?.senior?.namaLengkap || user.username || "ANGGOTA PIKI",
        nomorAnggota: noKta,
        cabang: akun?.senior?.cabang?.namaCabang || user.cabang?.namaCabang || "DPP PIKI",
        profileImg: akun?.senior?.profileImg || undefined,
      };

      const pdfBytes = await KtaService.generateKtaPdf(templateId, userData);

      const buffer = Buffer.from(pdfBytes);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=KTA_PIKI_${userData.namaLengkap.replace(/\s+/g, '_')}.pdf`);
      res.setHeader('Content-Length', buffer.length);

      res.end(buffer);
    } catch (error: any) {
      console.error("Download KTA Controller Error:", error);
      res.status(500).json({ message: "Gagal membuat PDF KTA", error: error.message });
    }
  }
}
