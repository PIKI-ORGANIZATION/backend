import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { prisma } from "../config/prisma.js";
import redisClient from "../config/redis.js";
import { sendVerificationEmail, sendResetPasswordEmail } from "../config/email.js";


const recordFailedLogin = async (key: string) => {
  const attempts = await redisClient.incr(key);

  if (attempts === 1) {
    await redisClient.expire(key, 15 * 60);
  }
};

const resetLoginAttempts = async (key: string) => {
  await redisClient.del(key);
};

export const login = async (req: Request, res: Response) => {
  const { identifier, password, isFromAdmin } = req.body;
  const ip = req.ip ?? req.socket.remoteAddress ?? "unknown";
  const rateKey = `login:${ip}:${identifier}`;

  const akun = await prisma.akun.findFirst({
    where: {
      OR: [{ email: identifier }, { username: identifier }],
    },
    include: {
      anggota: {
        include: {
          cabang: true,
        },
      },
      roles: {
        include: {
          role: {
            include: {
              permissions: {
                include: { permission: true },
              },
            },
          },
        },
      },
    },
  });

  if (!akun) {
    await recordFailedLogin(rateKey);
    return res.status(401).json({ message: "Credential salah" });
  }

  const valid = await bcrypt.compare(password, akun.password);
  if (!valid) {
    await recordFailedLogin(rateKey);
    return res.status(401).json({ message: "Credential salah" });
  }

  // ── Gate 1: Email belum diverifikasi ──
  if (akun.statusAkun === "PENDING_VERIFICATION") {
    return res.status(403).json({
      message: "Email belum diverifikasi. Silakan cek inbox email Anda.",
      code: "EMAIL_NOT_VERIFIED",
    });
  }

  // ── Gate 2: Belum di-approve DPC & DPP (jika memiliki data Anggota) ──
  const anggotaAny = akun.anggota as any;
  if (akun.anggota && (!anggotaAny.isApprovedByDPC || !anggotaAny.isApprovedByDPP)) {
    const dpc = anggotaAny.isApprovedByDPC ? "✓" : "Pending";
    const dpp = anggotaAny.isApprovedByDPP ? "✓" : "Pending";
    return res.status(403).json({
      message: `Akun Anda menunggu approval. Status: DPC ${dpc}, DPP ${dpp}.`,
      code: "APPROVAL_PENDING",
      approval: {
        dpc: anggotaAny.isApprovedByDPC,
        dpp: anggotaAny.isApprovedByDPP,
      },
    });
  }

  await resetLoginAttempts(rateKey);

  const permissions = akun.roles.flatMap(ar =>
    ar.role.permissions.map(rp => rp.permission.namaPermission)
  );

  const uniquePermissions = [...new Set(permissions)];

  let payload = {};

  if (isFromAdmin || isFromAdmin === "true") {
    payload = {
      sub: akun.uuid,
      email: akun.email,
      username: akun.username,
      roles: akun.roles.map(r => r.role.namaRole),
      permissions: uniquePermissions,
      cabangId: akun.anggota?.cabangUuid ?? null,
      cabang: akun.anggota?.cabang?.namaCabang ?? null,
      isCabang: akun.anggota?.cabang?.isCabang ?? null,
      isApprovedByDPC: anggotaAny?.isApprovedByDPC ?? false,
      isApprovedByDPP: anggotaAny?.isApprovedByDPP ?? false,
      isFromAdmin: true,
    };
  } else {

    payload = {
      sub: akun.uuid,
      email: akun.email,
      username: akun.username,
      roles: akun.roles.map(r => r.role.namaRole),
      permissions: uniquePermissions,
      cabangId: akun.anggota?.cabangUuid ?? null,
      cabang: akun.anggota?.cabang?.namaCabang ?? null,
      isCabang: akun.anggota?.cabang?.isCabang ?? null,
      isApprovedByDPC: anggotaAny?.isApprovedByDPC ?? false,
      isApprovedByDPP: anggotaAny?.isApprovedByDPP ?? false,
      isFromAdmin: false,
    };
  }

  const tokenPayload = {
    ...payload,
  };

  const token = jwt.sign(tokenPayload, process.env.JWT_SECRET!, {
    algorithm: "HS256",
    expiresIn: process.env.JWT_EXPIRES_IN || "1h",
  } as any);

  return res.json({
    tokenType: "Bearer",
    accessToken: token,
  });
};

export const register = async (req: Request, res: Response) => {
  try {
    const {
      email,
      username,
      password,
      namaLengkap,
      namaPanggil,
      tempatLahir,
      tanggalLahir,
      alamat,
      pendidikanUuid,
      pekerjaanUuid,
      noWa,
      pesanKesan,
      cabangUuid,
      angkatan,
      bidangStudiUuid,
      bidangMinatUuid,
      provinsi,
      kotaDomisili,
      profileImg,
      instagram,
      facebook,
    } = req.body;

    if (!email || !username || !password || !namaLengkap || !cabangUuid) {
      return res.status(400).json({
        message: "Field wajib belum lengkap",
      });
    }

    const existing = await prisma.akun.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existing) {
      return res.status(409).json({
        message: "Email atau username sudah terdaftar",
      });
    }

    const cabang = await prisma.cabang.findUnique({
      where: { uuid: cabangUuid },
    });

    if (!cabang) {
      return res.status(404).json({
        message: "Cabang tidak ditemukan",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate email verification token
    const emailVerifyToken = crypto.randomBytes(32).toString("hex");
    const emailVerifyExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const result = await prisma.$transaction(async (tx) => {
      // 1️ Create Anggota first
      const anggota = await tx.anggota.create({
        data: {
          namaLengkap,
          namaPanggil,
          tempatLahir,
          tanggalLahir: tanggalLahir ? new Date(tanggalLahir) : null,
          alamat,
          pendidikanUuid,
          pekerjaanUuid,
          pesanKesan,
          noWa,
          angkatan,
          bidangStudiUuid,
          bidangMinatUuid,
          provinsi,
          kotaDomisili,
          profileImg,
          instagram,
          facebook,
          cabangUuid,
          isApprovedByDPC: false,
          isApprovedByDPP: false,
        } as any,
      });

      // 2️ Create Akun linked to Anggota
      const akun = await tx.akun.create({
        data: {
          email,
          username,
          password: hashedPassword,
          statusAkun: "PENDING_VERIFICATION",
          emailVerifyToken,
          emailVerifyExpiry,
          anggotaUuid: anggota.uuid,
        },
      });

      // 3️ Update Anggota insert_by
      await tx.anggota.update({
        where: { uuid: anggota.uuid },
        data: { insert_by: akun.uuid },
      });

      // 4️ Assign Role USER
      const roleUser = await tx.role.findUnique({
        where: { namaRole: "USER" },
      });

      if (!roleUser) throw new Error("Role USER belum tersedia");

      await tx.akunRole.create({
        data: {
          akunUuid: akun.uuid,
          roleUuid: roleUser.uuid,
          insert_by: akun.uuid,
        },
      });

      return akun;
    });

    // Send verification email (non-blocking — don't fail register if email fails)
    try {
      await sendVerificationEmail(result.email, emailVerifyToken);
    } catch (emailErr) {
      console.error("Failed to send verification email:", emailErr);
    }

    return res.status(201).json({
      message: "Registrasi berhasil! Silakan cek email Anda untuk verifikasi.",
    });
  } catch (error: any) {
    console.error("Register error:", error);
    return res.status(500).json({
      message: error.message || "Internal server error",
    });
  }
};

// Verify Email
export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: "Token tidak valid" });
    }

    const akun = await prisma.akun.findUnique({
      where: { emailVerifyToken: token },
    });

    if (!akun) {
      return res.status(400).json({ message: "Token tidak valid atau sudah digunakan" });
    }

    if (akun.emailVerifyExpiry && akun.emailVerifyExpiry < new Date()) {
      return res.status(400).json({ message: "Token sudah kedaluwarsa. Silakan daftar ulang." });
    }

    if (akun.statusAkun === "ACTIVE") {
      return res.status(200).json({ message: "Email sudah diverifikasi sebelumnya" });
    }

    await prisma.akun.update({
      where: { uuid: akun.uuid },
      data: {
        statusAkun: "ACTIVE",
        emailVerifyToken: null,
        emailVerifyExpiry: null,
      },
    });

    return res.status(200).json({
      message: "Email berhasil diverifikasi! Silakan tunggu approval dari DPC dan DPP.",
    });
  } catch (error: any) {
    console.error("Verify email error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Forgot Password
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email wajib diisi" });
    }

    const akun = await prisma.akun.findUnique({
      where: { email },
    });

    if (!akun) {
      return res.status(404).json({
        message: "Email tidak terdaftar dalam sistem kami.",
      });
    }

    // Generate token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetExpiry = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour

    await prisma.akun.update({
      where: { uuid: akun.uuid },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordExpiry: resetExpiry,
      },
    });

    // Send email
    try {
      await sendResetPasswordEmail(akun.email, resetToken);
    } catch (emailErr) {
      console.error("Failed to send reset password email:", emailErr);
    }

    return res.status(200).json({
      message: "Instruksi reset password telah dikirim ke email Anda.",
    });
  } catch (error: any) {
    console.error("Forgot password error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Reset Password
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ message: "Token dan password wajib diisi" });
    }

    const akun = await prisma.akun.findUnique({
      where: { resetPasswordToken: token },
    });

    if (!akun || (akun.resetPasswordExpiry && akun.resetPasswordExpiry < new Date())) {
      return res.status(400).json({ message: "Token tidak valid atau sudah kedaluwarsa" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.akun.update({
      where: { uuid: akun.uuid },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpiry: null,
      },
    });

    return res.status(200).json({
      message: "Password berhasil diperbarui! Silakan login dengan password baru Anda.",
    });
  } catch (error: any) {
    console.error("Reset password error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Resend Verification Email
export const resendVerification = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email wajib diisi" });
    }

    const akun = await prisma.akun.findUnique({
      where: { email },
    });

    if (!akun) {
      // Security: Don't reveal if email exists
      return res.status(200).json({ message: "Jika email terdaftar, email verifikasi baru telah dikirim." });
    }

    if (akun.statusAkun !== "PENDING_VERIFICATION") {
      return res.status(400).json({ message: "Akun ini sudah aktif atau tidak membutuhkan verifikasi." });
    }

    // Generate new token
    const newEmailVerifyToken = crypto.randomBytes(32).toString("hex");
    const newEmailVerifyExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.akun.update({
      where: { uuid: akun.uuid },
      data: {
        emailVerifyToken: newEmailVerifyToken,
        emailVerifyExpiry: newEmailVerifyExpiry,
      },
    });

    // Send email
    try {
      await sendVerificationEmail(akun.email, newEmailVerifyToken);
    } catch (emailErr) {
      console.error("Failed to resend verification email:", emailErr);
      // We still return success to the user, but log the error
    }

    return res.status(200).json({
      message: "Email verifikasi baru telah dikirim. Silakan cek inbox Anda.",
    });
  } catch (error: any) {
    console.error("Resend verification error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Logout
export const logout = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];

    // Decode jwt token
    const decoded: any = jwt.decode(token);

    if (!decoded?.exp) {
      return res.status(401).json({ message: "Invalid token" });
    }

    const now = Math.floor(Date.now() / 1000);
    const ttl = decoded.exp - now;

    if (ttl > 0) {
      await redisClient.set(`blacklist:${token}`, "true", {
        EX: ttl,
      });
    }

    return res.json({ message: "Logout berhasil" });

  } catch (error: any) {
    console.error("Logout error:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// Get current user (token validation)
export const getMe = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    // Fetch latest status from DB, including the complete anggota profile
    const akun = await prisma.akun.findUnique({
      where: { uuid: user.sub },
      include: {
        anggota: {
          include: {
            cabang: true,
          },
        },
        roles: {
          include: { role: true },
        },
      },
    });

    if (!akun) {
      return res.status(404).json({ message: "Akun tidak ditemukan" });
    }

    // Ambil data registrasi untuk mendapatkan Nomor Anggota KTA
    const registrasi = await prisma.registrasi.findFirst({
      where: { email: akun.email, statusKta: "ACTIVE" },
      select: { noKta: true },
    });

    // Format response to include user data AND anggota profile mapped
    const profileResponse = {
      ...akun,
      // Overwrite the password field silently
      password: undefined,
      // Map anggota properties flat if needed by frontend (or keep nested)
      namaLengkap: akun.anggota?.namaLengkap,
      namaPanggil: akun.anggota?.namaPanggil,
      profileImg: akun.anggota?.profileImg,
      tempatLahir: akun.anggota?.tempatLahir,
      tanggalLahir: akun.anggota?.tanggalLahir,
      alamat: akun.anggota?.alamat,
      pendidikanUuid: akun.anggota?.pendidikanUuid,
      pekerjaanUuid: akun.anggota?.pekerjaanUuid,
      noWa: akun.anggota?.noWa,
      bidangStudiUuid: akun.anggota?.bidangStudiUuid,
      bidangMinatUuid: akun.anggota?.bidangMinatUuid,
      provinsi: akun.anggota?.provinsi,
      kotaDomisili: akun.anggota?.kotaDomisili,
      instagram: akun.anggota?.instagram,
      facebook: akun.anggota?.facebook,
      bio: akun.anggota?.bio,
      pesanKesan: akun.anggota?.pesanKesan,
      angkatan: akun.anggota?.angkatan,
      cabang: akun.anggota?.cabang,
      noKta: registrasi?.noKta || null, // <- tambahkan ini agar UI bisa membaca NIA dari db
    };

    return res.status(200).json({
      message: "Berhasil mendapatkan data user",
      data: profileResponse,
    });
  } catch (error: any) {
    console.error("Get Me error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

////////////////////////////////////////////////////
// UPDATE PROFILE (Self-serve)
////////////////////////////////////////////////////
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const akun = await prisma.akun.findUnique({
      where: { uuid: user.sub },
      include: { anggota: true },
    });

    if (!akun || !akun.anggota) {
      return res.status(404).json({ message: "Anggota profile not found" });
    }

    const {
      namaLengkap,
      namaPanggil,
      profileImg,
      tempatLahir,
      tanggalLahir,
      alamat,
      pendidikanUuid,
      pekerjaanUuid,
      noWa,
      bidangStudiUuid,
      bidangMinatUuid,
      provinsi,
      kotaDomisili,
      bio,
      pesanKesan,
      angkatan,
      instagram,
      facebook,
    } = req.body;

    const updateData: any = {
      update_by: user.sub,
    };

    if (namaLengkap !== undefined) updateData.namaLengkap = namaLengkap;
    if (namaPanggil !== undefined) updateData.namaPanggil = namaPanggil;
    if (profileImg !== undefined) updateData.profileImg = profileImg;
    if (tempatLahir !== undefined) updateData.tempatLahir = tempatLahir;
    if (tanggalLahir !== undefined) updateData.tanggalLahir = tanggalLahir ? new Date(tanggalLahir) : null;
    if (alamat !== undefined) updateData.alamat = alamat;
    if (pendidikanUuid !== undefined) updateData.pendidikanUuid = pendidikanUuid;
    if (pekerjaanUuid !== undefined) updateData.pekerjaanUuid = pekerjaanUuid;
    if (noWa !== undefined) updateData.noWa = noWa;
    if (bidangStudiUuid !== undefined) updateData.bidangStudiUuid = bidangStudiUuid;
    if (bidangMinatUuid !== undefined) updateData.bidangMinatUuid = bidangMinatUuid;
    if (provinsi !== undefined) updateData.provinsi = provinsi;
    if (kotaDomisili !== undefined) updateData.kotaDomisili = kotaDomisili;
    if (bio !== undefined) updateData.bio = bio;
    if (pesanKesan !== undefined) updateData.pesanKesan = pesanKesan;
    if (angkatan !== undefined) updateData.angkatan = angkatan;
    if (instagram !== undefined) updateData.instagram = instagram;
    if (facebook !== undefined) updateData.facebook = facebook;

    const updatedAnggota = await prisma.anggota.update({
      where: { uuid: akun.anggota.uuid },
      data: updateData,
    });

    return res.status(200).json({
      message: "Profil berhasil diperbarui",
      data: updatedAnggota,
    });
  } catch (error: any) {
    console.error("Update Profile error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const changePassword = async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: "Password lama dan baru wajib diisi" });
    }

    const akun = await prisma.akun.findUnique({
      where: { uuid: user.sub },
    });

    if (!akun) {
      return res.status(404).json({ message: "Akun tidak ditemukan" });
    }

    const valid = await bcrypt.compare(oldPassword, akun.password);
    if (!valid) {
      return res.status(401).json({ message: "Password lama salah" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.akun.update({
      where: { uuid: akun.uuid },
      data: { password: hashedPassword },
    });

    return res.status(200).json({ message: "Password berhasil diubah" });
  } catch (error: any) {
    console.error("Change Password error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
