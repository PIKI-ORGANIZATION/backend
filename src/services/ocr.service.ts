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
    
    let nikLineIndex = -1;

    // 1. Ekstrak Tanggal Lahir (Global Regex - KTP selalu DD-MM-YYYY)
    const dateMatch = text.match(/\b\d{2}[-/]\d{2}[-/]\d{4}\b/);
    if (dateMatch) {
        tempatTglLahir = dateMatch[0];
    }

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].toUpperCase();
        
        // Pembersihan karakter aneh hasil scan
        const cleanLine = line.replace(/[^A-Z0-9\s:/,-]/g, '');

        if (nik && line.includes(nik)) {
            nikLineIndex = i;
        }

        // Ekstrak Nama
        if (/(NAMA|MAMA|NANA)\b/.test(cleanLine) && !namaLengkap) {
            const parts = line.split(/[:;=]/);
            if (parts.length > 1 && parts[1].trim().length > 0) {
                namaLengkap = parts[1].replace(/^[^a-zA-Z]+/, '').trim();
            } else {
                namaLengkap = lines[i+1]?.replace(/^[^a-zA-Z]+/, '').trim() || null;
            }
        }
        
        // Ekstrak Alamat
        if (cleanLine.includes("ALAMAT")) {
            const parts = line.split(/[:;=]/);
            alamat = parts.length > 1 && parts[1].trim().length > 0 ? parts[1].trim() : lines[i+1]?.trim() || null;
        }

        // Ekstrak Agama
        if (cleanLine.includes("AGAMA")) {
            const parts = line.split(/[:;=]/);
            agama = parts.length > 1 && parts[1].trim().length > 0 ? parts[1].trim() : lines[i+1]?.trim() || null;
        }
    }

    // Fallback Nama: Jika keyword "NAMA" tidak terbaca jelas, di KTP nama biasanya berada persis 1 baris di bawah NIK
    if (!namaLengkap && nikLineIndex !== -1 && nikLineIndex + 1 < lines.length) {
        namaLengkap = lines[nikLineIndex + 1].replace(/^[^a-zA-Z]+/, '').trim();
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
