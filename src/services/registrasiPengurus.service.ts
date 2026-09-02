import { PrismaClient } from "@prisma/client";
import { uuid } from "uuidv4";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

export const createRegistrasiPengurus = async (data: any) => {
  const {
    namaLengkap,
    noWa,
    email,
    tingkat,
    jabatan,
    kode_provinsi,
    kode_kabupaten,
    cabangUuid,
    skKepengurusanUrl
  } = data;

  // Cek apakah email sudah terdaftar di registrasi pengurus
  const existingEmail = await prisma.registrasiPengurus.findFirst({
    where: { email }
  });
  if (existingEmail) {
    throw new Error("Email sudah terdaftar sebagai pengurus.");
  }

  // Buat registrasi
  const registrasi = await prisma.registrasiPengurus.create({
    data: {
      namaLengkap,
      noWa,
      email,
      tingkat,
      jabatan,
      kode_provinsi,
      kode_kabupaten,
      cabangUuid,
      skKepengurusanUrl,
      statusVerifikasi: "PENDING_VERIFIKASI"
    }
  });

  return registrasi;
};

export const getRegistrasiPengurus = async () => {
  return await prisma.registrasiPengurus.findMany({
    orderBy: { created_at: "desc" },
    include: { cabang: true }
  });
};

export const approveRegistrasiPengurus = async (id: string, verifikatorUuid: string) => {
  // Hanya admin pusat (atau PNPS) yang bisa approve ini, tapi untuk MVP kita bypass role check di service
  const registrasi = await prisma.registrasiPengurus.findUnique({
    where: { id }
  });

  if (!registrasi) throw new Error("Data tidak ditemukan");
  if (registrasi.statusVerifikasi !== "PENDING_VERIFIKASI") {
    throw new Error("Data sudah diverifikasi sebelumnya");
  }

  // Generate password default untuk akun
  const defaultPassword = "Password123!";
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  // Buat akun dan update registrasi dalam transaksi
  const result = await prisma.$transaction(async (tx) => {
    // 1. Buat Akun
    const akun = await tx.akun.create({
      data: {
        email: registrasi.email,
        username: registrasi.email.split("@")[0] + Math.floor(Math.random() * 1000),
        password: hashedPassword,
        statusAkun: "ACTIVE"
      }
    });

    // 2. Assign Role (DPC atau DPD)
    let roleName = registrasi.tingkat === "DPD" ? "DPD" : "DPC";
    const role = await tx.role.findUnique({ where: { name: roleName } });
    if (role) {
      await tx.akunRole.create({
        data: {
          akunUuid: akun.uuid,
          roleId: role.id
        }
      });
    }

    // 3. Update status registrasi
    const updated = await tx.registrasiPengurus.update({
      where: { id },
      data: {
        statusVerifikasi: "APPROVED",
        verifikatorUuid,
        tglVerifikasi: new Date(),
        akunUuid: akun.uuid
      }
    });

    return { updated, akun, defaultPassword };
  });

  return result;
};
