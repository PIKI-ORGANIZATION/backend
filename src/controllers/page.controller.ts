import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { ApiResponse } from '../utils/apiResponse';

export const getHomeData = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Fetch all home page related data
    const heroSetting = await prisma.appSetting.findUnique({ where: { key: 'home_hero' } });
    const programs = await prisma.program.findMany();
    const history = await prisma.history.findMany({ orderBy: { order: 'asc' } });
    const team = await prisma.teamMember.findMany({ orderBy: { order: 'asc' } });
    
    // Construct response matching homeData.ts structure approximately
    // Or return flexible structure
    const data = {
      hero: heroSetting?.value,
      programs: { title: "Program Kami", programs }, // Structuring to match frontend slightly
      history: { title: "Sejarah Kami", items: history },
      team: team,
      // VisiMisi could be another query
    };

    res.json(ApiResponse.success(data));
  } catch (error) {
    next(error);
  }
};

export const getPrograms = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const programs = await prisma.program.findMany();
    res.json(ApiResponse.success(programs));
  } catch (error) {
    next(error);
  }
};

export const getHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const history = await prisma.history.findMany();
    res.json(ApiResponse.success(history));
  } catch (error) {
    next(error);
  }
};

export const getTeam = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const team = await prisma.teamMember.findMany();
    res.json(ApiResponse.success(team));
  } catch (error) {
    next(error);
  }
};

export const getBotPreview = async (req: Request, res: Response) => {
  try {
    const rawUrl = req.query.url as string || '/';
    
    let title = "PNPS GMKI";
    let description = "Website Resmi Pengurus Nasional Perkumpulan Senior (PNPS) GMKI.";

    // Paksa HTTPS di production agar WhatsApp mau men-download gambar
    const host = req.headers['x-forwarded-host'] || req.get('host') || 'seniorgmki.com';
    const isLocal = host.includes('localhost') || host.includes('127.0.0.1');
    const protocol = isLocal ? 'http' : 'https';
    
    const baseUrl = `${protocol}://${host}`;
    let image = `${baseUrl}/logo.png`;
    
    // Pastikan og:url absolute
    const fullUrl = rawUrl.startsWith('http') ? rawUrl : `${baseUrl}${rawUrl}`;

    if (rawUrl) {
      if (rawUrl.includes('/news/')) {
        const slug = rawUrl.split('/news/')[1]?.split('/')[0];
        if (slug) {
          const news = await prisma.newsUtama.findUnique({ where: { slug } });
          if (news) {
            title = news.judul;
            const plainKonten = news.konten ? news.konten.replace(/<[^>]+>/g, "").substring(0, 160) : "";
            description = news.ringkasan || plainKonten || description;
            if (news.url_thumbnail_img) {
                let thumbUrl = news.url_thumbnail_img;
                if (thumbUrl.startsWith('http')) {
                    thumbUrl = thumbUrl.replace(/^http:\/\//i, 'https://');
                } else {
                    thumbUrl = `${baseUrl}/${thumbUrl.replace(/^\/?/, '')}`;
                }
                image = thumbUrl;
            }
          }
        }
      } else if (rawUrl.includes('/grit-institute/')) {
        const id = rawUrl.split('/grit-institute/')[1]?.split('/')[0];
        if (id) {
          const kelas = await prisma.kelas.findUnique({ where: { uuid: id } });
          if (kelas) {
            title = kelas.namaKelas;
            const plainKonten = kelas.deskripsiKelas ? kelas.deskripsiKelas.replace(/<[^>]+>/g, "").substring(0, 160) : "";
            description = plainKonten || description;
            if (kelas.thumbnail) {
                let thumbUrl = kelas.thumbnail;
                if (thumbUrl.startsWith('http')) {
                    thumbUrl = thumbUrl.replace(/^http:\/\//i, 'https://');
                } else {
                    thumbUrl = `${baseUrl}/${thumbUrl.replace(/^\/?/, '')}`;
                }
                image = thumbUrl;
            }
          }
        }
      }
    }

    const safeTitle = title.replace(/"/g, '&quot;');
    const safeDesc = description.replace(/"/g, '&quot;').replace(/\n/g, ' ').replace(/\r/g, '');

    const html = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <title>${safeTitle}</title>
      <meta name="description" content="${safeDesc}">
      <meta property="og:site_name" content="PNPS GMKI">
      <meta property="og:type" content="article">
      <meta property="og:url" content="${fullUrl}">
      <meta property="og:title" content="${safeTitle}">
      <meta property="og:description" content="${safeDesc}">
      <meta property="og:image" content="${image}">
      <meta property="og:image:secure_url" content="${image.replace(/^http:\/\//i, 'https://')}">
      <meta property="og:image:width" content="1200">
      <meta property="og:image:height" content="630">
      <meta property="og:image:type" content="${image.endsWith('.webp') ? 'image/webp' : image.endsWith('.png') ? 'image/png' : 'image/jpeg'}">
      <meta name="twitter:card" content="summary_large_image">
      <meta name="twitter:title" content="${safeTitle}">
      <meta name="twitter:description" content="${safeDesc}">
      <meta name="twitter:image" content="${image}">
    </head>
    <body>
      <p>Redirecting to <a href="${fullUrl}">${fullUrl}</a>...</p>
      <script>window.location.replace("${fullUrl}");</script>
    </body>
    </html>
    `;
    res.send(html);
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
};
