import { prisma } from "../config/prisma";
import bcrypt from "bcrypt";
import {
  sendRegistrasiSubmitEmail,
  sendRegistrasiVerifikasiEmail,
  sendRegistrasiPembayaranEmail,
  sendRegistrasiAktivasiKtaEmail,
  sendNotifikasiPendaftarBaru,
} from "../config/email";

export interface CreateRegistrasiDTO {
  nik: string;
  namaLengkap: string;
  tanggalLahir: string | Date;
  noWa: string;
  email: string;
  confirmEmail?: string;
  password?: string;
  alamatDomisili: string;
  fileKtpUrl: string;

  dpp?: string;
  dpc?: string;
  kode_provinsi?: string;
  kode_kabupaten?: string;
  cabangUuid?: string;
  kotaDomisili?: string;
  tingkatPendidikan?: string;
  pendidikanUuid?: string;
  pekerjaan?: string;
  pekerjaanUuid?: string;
  minatBidang?: string;
  bidangMinatUuid?: string;
  motivasiBergabung?: string;

  setujuKebenaranData?: boolean;
  setujuPengelolaanData?: boolean;
  setujuKerahasiaanData?: boolean;
  created_by?: string;
}

export const createRegistrasi = async (data: CreateRegistrasiDTO) => {
  if (!data.email) {
    throw new Error("Email wajib diisi");
  }
  if (!data.noWa) {
    throw new Error("Nomor WhatsApp wajib diisi");
  }
  if (
    data.confirmEmail &&
    data.confirmEmail.trim().toLowerCase() !== data.email.trim().toLowerCase()
  ) {
    throw new Error(
      "Email konfirmasi akun tidak cocok dengan email pendaftaran",
    );
  }

  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  const noTagihan = `INV-PIKI-${dateStr}-${randomNum}`;

  const registrasi = await prisma.$transaction(async (tx) => {
    // 0. Cek apakah email sudah pernah mendaftar
    const existingReg = await tx.registrasi.findFirst({
      where: { email: data.email },
    });

    if (existingReg) {
      throw new Error(
        "Email ini sudah digunakan untuk pendaftaran. Silakan gunakan email lain atau cek status pendaftaran Anda.",
      );
    }

    // 1. Buat atau cari Akun pengguna berdasarkan email
    let akun = await tx.akun.findUnique({
      where: { email: data.email },
    });

    if (!akun) {
      const emailPrefix = data.email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "");
      const username = `${emailPrefix}_${Math.floor(1000 + Math.random() * 9000)}`;
      const rawPassword = data.password || "password123";
      const hashedPassword = await bcrypt.hash(rawPassword, 10);

      akun = await tx.akun.create({
        data: {
          email: data.email,
          username,
          password: hashedPassword,
          statusAkun: "ACTIVE",
        },
      });

      // Hubungkan Role USER jika tersedia
      const defaultRole = await tx.role.findFirst({
        where: {
          namaRole: {
            in: ["USER", "MEMBER", "User", "Member"],
            mode: "insensitive",
          },
        },
      });

      if (defaultRole) {
        await tx.akunRole.create({
          data: {
            akunUuid: akun.uuid,
            roleUuid: defaultRole.uuid,
          },
        });
      }
    }

    // 2. Buat Pendaftaran Registrasi
    const newReg = await tx.registrasi.create({
      data: {
        nik: data.nik,
        namaLengkap: data.namaLengkap,
        tanggalLahir: new Date(data.tanggalLahir),
        noWa: data.noWa,
        email: data.email,
        alamatDomisili: data.alamatDomisili,
        fileKtpUrl: data.fileKtpUrl,

        akunUuid: akun.uuid,

        dpp: data.dpp || null,
        dpc: data.dpc || null,
        kode_provinsi: data.kode_provinsi || null,
        kode_kabupaten: data.kode_kabupaten || null,
        cabangUuid: data.cabangUuid || null,
        kotaDomisili: data.kotaDomisili || data.dpc || null,
        tingkatPendidikan: data.tingkatPendidikan || null,
        pendidikanUuid: data.pendidikanUuid || null,
        pekerjaan: data.pekerjaan || null,
        pekerjaanUuid: data.pekerjaanUuid || null,
        minatBidang: data.minatBidang || null,
        bidangMinatUuid: data.bidangMinatUuid || null,
        motivasiBergabung: data.motivasiBergabung || null,

        setujuKebenaranData: data.setujuKebenaranData ?? true,
        setujuPengelolaanData: data.setujuPengelolaanData ?? true,
        setujuKerahasiaanData: data.setujuKerahasiaanData ?? true,
        tglPersetujuanPdp: new Date(),

        statusVerifikasi: "PENDING_VERIFIKASI_DPP",
        statusPembayaran: "UNPAID",
        noTagihan,
        nominalIuran: 50000,
        statusKta: "INACTIVE",
        langkahSekarang: 1,

        created_by: data.created_by || null,
      },
      include: {
        akun: {
          select: {
            uuid: true,
            email: true,
            username: true,
            statusAkun: true,
          },
        },
      },
    });

    // 3. Catat Log Audit Trail
    await tx.registrasiLog.create({
      data: {
        registrasiId: newReg.id,
        aksi: "SUBMIT_REGISTRASI",
        keterangan:
          "Pendaftaran Tahap 1 berhasil di-submit. Akun dibuat & masuk antrean verifikasi DPP (Pusat).",
        actorNama: data.namaLengkap,
      },
    });

    return newReg;
  });

  // Kirim Notifikasi Email
  try {
    await sendRegistrasiSubmitEmail(data.email, data.namaLengkap, noTagihan);

    // Kirim notifikasi ke Pengurus DPC/DPP (Jika cabang dipilih)
    if (registrasi.cabangUuid) {
      const pengurusList = await prisma.registrasiPengurus.findMany({
        where: { cabangUuid: registrasi.cabangUuid, statusVerifikasi: "APPROVED" }
      });
      for (const p of pengurusList) {
        await sendNotifikasiPendaftarBaru(
          p.email,
          p.namaLengkap,
          data.namaLengkap,
          `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/verifikasi`
        );
      }
      // Kirim ke Superadmin juga
      await sendNotifikasiPendaftarBaru(
        "adiyahardi335@gmail.com",
        "Superadmin",
        data.namaLengkap,
        `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/verifikasi`
      );
    }
  } catch (err) {
    console.error("Gagal mengirim email submit registrasi:", err);
  }

  return registrasi;
};

export const getRegistrasiList = async (params: {
  search?: string;
  cabangUuid?: string;
  statusVerifikasi?: string;
  statusPembayaran?: string;
  statusKta?: string;
  langkahSekarang?: number;
  skip?: number;
  take?: number;
}) => {
  const where: any = {};

  if (params.search) {
    where.OR = [
      { namaLengkap: { contains: params.search, mode: "insensitive" } },
      { email: { contains: params.search, mode: "insensitive" } },
      { noWa: { contains: params.search, mode: "insensitive" } },
      { noKta: { contains: params.search, mode: "insensitive" } },
    ];
  }

  if (params.cabangUuid) where.cabangUuid = params.cabangUuid;
  if (params.statusVerifikasi) where.statusVerifikasi = params.statusVerifikasi;
  if (params.statusPembayaran) where.statusPembayaran = params.statusPembayaran;
  if (params.statusKta) where.statusKta = params.statusKta;
  if (params.langkahSekarang)
    where.langkahSekarang = Number(params.langkahSekarang);

  const take = params.take ? Number(params.take) : 10;
  const skip = params.skip ? Number(params.skip) : 0;

  const [total, data] = await Promise.all([
    prisma.registrasi.count({ where }),
    prisma.registrasi.findMany({
      where,
      skip,
      take,
      orderBy: { created_at: "desc" },
      include: {
        akun: {
          select: { uuid: true, email: true, username: true, statusAkun: true },
        },
        cabang: {
          select: {
            uuid: true,
            namaCabang: true,
            kabupatenKota: true,
            provinsi: true,
          },
        },
      },
    }),
  ]);

  return { total, page: Math.floor(skip / take) + 1, limit: take, data };
};

export const getRegistrasiById = async (id: string) => {
  return prisma.registrasi.findUnique({
    where: { id },
    include: {
      akun: {
        select: {
          uuid: true,
          email: true,
          username: true,
          statusAkun: true,
          roles: {
            include: {
              role: { select: { uuid: true, nama: true } },
            },
          },
        },
      },
      cabang: true,
      logs: { orderBy: { created_at: "desc" } },
    },
  });
};

export const updateRegistrasi = async (
  id: string,
  data: any,
  updatedBy?: string,
) => {
  const updated = await prisma.registrasi.update({
    where: { id },
    data: {
      ...data,
      updated_by: updatedBy || null,
    },
  });
  return updated;
};

export const verifikasiRegistrasi = async (params: {
  id: string;
  status: "APPROVED_DPC" | "APPROVED_DPP" | "REJECTED";
  verifikatorUuid?: string;
  actorNama?: string;
  catatanVerifikasi?: string;
}) => {
  const reg = await prisma.registrasi.findUnique({ where: { id: params.id } });
  if (!reg) throw new Error("Data registrasi tidak ditemukan");

  const isApproved =
    params.status === "APPROVED_DPC" || params.status === "APPROVED_DPP";
  const langkahNext = isApproved ? 4 : 2;

  const updated = await prisma.$transaction(async (tx) => {
    const updatedReg = await tx.registrasi.update({
      where: { id: params.id },
      data: {
        statusVerifikasi: params.status,
        verifikatorUuid: params.verifikatorUuid || null,
        catatanVerifikasi: params.catatanVerifikasi || null,
        tglVerifikasi: new Date(),
        langkahSekarang: langkahNext,
        updated_by: params.verifikatorUuid || null,
      },
    });

    await tx.registrasiLog.create({
      data: {
        registrasiId: params.id,
        aksi: `VERIFIKASI_${params.status}`,
        keterangan: `Verifikasi pendaftaran diproses dengan status ${params.status}. Catatan: ${params.catatanVerifikasi || "-"}`,
        actorUuid: params.verifikatorUuid || null,
        actorNama: params.actorNama || "Verifikator",
      },
    });

    return updatedReg;
  });

  // Email Notification
  try {
    await sendRegistrasiVerifikasiEmail(
      reg.email,
      reg.namaLengkap,
      params.status,
      params.catatanVerifikasi,
    );
  } catch (err) {
    console.error("Gagal mengirim email verifikasi:", err);
  }

  return updated;
};

export const checkAndBypassSla = async (
  actorNama: string = "System SLA Scheduler",
) => {
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

  const pendingList = await prisma.registrasi.findMany({
    where: {
      statusVerifikasi: "PENDING_VERIFIKASI_DPC",
      created_at: { lte: threeDaysAgo },
    },
  });

  const bypassed: any[] = [];

  for (const reg of pendingList) {
    const updated = await prisma.$transaction(async (tx) => {
      const b = await tx.registrasi.update({
        where: { id: reg.id },
        data: {
          statusVerifikasi: "BYPASSED_TO_DPP",
          isBypassedSla: true,
          tglBypassSla: new Date(),
          langkahSekarang: 3,
        },
      });

      await tx.registrasiLog.create({
        data: {
          registrasiId: reg.id,
          aksi: "SLA_AUTO_BYPASS_DPP",
          keterangan:
            "DPC tidak memproses verifikasi dalam 3 hari kerja. Berkas otomatis diekskalasi (auto-bypass) ke DPP.",
          actorNama,
        },
      });

      return b;
    });

    bypassed.push(updated);

    try {
      await sendRegistrasiVerifikasiEmail(
        reg.email,
        reg.namaLengkap,
        "BYPASSED_TO_DPP",
        "Berkas Anda diekskalasi otomatis ke DPP karena batas waktu DPC melebihi 3 hari kerja.",
      );
    } catch (err) {
      console.error(`Gagal kirim email bypass ke ${reg.email}:`, err);
    }
  }

  return { count: bypassed.length, bypassed };
};

export const prosesPembayaran = async (params: {
  id: string;
  buktiBayarUrl?: string;
  statusPembayaran?: "PAID" | "PENDING_CONFIRMATION" | "FAILED";
  nominalIuran?: number;
  actorUuid?: string;
  actorNama?: string;
}) => {
  const reg = await prisma.registrasi.findUnique({ where: { id: params.id } });
  if (!reg) throw new Error("Data registrasi tidak ditemukan");

  const statusPay = params.statusPembayaran || "PAID";
  const langkahNext = statusPay === "PAID" ? 5 : 4;

  const updated = await prisma.$transaction(async (tx) => {
    const res = await tx.registrasi.update({
      where: { id: params.id },
      data: {
        statusPembayaran: statusPay,
        buktiBayarUrl: params.buktiBayarUrl || reg.buktiBayarUrl,
        nominalIuran: params.nominalIuran ?? reg.nominalIuran,
        tglPembayaran: new Date(),
        langkahSekarang: langkahNext,
        updated_by: params.actorUuid || null,
      },
    });

    await tx.registrasiLog.create({
      data: {
        registrasiId: params.id,
        aksi: "PEMBAYARAN_IURAN",
        keterangan: `Pembayaran iuran dikonfirmasi dengan status ${statusPay}.`,
        actorUuid: params.actorUuid || null,
        actorNama: params.actorNama || reg.namaLengkap,
      },
    });

    return res;
  });

  if (statusPay === "PAID") {
    try {
      await sendRegistrasiPembayaranEmail(
        reg.email,
        reg.namaLengkap,
        reg.noTagihan || undefined,
      );
    } catch (err) {
      console.error("Gagal mengirim email pembayaran:", err);
    }
  }

  return updated;
};

export const aktivasiKta = async (params: {
  id: string;
  actorUuid?: string;
  actorNama?: string;
  customNoKta?: string;
}) => {
  const reg = await prisma.registrasi.findUnique({ where: { id: params.id } });
  if (!reg) throw new Error("Data registrasi tidak ditemukan");

  const year = new Date().getFullYear();
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  const noKta = params.customNoKta || `KTA-PIKI-${year}-${randomNum}`;
  const fileKtaUrl = `/uploads/kta/${reg.id}.pdf`;

  const updated = await prisma.$transaction(async (tx) => {
    // 1. Buat record Senior baru jika belum ada
    let seniorUuid = reg.seniorUuid;
    if (!seniorUuid) {
      const newSenior = await tx.senior.create({
        data: {
          namaLengkap: reg.namaLengkap,
          tanggalLahir: reg.tanggalLahir,
          alamat: reg.alamatDomisili,
          kotaDomisili: reg.kotaDomisili || null,
          cabangUuid: reg.cabangUuid || null,
          pendidikanUuid: reg.pendidikanUuid || null,
          pekerjaanUuid: reg.pekerjaanUuid || null,
          bidangMinatUuid: reg.bidangMinatUuid || null,
          pesanKesan: reg.motivasiBergabung || null,
          isApprovedByPCPS: true,
          isApprovedByPNPS: true,
        },
      });
      seniorUuid = newSenior.uuid;
    }

    // 2. Hubungkan seniorUuid ke Akun jika ada
    if (reg.akunUuid) {
      await tx.akun.update({
        where: { uuid: reg.akunUuid },
        data: { seniorUuid },
      });
    }

    // 3. Update status Registrasi
    const res = await tx.registrasi.update({
      where: { id: params.id },
      data: {
        statusKta: "ACTIVE",
        noKta,
        fileKtaUrl,
        tglAktivasiKta: new Date(),
        seniorUuid,
        langkahSekarang: 5,
        updated_by: params.actorUuid || null,
      },
    });

    // 4. Catat log aktivasi
    await tx.registrasiLog.create({
      data: {
        registrasiId: params.id,
        aksi: "AKTIVASI_KTA",
        keterangan: `KTA Digital diterbitkan dengan Nomor: ${noKta}. Status Keanggotaan Aktif Resmi.`,
        actorUuid: params.actorUuid || null,
        actorNama: params.actorNama || "Admin Registrasi",
      },
    });

    return res;
  });

  try {
    await sendRegistrasiAktivasiKtaEmail(reg.email, reg.namaLengkap, noKta);
  } catch (err) {
    console.error("Gagal mengirim email aktivasi KTA:", err);
  }

  return updated;
};

export const deleteRegistrasi = async (id: string) => {
  return prisma.registrasi.delete({ where: { id } });
};
