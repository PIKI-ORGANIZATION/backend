import { Worker } from "bullmq";
import bullmqRedis from "../config/bullmqRedis";
import { prisma } from "../config/prisma";
import ExcelJS from "exceljs";
import path from "path";
import fs from "fs";

const EXPORTS_DIR = path.resolve(process.cwd(), "uploads", "exports");
if (!fs.existsSync(EXPORTS_DIR)) fs.mkdirSync(EXPORTS_DIR, { recursive: true });

const EXPORT_COLUMNS = [
  { header: "No", key: "no", width: 5 },
  { header: "Nama Lengkap", key: "namaLengkap", width: 25 },
  { header: "Nama Panggil", key: "namaPanggil", width: 18 },
  { header: "Tempat Lahir", key: "tempatLahir", width: 18 },
  { header: "Tanggal Lahir", key: "tanggalLahir", width: 15 },
  { header: "Alamat", key: "alamat", width: 35 },
  { header: "Angkatan", key: "angkatan", width: 12 },
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
  { header: "Status Keanggotaan", key: "statusKeanggotaan", width: 18 },
  { header: "Approved PCPS", key: "approvedPCPS", width: 14 },
  { header: "Approved PNPS", key: "approvedPNPS", width: 14 },
];

// Re-usable: build the same Prisma `where` used in getAnggotas
function buildAnggotaWhere(data: any) {
  const andConditions: any[] = [];

  if (data.search) {
    andConditions.push({
      OR: [
        { namaLengkap: { contains: data.search, mode: "insensitive" } },
        { namaPanggil: { contains: data.search, mode: "insensitive" } },
        { tempatLahir: { contains: data.search, mode: "insensitive" } },
        { alamat: { contains: data.search, mode: "insensitive" } },
        { angkatan: { contains: data.search, mode: "insensitive" } },
        { provinsi: { contains: data.search, mode: "insensitive" } },
        { kotaDomisili: { contains: data.search, mode: "insensitive" } },
        { noWa: { contains: data.search, mode: "insensitive" } },
        { pendidikanRef: { nama: { contains: data.search, mode: "insensitive" } } },
        { pekerjaanRef: { nama: { contains: data.search, mode: "insensitive" } } },
        { bidangStudiRef: { nama: { contains: data.search, mode: "insensitive" } } },
        { bidangMinatRef: { nama: { contains: data.search, mode: "insensitive" } } },
      ],
    });
  }

  const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  const buildUuidCond = (field: string, value: string | string[] | undefined) => {
    if (!value) return null;
    const arr = Array.isArray(value) ? value : [value];
    const valid = arr.filter((v) => uuidRegex.test(v));
    if (valid.length > 0) return { [field]: { in: valid } };
    return null;
  };

  for (const f of ["pekerjaanUuid", "pendidikanUuid", "bidangStudiUuid", "bidangMinatUuid", "cabangUuid"]) {
    const cond = buildUuidCond(f, data[f]);
    if (cond) andConditions.push(cond);
  }

  if (data.angkatanFrom || data.angkatanTo) {
    const c: any = {};
    if (data.angkatanFrom) c.gte = String(data.angkatanFrom);
    if (data.angkatanTo) c.lte = String(data.angkatanTo);
    andConditions.push({ angkatan: c });
  }

  if (data.approvalStatus === "pending") {
    andConditions.push({ OR: [{ isApprovedByPCPS: false }, { isApprovedByPNPS: false }] });
  } else if (data.approvalStatus === "approved") {
    andConditions.push({ isApprovedByPCPS: true, isApprovedByPNPS: true });
  }

  // Scope
  if (data.scope?.isAdmin) {
    if (!data.scope.isSuperAdmin && data.scope.cabangId) {
      andConditions.push({ cabangUuid: data.scope.cabangId });
    }
  } else {
    andConditions.push({ isApprovedByPCPS: true, isApprovedByPNPS: true });
  }

  return andConditions.length > 0 ? { AND: andConditions } : {};
}

new Worker(
  "anggota-io",

  async (job) => {
    // ============================================================
    // EXPORT
    // ============================================================
    if (job.name === "EXPORT_ANGGOTAS") {
      await job.updateProgress(5);

      const where = buildAnggotaWhere(job.data);

      const anggotas = await prisma.anggota.findMany({
        where,
        orderBy: { insert_at: "desc" },
        include: {
          pendidikanRef: true,
          pekerjaanRef: true,
          bidangStudiRef: true,
          bidangMinatRef: true,
          cabang: true,
        },
      });

      await job.updateProgress(40);

      const workbook = new ExcelJS.Workbook();
      workbook.creator = "PNPS Admin";
      workbook.created = new Date();

      const ws = workbook.addWorksheet("Anggota");
      ws.columns = EXPORT_COLUMNS;

      // Style header
      ws.getRow(1).eachCell((cell) => {
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1F4E79" } };
        cell.alignment = { vertical: "middle", horizontal: "center" };
        cell.border = {
          bottom: { style: "thin", color: { argb: "FF000000" } },
        };
      });

      anggotas.forEach((s, i) => {
        ws.addRow({
          no: i + 1,
          namaLengkap: s.namaLengkap,
          namaPanggil: s.namaPanggil || "",
          tempatLahir: s.tempatLahir || "",
          tanggalLahir: s.tanggalLahir ? new Date(s.tanggalLahir).toLocaleDateString("id-ID") : "",
          alamat: s.alamat || "",
          angkatan: s.angkatan || "",
          pendidikan: s.pendidikanRef?.nama || "",
          pekerjaan: s.pekerjaanRef?.nama || "",
          bidangStudi: s.bidangStudiRef?.nama || "",
          bidangMinat: s.bidangMinatRef?.nama || "",
          provinsi: s.provinsi || "",
          kotaDomisili: s.kotaDomisili || "",
          cabang: (s as any).cabang?.namaCabang || "",
          noWa: s.noWa || "",
          instagram: s.instagram || "",
          facebook: s.facebook || "",
          statusKeanggotaan: s.statusKeanggotaan,
          approvedPCPS: s.isApprovedByPCPS ? "Ya" : "Tidak",
          approvedPNPS: s.isApprovedByPNPS ? "Ya" : "Tidak",
        });
      });

      await job.updateProgress(80);

      const filename = `anggota-export-${Date.now()}.xlsx`;
      const filepath = path.join(EXPORTS_DIR, filename);
      await workbook.xlsx.writeFile(filepath);

      await job.updateProgress(100);
      return { filename, total: anggotas.length };
    }

    // ============================================================
    // IMPORT
    // ============================================================
    if (job.name === "IMPORT_ANGGOTAS") {
      const { rows, scope } = job.data;
      await job.updateProgress(5);

      const errors: { row: number; field: string; message: string }[] = [];
      let successCount = 0;

      // Pre-fetch / auto-create master data
      const resolveOrCreate = async (
        model: any,
        nama: string | undefined
      ): Promise<string | null> => {
        if (!nama || !nama.trim()) return null;
        const trimmed = nama.trim();
        const existing = await model.findFirst({
          where: { nama: { equals: trimmed, mode: "insensitive" } },
        });
        if (existing) return existing.uuid;
        const created = await model.create({ data: { nama: trimmed } });
        return created.uuid;
      };

      const total = rows.length;
      for (let i = 0; i < total; i++) {
        const row = rows[i];
        const rowNum = i + 2; // +2 because row 1 is header, data starts at row 2

        try {
          // Resolve master data names → UUIDs
          const pendidikanUuid = await resolveOrCreate(prisma.masterPendidikan, row.pendidikan);
          const pekerjaanUuid = await resolveOrCreate(prisma.masterPekerjaan, row.pekerjaan);
          const bidangStudiUuid = await resolveOrCreate(prisma.masterBidangStudi, row.bidangStudi);
          const bidangMinatUuid = await resolveOrCreate(prisma.masterBidangMinat, row.bidangMinat);

          // Validate required field
          if (!row.namaLengkap || row.namaLengkap.trim().length < 3) {
            errors.push({ row: rowNum, field: "Nama Lengkap", message: "Nama lengkap minimal 3 karakter" });
            continue;
          }

          // Validate angkatan
          if (row.angkatan && !/^\d{4}$/.test(String(row.angkatan))) {
            errors.push({ row: rowNum, field: "Angkatan", message: "Harus berupa tahun 4 digit" });
            continue;
          }

          // Parse tanggalLahir
          let tanggalLahir: Date | null = null;
          if (row.tanggalLahir) {
            const parsed = new Date(row.tanggalLahir);
            if (!isNaN(parsed.getTime())) {
              tanggalLahir = parsed;
            }
          }

          // Resolve cabang by name
          let cabangUuid: string | null = scope?.cabangId || null;
          if (row.cabang && row.cabang.trim()) {
            const found = await prisma.cabang.findFirst({
              where: { namaCabang: { equals: row.cabang.trim(), mode: "insensitive" } },
            });
            if (found) cabangUuid = found.uuid;
          }

          await prisma.anggota.create({
            data: {
              namaLengkap: row.namaLengkap.trim(),
              namaPanggil: row.namaPanggil?.trim() || null,
              tempatLahir: row.tempatLahir?.trim() || null,
              tanggalLahir,
              alamat: row.alamat?.trim() || null,
              angkatan: row.angkatan ? String(row.angkatan) : null,
              pendidikanUuid,
              pekerjaanUuid,
              bidangStudiUuid,
              bidangMinatUuid,
              provinsi: row.provinsi?.trim() || null,
              kotaDomisili: row.kotaDomisili?.trim() || null,
              cabangUuid,
              noWa: row.noWa?.trim() || null,
              instagram: row.instagram?.trim() || null,
              facebook: row.facebook?.trim() || null,
              statusKeanggotaan: row.statusKeanggotaan === "MEMBER" ? "MEMBER" : "NON_MEMBER",
            },
          });

          successCount++;
        } catch (err: any) {
          errors.push({ row: rowNum, field: "General", message: err.message || "Gagal menyimpan data" });
        }

        // Update progress every 10 rows
        if (i % 10 === 0 || i === total - 1) {
          await job.updateProgress(Math.round(5 + (i / total) * 90));
        }
      }

      await job.updateProgress(100);
      return { success: successCount, errors, total };
    }
  },

  { connection: bullmqRedis }
);
