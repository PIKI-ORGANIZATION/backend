import Tesseract from "tesseract.js";

export const scanKtp = async (imageBuffer: Buffer) => {
  try {
    console.log("Mulai memproses OCR KTP...");
    // Menggunakan bahasa "eng" dan "ind" (jika tersedia), "eng" cukup untuk teks kapital KTP
    const { data: { text } } = await Tesseract.recognize(imageBuffer, "eng", {
      logger: (m) => console.log(m)
    });

    console.log("Hasil Mentah OCR:", text);

    // Regex sederhana untuk NIK (16 digit angka)
    const nikMatch = text.match(/\b\d{16}\b/);
    const nik = nikMatch ? nikMatch[0] : null;

    // Parsing baris per baris
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    let namaLengkap = null;
    let tempatTglLahir = null;
    let alamat = null;
    let agama = null;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].toUpperCase();
        
        // Pembersihan karakter aneh hasil scan
        const cleanLine = line.replace(/[^A-Z0-9\s:/,-]/g, '');

        if (cleanLine.includes("NAMA")) {
            const splitName = cleanLine.split(/[:]/);
            namaLengkap = splitName[1]?.trim() || lines[i+1]?.trim() || null;
        }
        if (cleanLine.includes("TEMPAT/TGL LAHIR") || cleanLine.includes("TEMPAT")) {
            const splitTempat = cleanLine.split(/[:]/);
            tempatTglLahir = splitTempat[1]?.trim() || lines[i+1]?.trim() || null;
        }
        if (cleanLine.includes("ALAMAT")) {
            const splitAlamat = cleanLine.split(/[:]/);
            alamat = splitAlamat[1]?.trim() || lines[i+1]?.trim() || null;
        }
        if (cleanLine.includes("AGAMA")) {
            const splitAgama = cleanLine.split(/[:]/);
            agama = splitAgama[1]?.trim() || lines[i+1]?.trim() || null;
        }
    }

    // Validasi sederhana jika ini benar-benar KTP (ada kata kunci atau ada NIK)
    const textUpper = text.toUpperCase();
    const isValidKtp = textUpper.includes("PROVINSI") || textUpper.includes("KARTU TANDA PENDUDUK") || !!nik;

    return {
      isValidKtp,
      extractedData: {
        nik,
        namaLengkap,
        tempatTglLahir,
        alamat,
        agama
      },
      rawText: text
    };
  } catch (error) {
    console.error("Error OCR KTP:", error);
    throw new Error("Gagal membaca foto KTP. Pastikan gambar tidak blur dan pencahayaan cukup.");
  }
};
