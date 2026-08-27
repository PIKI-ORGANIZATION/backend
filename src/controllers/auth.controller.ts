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
      senior: {
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

  // ── Gate 2: Belum di-approve PCPS & PNPS (jika memiliki data Senior) ──
  if (akun.senior && (!akun.senior.isApprovedByPCPS || !akun.senior.isApprovedByPNPS)) {
    const pcps = akun.senior.isApprovedByPCPS ? "✓" : "Pending";
    const pnps = akun.senior.isApprovedByPNPS ? "✓" : "Pending";
    return res.status(403).json({
      message: `Akun Anda menunggu approval. Status: PCPS ${pcps}, PNPS ${pnps}.`,
      code: "APPROVAL_PENDING",
      approval: {
        pcps: akun.senior.isApprovedByPCPS,
        pnps: akun.senior.isApprovedByPNPS,
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
      cabangId: akun.senior?.cabangUuid ?? null,
      cabang: akun.senior?.cabang?.namaCabang ?? null,
      isCabang: akun.senior?.cabang?.isCabang ?? null,
      isApprovedByPCPS: akun.senior?.isApprovedByPCPS ?? false,
      isApprovedByPNPS: akun.senior?.isApprovedByPNPS ?? false,
      isFromAdmin: true,
    };
  } else {

    payload = {
      sub: akun.uuid,
      email: akun.email,
      username: akun.username,
      roles: akun.roles.map(r => r.role.namaRole),
      permissions: uniquePermissions,
      cabangId: akun.senior?.cabangUuid ?? null,
      cabang: akun.senior?.cabang?.namaCabang ?? null,
      isCabang: akun.senior?.cabang?.isCabang ?? null,
      isApprovedByPCPS: akun.senior?.isApprovedByPCPS ?? false,
      isApprovedByPNPS: akun.senior?.isApprovedByPNPS ?? false,
      isFromAdmin: false,
    };
  }

  const tokenPayload = {
    ...payload,
  };

  const token = jwt.sign(tokenPayload, process.env.JWT_SECRET!, {
    algorithm: "HS256",
    expiresIn: process.env.JWT_EXPIRES_IN || "1h",
  });

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
      // 1️ Create Senior first
      const senior = await tx.senior.create({
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
          isApprovedByPCPS: false,
          isApprovedByPNPS: false,
        },
      });

      // 2️ Create Akun linked to Senior
      const akun = await tx.akun.create({
        data: {
          email,
          username,
          password: hashedPassword,
          statusAkun: "PENDING_VERIFICATION",
          emailVerifyToken,
          emailVerifyExpiry,
          seniorUuid: senior.uuid,
        },
      });

      // 3️ Update Senior insert_by
      await tx.senior.update({
        where: { uuid: senior.uuid },
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
      message: "Email berhasil diverifikasi! Silakan tunggu approval dari PCPS dan PNPS.",
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
    
    // Fetch latest status from DB, including the complete senior profile
    const akun = await prisma.akun.findUnique({
      where: { uuid: user.sub },
      include: {
        senior: {
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

    // Format response to include user data AND senior profile mapped
    const profileResponse = {
      ...akun,
      // Overwrite the password field silently
      password: undefined,
      // Map senior properties flat if needed by frontend (or keep nested)
      namaLengkap: akun.senior?.namaLengkap,
      namaPanggil: akun.senior?.namaPanggil,
      profileImg: akun.senior?.profileImg,
      tempatLahir: akun.senior?.tempatLahir,
      tanggalLahir: akun.senior?.tanggalLahir,
      alamat: akun.senior?.alamat,
      pendidikanUuid: akun.senior?.pendidikanUuid,
      pekerjaanUuid: akun.senior?.pekerjaanUuid,
      noWa: akun.senior?.noWa,
      bidangStudiUuid: akun.senior?.bidangStudiUuid,
      bidangMinatUuid: akun.senior?.bidangMinatUuid,
      provinsi: akun.senior?.provinsi,
      kotaDomisili: akun.senior?.kotaDomisili,
      instagram: akun.senior?.instagram,
      facebook: akun.senior?.facebook,
      bio: akun.senior?.bio,
      pesanKesan: akun.senior?.pesanKesan,
      angkatan: akun.senior?.angkatan,
      cabang: akun.senior?.cabang,
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
      include: { senior: true },
    });

    if (!akun || !akun.senior) {
      return res.status(404).json({ message: "Senior profile not found" });
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

    const updatedSenior = await prisma.senior.update({
      where: { uuid: akun.senior.uuid },
      data: updateData,
    });

    return res.status(200).json({
      message: "Profil berhasil diperbarui",
      data: updatedSenior,
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