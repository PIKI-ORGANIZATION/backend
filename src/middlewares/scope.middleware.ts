import { Request, Response, NextFunction } from "express";
import prisma from "../config/prisma";

export interface RequestScope {
  isAdmin: boolean;
  isSuperAdmin: boolean;
  cabangId: string | null;
  tingkat: "DPD" | "DPC" | null;
  dpdId: string | null;
  dpcId: number | null;
  kodeProvinsi: string | null;
  kodeKabupaten: string | null;
}

declare global {
  namespace Express {
    interface Request {
      scope?: RequestScope;
    }
  }
}

export const scope = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user;

    const permissions = user?.permissions || [];
    const roles: string[] = Array.isArray((user as any)?.roles)
      ? (user as any).roles
      : [];
    const hasAdminRole = roles.some((r) =>
      [
        "SUPER_ADMIN",
        "ADMIN_CABANG",
        "KETUA_CABANG",
        "ADMIN_DPP",
        "ADMIN_DPD",
        "ADMIN_DPC",
      ].includes(String(r).toUpperCase())
    );

    const isSuperAdmin = permissions.includes("MANAGE_ALL_CABANG");
    const isAdmin =
      user?.isFromAdmin === true || isSuperAdmin || hasAdminRole;

    let kodeProvinsi: string | null = null;
    let kodeKabupaten: string | null = null;

    // Resolusi kode wilayah berdasarkan hierarki akun (DPD / DPC)
    if (!isSuperAdmin && user) {
      if (user.tingkat === "DPD" && user.dpdId) {
        const dpd = await prisma.dpd.findFirst({
          where: { id: user.dpdId, deletedAt: null },
          select: { kodeProvinsi: true },
        });
        kodeProvinsi = dpd?.kodeProvinsi ?? null;
      } else if (user.tingkat === "DPC" && user.dpcId) {
        const dpc = await prisma.dpdDpc.findFirst({
          where: { id: user.dpcId, deleted_at: null },
          select: { kode_kabupaten: true, kode_provinsi: true },
        });
        kodeKabupaten = dpc?.kode_kabupaten ?? null;
        kodeProvinsi = dpc?.kode_provinsi ?? null;
      }
    }

    req.scope = {
      isAdmin,
      isSuperAdmin,
      cabangId: user?.cabangId ?? null,
      tingkat: user?.tingkat ?? null,
      dpdId: user?.dpdId ?? null,
      dpcId: user?.dpcId ?? null,
      kodeProvinsi,
      kodeKabupaten,
    };

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Membangun klausa filter Prisma `AnggotaWhereInput` berdasarkan scope hierarki (DPP / DPD / DPC).
 * - SuperAdmin (DPP): `null` (melihat seluruh anggota nasional).
 * - Admin DPD: melihat seluruh anggota di provinsinya (`kode_provinsi`), termasuk semua DPC di bawah provinsi tersebut.
 * - Admin DPC: melihat anggota di kabupaten/kotanya (`kode_kabupaten`).
 */
export const buildAnggotaScopeWhere = async (
  scope?: RequestScope
): Promise<Record<string, any> | null> => {
  if (!scope?.isAdmin) {
    return {
      isApprovedByDPC: true,
      isApprovedByDPP: true,
    };
  }

  if (scope.isSuperAdmin) {
    return null;
  }

  if (scope.tingkat === "DPC") {
    if (scope.kodeKabupaten) {
      const orConditions: any[] = [
        {
          akun: {
            is: {
              registrasiList: {
                is: { kode_kabupaten: scope.kodeKabupaten },
              },
            },
          },
        },
        {
          cabang: {
            is: {
              dpcRef: {
                is: { kode_kabupaten: scope.kodeKabupaten },
              },
            },
          },
        },
      ];

      if (scope.cabangId) {
        orConditions.push({ cabangUuid: scope.cabangId });
      }

      const regRows = await prisma.registrasi.findMany({
        where: {
          kode_kabupaten: scope.kodeKabupaten,
          anggotaUuid: { not: null },
        },
        select: { anggotaUuid: true },
      });
      const linkedUuids = regRows
        .map((r) => r.anggotaUuid)
        .filter((id): id is string => Boolean(id));
      if (linkedUuids.length > 0) {
        orConditions.push({ uuid: { in: linkedUuids } });
      }

      return { OR: orConditions };
    }

    if (scope.cabangId) {
      return { cabangUuid: scope.cabangId };
    }
    return { uuid: "00000000-0000-0000-0000-000000000000" };
  }

  if (scope.tingkat === "DPD") {
    if (scope.kodeProvinsi) {
      const orConditions: any[] = [
        {
          akun: {
            is: {
              registrasiList: {
                is: { kode_provinsi: scope.kodeProvinsi },
              },
            },
          },
        },
        {
          cabang: {
            is: {
              dpdRef: {
                is: { kodeProvinsi: scope.kodeProvinsi },
              },
            },
          },
        },
        {
          cabang: {
            is: {
              dpcRef: {
                is: { kode_provinsi: scope.kodeProvinsi },
              },
            },
          },
        },
      ];

      if (scope.cabangId) {
        orConditions.push({ cabangUuid: scope.cabangId });
      }

      const regRows = await prisma.registrasi.findMany({
        where: {
          kode_provinsi: scope.kodeProvinsi,
          anggotaUuid: { not: null },
        },
        select: { anggotaUuid: true },
      });
      const linkedUuids = regRows
        .map((r) => r.anggotaUuid)
        .filter((id): id is string => Boolean(id));
      if (linkedUuids.length > 0) {
        orConditions.push({ uuid: { in: linkedUuids } });
      }

      return { OR: orConditions };
    }

    if (scope.cabangId) {
      return { cabangUuid: scope.cabangId };
    }
    return { uuid: "00000000-0000-0000-0000-000000000000" };
  }

  if (scope.cabangId) {
    return { cabangUuid: scope.cabangId };
  }

  return { uuid: "00000000-0000-0000-0000-000000000000" };
};

const scopeHttpError = (statusCode: number, message: string) =>
  Object.assign(new Error(message), { statusCode });

/**
 * Membangun filter Prisma untuk tabel `Cabang` sesuai hierarki DPP > DPD > DPC:
 * - DPP (SuperAdmin): `null` (semua cabang).
 * - Admin DPD: cabang miliknya sendiri + seluruh cabang DPC di provinsinya (`kodeProvinsi`).
 * - Admin DPC: hanya cabang miliknya sendiri (`kodeKabupaten` / `cabangId`).
 */
export const buildCabangHierarchyWhere = (
  scope?: RequestScope
): Record<string, any> | null => {
  if (!scope?.isAdmin || scope.isSuperAdmin) {
    return null;
  }

  if (scope.tingkat === "DPD") {
    const orConditions: any[] = [];
    if (scope.kodeProvinsi) {
      orConditions.push(
        { dpdRef: { is: { kodeProvinsi: scope.kodeProvinsi } } },
        { dpcRef: { is: { kode_provinsi: scope.kodeProvinsi } } }
      );
    }
    if (scope.cabangId) {
      orConditions.push({ uuid: scope.cabangId });
    }
    return orConditions.length > 0
      ? { OR: orConditions }
      : { uuid: "00000000-0000-0000-0000-000000000000" };
  }

  if (scope.tingkat === "DPC") {
    const orConditions: any[] = [];
    if (scope.kodeKabupaten) {
      orConditions.push({
        dpcRef: { is: { kode_kabupaten: scope.kodeKabupaten } },
      });
    }
    if (scope.cabangId) {
      orConditions.push({ uuid: scope.cabangId });
    }
    return orConditions.length > 0
      ? { OR: orConditions }
      : { uuid: "00000000-0000-0000-0000-000000000000" };
  }

  if (scope.cabangId) {
    return { uuid: scope.cabangId };
  }

  return { uuid: "00000000-0000-0000-0000-000000000000" };
};

/**
 * Membangun filter Prisma untuk model yang berelasi ke `Cabang` (`cabangUuid` + relasi `cabang`).
 * - SuperAdmin (DPP): `null` (melihat semua: Pusat + DPD + DPC).
 * - Admin DPD: melihat item cabangnya + seluruh DPC di provinsinya.
 * - Admin DPC: hanya melihat item cabangnya sendiri.
 */
export const buildCabangRelationScopeWhere = (
  scope?: RequestScope
): Record<string, any> | null => {
  const cabangWhere = buildCabangHierarchyWhere(scope);
  if (!cabangWhere) return null;

  if (scope?.cabangId) {
    return {
      OR: [
        { cabangUuid: scope.cabangId },
        { cabang: { is: cabangWhere } },
      ],
    };
  }

  return { cabang: { is: cabangWhere } };
};

/**
 * Menentukan `cabangUuid` saat membuat item CMS baru:
 * - SuperAdmin (DPP): memakai `bodyCabangUuid` jika dikirim, atau default `scope.cabangId` / `null`.
 * - Admin DPD / DPC: selalu dikunci ke `scope.cabangId` milik akun (wajib tertaut ke Cabang).
 */
export const resolveCreateCabangUuid = (
  scope?: RequestScope,
  bodyCabangUuid?: string | null
): string | null => {
  if (scope?.isSuperAdmin) {
    return bodyCabangUuid !== undefined ? bodyCabangUuid : (scope.cabangId ?? null);
  }

  if (!scope?.cabangId) {
    throw scopeHttpError(
      403,
      "Akun admin wilayah belum ditautkan ke Cabang. Hubungi DPP."
    );
  }

  return scope.cabangId;
};

/**
 * Mengecek apakah admin berhak membaca detail item berdasarkan `cabangUuid` (hierarki DPP > DPD > DPC).
 */
export const assertCanReadCabangItem = async (
  scope: RequestScope | undefined,
  targetCabangUuid: string | null | undefined,
  label = "data"
) => {
  if (!scope?.isAdmin || scope.isSuperAdmin) return;

  if (scope.cabangId && targetCabangUuid === scope.cabangId) return;

  if (targetCabangUuid && scope.tingkat === "DPD" && scope.kodeProvinsi) {
    const match = await prisma.cabang.findFirst({
      where: {
        uuid: targetCabangUuid,
        OR: [
          { dpdRef: { is: { kodeProvinsi: scope.kodeProvinsi } } },
          { dpcRef: { is: { kode_provinsi: scope.kodeProvinsi } } },
        ],
      },
      select: { uuid: true },
    });
    if (match) return;
  }

  throw scopeHttpError(
    403,
    `Akses ditolak: Anda tidak memiliki izin melihat ${label} wilayah lain atau pusat`
  );
};

/**
 * Mengecek apakah admin berhak mengubah/mengarsipkan/menghapus item milik `targetCabangUuid`.
 * - SuperAdmin (DPP): bebas mengelola seluruh wilayah.
 * - Admin DPD / DPC: hanya boleh mengelola data milik cabangnya sendiri (`targetCabangUuid === scope.cabangId`).
 */
export const assertCanWriteCabangItem = (
  scope: RequestScope | undefined,
  targetCabangUuid: string | null | undefined,
  label = "data"
) => {
  if (scope?.isSuperAdmin) return;

  if (!scope?.cabangId || targetCabangUuid !== scope.cabangId) {
    throw scopeHttpError(
      403,
      `Akses ditolak: Anda tidak memiliki izin mengelola ${label} cabang lain atau pusat`
    );
  }
};
