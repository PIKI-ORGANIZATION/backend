import { Request, Response } from "express";
import { anggotaQueue } from "../queue/anggota.queue";
import { Queue } from "bullmq";
import ExcelJS from "exceljs";
import path from "path";
import fs from "fs";

const EXPORTS_DIR = path.resolve(process.cwd(), "uploads", "exports");

////////////////////////////////////////////////////
// EXPORT: Enqueue export job
////////////////////////////////////////////////////
export const exportAnggotas = async (req: Request, res: Response) => {
  try {
    const {
      search, approvalStatus,
      pekerjaanUuid, pendidikanUuid, bidangStudiUuid, bidangMinatUuid,
      cabangUuid, angkatanFrom, angkatanTo,
    } = req.query;

    const job = await anggotaQueue.add("EXPORT_ANGGOTAS", {
      search, approvalStatus,
      pekerjaanUuid, pendidikanUuid, bidangStudiUuid, bidangMinatUuid,
      cabangUuid, angkatanFrom, angkatanTo,
      scope: req.scope,
    });

    res.json({ jobId: job.id, message: "Export job queued" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

////////////////////////////////////////////////////
// EXPORT: Check job status & download
////////////////////////////////////////////////////
export const getExportStatus = async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params as { jobId: string };
    const job = await anggotaQueue.getJob(jobId);

    if (!job) {
      res.status(404).json({ error: "Job not found" });
      return;
    }

    const state = await job.getState();
    const progress = job.progress;

    if (state === "completed") {
      res.json({ status: "completed", progress: 100, result: job.returnvalue });
    } else if (state === "failed") {
      res.json({ status: "failed", error: job.failedReason });
    } else {
      res.json({ status: state, progress });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

////////////////////////////////////////////////////
// EXPORT: Download completed file
////////////////////////////////////////////////////
export const downloadExport = async (req: Request, res: Response) => {
  try {
    const { filename } = req.params as { filename: string };

    // Security: only allow filenames matching our pattern
    if (!/^anggota-export-\d+\.xlsx$/.test(filename)) {
      res.status(400).json({ error: "Invalid filename" });
      return;
    }

    const filepath = path.join(EXPORTS_DIR, filename);
    if (!fs.existsSync(filepath)) {
      res.status(404).json({ error: "File not found" });
      return;
    }

    res.download(filepath, `Anggota_Data_${new Date().toISOString().slice(0, 10)}.xlsx`, (err) => {
      // Clean up after download
      if (!err) {
        setTimeout(() => {
          try { fs.unlinkSync(filepath); } catch {}
        }, 60000); // delete after 1 minute
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

////////////////////////////////////////////////////
// EXPORT: Download template
////////////////////////////////////////////////////
export const downloadTemplate = async (_req: Request, res: Response) => {
  try {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "DPP Admin";

    const ws = workbook.addWorksheet("Template Import Anggota");

    ws.columns = [
      { header: "Nama Lengkap *", key: "namaLengkap", width: 25 },
      { header: "Nama Panggil", key: "namaPanggil", width: 18 },
      { header: "Tempat Lahir", key: "tempatLahir", width: 18 },
      { header: "Tanggal Lahir (YYYY-MM-DD)", key: "tanggalLahir", width: 25 },
      { header: "Alamat", key: "alamat", width: 35 },
      { header: "Angkatan (Tahun)", key: "angkatan", width: 16 },
      { header: "Pendidikan", key: "pendidikan", width: 20 },
      { header: "Pekerjaan", key: "pekerjaan", width: 20 },
      { header: "Bidang Studi", key: "bidangStudi", width: 20 },
      { header: "Bidang Minat", key: "bidangMinat", width: 20 },
      { header: "Provinsi", key: "provinsi", width: 18 },
      { header: "Kota Domisili", key: "kotaDomisili", width: 18 },
      { header: "Cabang", key: "cabang", width: 20 },
      { header: "No WA", key: "noWa", width: 16 },
      { header: "Instagram", key: "instagram", width: 18 },
      { header: "Facebook", key: "facebook", width: 18 },
      { header: "Status (MEMBER/NON_MEMBER)", key: "statusKeanggotaan", width: 26 },
    ];

    // Style header
    ws.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1F4E79" } };
      cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    });

    // Example row
    ws.addRow({
      namaLengkap: "John Doe",
      namaPanggil: "John",
      tempatLahir: "Jakarta",
      tanggalLahir: "1990-05-15",
      alamat: "Jl. Sudirman No. 1, Jakarta Pusat",
      angkatan: "2010",
      pendidikan: "S1",
      pekerjaan: "Karyawan Swasta",
      bidangStudi: "Teknik Informatika",
      bidangMinat: "Artificial Intelligence",
      provinsi: "DKI Jakarta",
      kotaDomisili: "Jakarta Pusat",
      cabang: "DPC Jakarta",
      noWa: "081234567890",
      instagram: "@johndoe",
      facebook: "John Doe",
      statusKeanggotaan: "MEMBER",
    });

    // Style example row
    ws.getRow(2).eachCell((cell) => {
      cell.font = { italic: true, color: { argb: "FF808080" } };
    });

    // Instructions sheet
    const infoWs = workbook.addWorksheet("Petunjuk");
    infoWs.getColumn(1).width = 60;
    const instructions = [
      "PETUNJUK PENGISIAN TEMPLATE IMPORT ANGGOTA",
      "",
      "1. Kolom yang bertanda * wajib diisi",
      "2. Nama Lengkap minimal 3 karakter",
      "3. Tanggal Lahir format: YYYY-MM-DD (contoh: 1990-05-15)",
      "4. Angkatan berupa tahun 4 digit (contoh: 2010)",
      "5. Pendidikan, Pekerjaan, Bidang Studi, Bidang Minat: isi dengan nama (otomatis dibuat jika belum ada di master data)",
      "6. Cabang: isi dengan nama cabang yang sudah terdaftar",
      "7. Status Keanggotaan: MEMBER atau NON_MEMBER",
      "8. Hapus baris contoh (baris 2 warna abu-abu) sebelum mengupload",
      "",
      "Catatan: Data yang sudah ada tidak akan ditimpa, setiap baris akan dibuat sebagai data Anggota baru.",
    ];
    instructions.forEach((text, i) => {
      const cell = infoWs.getCell(`A${i + 1}`);
      cell.value = text;
      if (i === 0) cell.font = { bold: true, size: 14 };
    });

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=Template_Import_Anggota.xlsx");
    await workbook.xlsx.write(res);
    res.end();
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

////////////////////////////////////////////////////
// IMPORT: Parse headers from file
////////////////////////////////////////////////////
export const parseHeaders = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "File tidak ditemukan" });
      return;
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer as any);

    const ws = workbook.getWorksheet(1);
    if (!ws) {
      res.status(400).json({ error: "Worksheet tidak ditemukan" });
      return;
    }

    const headerRow = ws.getRow(1);
    const headers: string[] = [];
    headerRow.eachCell((cell, colNumber) => {
      headers[colNumber] = String(cell.value || "")
        .replace(/\s*\*\s*$/, "") // remove trailing *
        .replace(/\s*\(.*?\)\s*$/, "") // remove parenthetical hints
        .trim();
    });

    res.json({ headers });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

////////////////////////////////////////////////////
// IMPORT: Parse preview (no saving yet)
////////////////////////////////////////////////////
export const previewImport = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "File tidak ditemukan" });
      return;
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer as any);

    const ws = workbook.getWorksheet(1);
    if (!ws) {
      res.status(400).json({ error: "Worksheet tidak ditemukan" });
      return;
    }

    const headerRow = ws.getRow(1);
    const headers: string[] = [];
    headerRow.eachCell((cell, colNumber) => {
      headers[colNumber] = String(cell.value || "")
        .replace(/\s*\*\s*$/, "") // remove trailing *
        .replace(/\s*\(.*?\)\s*$/, "") // remove parenthetical hints
        .trim();
    });

    let columnMapping: Record<number, string> = {};
    if (req.body.mapping) {
      try {
        const parsedMapping = JSON.parse(req.body.mapping);
        // req.body.mapping gives { "1": "namaLengkap" }
        for (const [colIndex, field] of Object.entries(parsedMapping)) {
          columnMapping[Number(colIndex)] = field as string;
        }
      } catch (e) {
        res.status(400).json({ error: "Format mapping tidak valid" });
        return;
      }
    } else {
      // Fallback to auto mapping
      const headerMap: Record<string, string> = {
        "Nama Lengkap": "namaLengkap",
        "Nama Panggil": "namaPanggil",
        "Tempat Lahir": "tempatLahir",
        "Tanggal Lahir": "tanggalLahir",
        "Alamat": "alamat",
        "Angkatan": "angkatan",
        "Pendidikan": "pendidikan",
        "Pekerjaan": "pekerjaan",
        "Bidang Studi": "bidangStudi",
        "Bidang Minat": "bidangMinat",
        "Provinsi": "provinsi",
        "Kota Domisili": "kotaDomisili",
        "Cabang": "cabang",
        "No WA": "noWa",
        "Instagram": "instagram",
        "Facebook": "facebook",
        "Status": "statusKeanggotaan",
      };

      headers.forEach((h, colNum) => {
        const key = headerMap[h];
        if (key) columnMapping[colNum] = key;
      });
    }

    const rows: any[] = [];
    const warnings: { row: number; field: string; message: string }[] = [];

    ws.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // skip header

      const rowData: any = {};
      row.eachCell((cell, colNumber) => {
        const fieldKey = columnMapping[colNumber];
        if (fieldKey) {
          let val = cell.value;
          // Handle Excel date objects
          if (val instanceof Date) {
            val = val.toISOString().slice(0, 10);
          }
          // Handle rich text
          if (typeof val === "object" && val !== null && "richText" in val) {
            val = (val as any).richText.map((r: any) => r.text).join("");
          }
          rowData[fieldKey] = val ? String(val).trim() : "";
        }
      });

      // Skip completely empty rows
      if (Object.values(rowData).every((v) => !v)) return;

      // Validate
      if (!rowData.namaLengkap || rowData.namaLengkap.length < 3) {
        warnings.push({ row: rowNumber, field: "Nama Lengkap", message: "Wajib diisi (minimal 3 karakter)" });
      }
      if (rowData.angkatan && !/^\d{4}$/.test(rowData.angkatan)) {
        warnings.push({ row: rowNumber, field: "Angkatan", message: "Harus berupa tahun 4 digit" });
      }
      if (rowData.tanggalLahir && isNaN(Date.parse(rowData.tanggalLahir))) {
        warnings.push({ row: rowNumber, field: "Tanggal Lahir", message: "Format tanggal tidak valid" });
      }

      rows.push({ ...rowData, _rowNum: rowNumber });
    });

    res.json({
      total: rows.length,
      rows,
      warnings,
      columns: Object.values(columnMapping),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

////////////////////////////////////////////////////
// IMPORT: Confirm & enqueue
////////////////////////////////////////////////////
export const confirmImport = async (req: Request, res: Response) => {
  try {
    const { rows } = req.body;

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      res.status(400).json({ error: "Tidak ada data untuk diimport" });
      return;
    }

    const job = await anggotaQueue.add("IMPORT_ANGGOTAS", {
      rows,
      scope: req.scope,
    });

    res.json({ jobId: job.id, message: "Import job queued", total: rows.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

////////////////////////////////////////////////////
// JOB STATUS (shared for export & import)
////////////////////////////////////////////////////
export const getJobStatus = async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const job = await anggotaQueue.getJob(jobId as string);

    if (!job) {
      res.status(404).json({ error: "Job not found" });
      return;
    }

    const state = await job.getState();
    const progress = job.progress;

    if (state === "completed") {
      res.json({ status: "completed", progress: 100, result: job.returnvalue });
    } else if (state === "failed") {
      res.json({ status: "failed", error: job.failedReason });
    } else {
      res.json({ status: state, progress });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
