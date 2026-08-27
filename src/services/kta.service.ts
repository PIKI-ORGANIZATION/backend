import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import * as QRCode from "qrcode";
import fs from "fs";
import path from "path";

export class KtaService {
  /**
   * Menghasilkan PDF KTA berdasarkan template dan data pengguna
   */
  public static async generateKtaPdf(
    templateId: number,
    userData: {
      namaLengkap: string;
      nomorAnggota: string;
      cabang: string;
      profileImg?: string;
      uuid: string;
    },
  ): Promise<Uint8Array> {
    try {
      const doc = await PDFDocument.create();

      // Path template
      const templateFrontPath = path.join(
        process.cwd(),
        "src",
        "assets",
        "templates",
        `KTA-${templateId} DEPAN.png`,
      );
      const templateBackPath = path.join(
        process.cwd(),
        "src",
        "assets",
        "templates",
        `KTA-${templateId} BELAKANG.png`,
      );

      if (
        !fs.existsSync(templateFrontPath) ||
        !fs.existsSync(templateBackPath)
      ) {
        throw new Error(`Template KTA-${templateId} tidak ditemukan.`);
      }

      const frontImageBytes = fs.readFileSync(templateFrontPath);
      const backImageBytes = fs.readFileSync(templateBackPath);

      const frontImage = await doc.embedPng(frontImageBytes);
      const backImage = await doc.embedPng(backImageBytes);

      // Gunakan dimensi gambar asli untuk halaman PDF
      const width = frontImage.width;
      const height = frontImage.height;

      // Halaman 1 (Depan)
      const page1 = doc.addPage([width, height]);
      page1.drawImage(frontImage, {
        x: 0,
        y: 0,
        width: width,
        height: height,
      });

      // Embed Font
      const helveticaFont = await doc.embedFont(StandardFonts.HelveticaBold);
      const helveticaRegular = await doc.embedFont(StandardFonts.Helvetica);

      // Generate QR Code
      const qrUrl = `https://portal.piki.id/verify/${userData.uuid}`;
      const qrDataUrl = await QRCode.toDataURL(qrUrl, {
        margin: 1,
        width: 300,
      });
      // qrcode.toDataURL returns "data:image/png;base64,..."
      const qrBase64 = qrDataUrl.split(",")[1];
      const qrImageBytes = Buffer.from(qrBase64, "base64");
      const qrImage = await doc.embedPng(qrImageBytes);

      // ------------------ EMBED PROFILE PHOTO ------------------
      let profileImage;
      if (userData.profileImg) {
        try {
          let cleanPath = userData.profileImg;
          if (cleanPath.startsWith("http")) {
            try {
              const parsedUrl = new URL(cleanPath);
              cleanPath = parsedUrl.pathname; // yields "/uploads/xxx.jpg"
            } catch (e) {
              // Ignore invalid URL error, fallback to string parsing
            }
          }

          if (cleanPath.startsWith("/")) {
            cleanPath = cleanPath.substring(1);
          }

          let photoPath = path.join(process.cwd(), cleanPath);

          if (!fs.existsSync(photoPath)) {
            // maybe it is relative to public?
            photoPath = path.join(process.cwd(), "public", cleanPath);
          }

          if (fs.existsSync(photoPath)) {
            const photoBytes = fs.readFileSync(photoPath);
            if (photoPath.toLowerCase().endsWith(".png")) {
              profileImage = await doc.embedPng(photoBytes);
            } else {
              profileImage = await doc.embedJpg(photoBytes);
            }
            console.log("[KTA SERVICE] Successfully embedded profile photo.");
          } else {
            console.log("[KTA SERVICE] Photo file not found on disk.");
          }
        } catch (err) {
          console.error("[KTA SERVICE] Failed to embed profile photo", err);
        }
      } else {
        console.log("[KTA SERVICE] No profileImg in userData");
      }

      // Menulis Teks dan QR berdasarkan Layout Template
      const drawColor = rgb(1, 1, 1); // Putih
      // Label color: #f6efb0
      const labelColor = rgb(246 / 255, 239 / 255, 176 / 255);

      if (templateId === 1) {
        // VERTICAL LAYOUT (KTA 1)
        const centerX = width / 2;
        const leftMargin = width * 0.12;
        const rightMargin = width * 0.88;

        // Teks Nama Lengkap (Tengah)
        page1.drawText(userData.namaLengkap.toUpperCase(), {
          x:
            centerX -
            helveticaFont.widthOfTextAtSize(
              userData.namaLengkap.toUpperCase(),
              72,
            ) /
              2,
          y: height * 0.51,
          size: 75,
          font: helveticaFont,
          color: drawColor,
        });

        // ------------------ NOMOR ANGGOTA ------------------
        page1.drawText("NOMOR ANGGOTA", {
          x: leftMargin,
          y: height * 0.46,
          size: 33,
          font: helveticaRegular,
          color: labelColor,
        });

        page1.drawText(userData.nomorAnggota, {
          x: leftMargin,
          y: height * 0.43,
          size: 53,
          font: helveticaFont,
          color: drawColor,
        });

        // ------------------ BERLAKU HINGGA ------------------
        const berlakuLabel = "BERLAKU HINGGA";
        page1.drawText(berlakuLabel, {
          x: rightMargin - helveticaRegular.widthOfTextAtSize(berlakuLabel, 22),
          y: height * 0.46,
          size: 33,
          font: helveticaRegular,
          color: labelColor,
        });

        const expDate = "31 DESEMBER 2026";
        page1.drawText(expDate, {
          x: rightMargin - helveticaFont.widthOfTextAtSize(expDate, 43),
          y: height * 0.43,
          size: 53,
          font: helveticaFont,
          color: drawColor,
        });

        // ------------------ WILAYAH ------------------
        page1.drawText("WILAYAH", {
          x: leftMargin,
          y: height * 0.38,
          size: 33,
          font: helveticaRegular,
          color: labelColor,
        });

        page1.drawText(userData.cabang.toUpperCase(), {
          x: leftMargin,
          y: height * 0.35,
          size: 53,
          font: helveticaFont,
          color: drawColor,
        });

        // ------------------ QR CODE (DEPAN) ------------------
        const qrSize = 360;
        page1.drawImage(qrImage, {
          x: centerX - qrSize / 2,
          y: height * 0.14,
          width: qrSize,
          height: qrSize,
        });

        // ------------------ FOTO PROFIL (KTA 1) ------------------
        if (profileImage) {
          const photoW = 355;
          const photoH = 450;
          page1.drawImage(profileImage, {
            x: centerX - photoW / 2,
            y: height * 0.58,
            width: photoW,
            height: photoH,
          });
        }
      } else {
        // HORIZONTAL LAYOUT (KTA 2 & 3)
        const startX = width * 0.38;

        // Teks Nama Lengkap
        page1.drawText(userData.namaLengkap.toUpperCase(), {
          x: startX,
          y: height * 0.58,
          size: 73,
          font: helveticaFont,
          color: drawColor,
        });

        // ------------------ NOMOR ANGGOTA ------------------
        page1.drawText("NOMOR ANGGOTA", {
          x: startX,
          y: height * 0.5,
          size: 33,
          font: helveticaRegular,
          color: labelColor,
        });

        page1.drawText(userData.nomorAnggota, {
          x: startX,
          y: height * 0.448,
          size: 53,
          font: helveticaFont,
          color: drawColor,
        });

        // ------------------ WILAYAH ------------------
        page1.drawText("WILAYAH", {
          x: startX,
          y: height * 0.375,
          size: 33,
          font: helveticaRegular,
          color: labelColor,
        });

        page1.drawText(userData.cabang.toUpperCase(), {
          x: startX,
          y: height * 0.32,
          size: 53,
          font: helveticaFont,
          color: drawColor,
        });

        // ------------------ BERLAKU HINGGA ------------------
        page1.drawText("BERLAKU HINGGA", {
          x: startX,
          y: height * 0.24,
          size: 33,
          font: helveticaRegular,
          color: labelColor,
        });

        page1.drawText("31 DESEMBER 2026", {
          x: startX,
          y: height * 0.185,
          size: 53,
          font: helveticaFont,
          color: drawColor,
        });

        // ------------------ QR CODE (DEPAN) ------------------
        const qrSize = 330;
        page1.drawImage(qrImage, {
          x: width * 0.82,
          y: height * 0.09,
          width: qrSize,
          height: qrSize,
        });

        // ------------------ FOTO PROFIL (KTA 2 & 3) ------------------
        if (profileImage) {
          const photoW = 490;
          const photoH = 620;
          page1.drawImage(profileImage, {
            x: width * 0.12,
            y: height * 0.24,
            width: photoW,
            height: photoH,
          });
        }
      }
      // Halaman 2 (Belakang)
      const page2 = doc.addPage([width, height]);
      page2.drawImage(backImage, {
        x: 0,
        y: 0,
        width: width,
        height: height,
      });

      // Draw QR Code di Belakang
      if (templateId === 1) {
        const backQrSize = 360;
        page2.drawImage(qrImage, {
          x: width / 2 - backQrSize / 2,
          y: height * 0.17,
          width: backQrSize,
          height: backQrSize,
        });
      } else if (templateId === 2) {
        const backQrSize = 330;
        page2.drawImage(qrImage, {
          x: width * 0.8,
          y: height * 0.08,
          width: backQrSize,
          height: backQrSize,
        });
      } else if (templateId === 3) {
        const backQrSize = 330;
        page2.drawImage(qrImage, {
          x: width * 0.06, // bottom-left
          y: height * 0.08,
          width: backQrSize,
          height: backQrSize,
        });
      }

      const pdfBytes = await doc.save();
      return pdfBytes;
    } catch (error) {
      console.error("Error generating KTA PDF:", error);
      throw error;
    }
  }
}
