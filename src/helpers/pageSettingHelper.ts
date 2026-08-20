import { prisma } from "../config/prisma";

/**
 * Get the admin fee percentage from page settings.
 * Key: "eco-admin-fee" (stored as a number string, e.g. "10" = 10%)
 * Returns a decimal ratio (e.g. 0.10 for 10%).
 * Defaults to 0.10 (10%) if not found or invalid.
 */
export const getAdminFeePercent = async (): Promise<number> => {
  try {
    const setting = await prisma.pageSetting.findFirst({
      where: { key: "eco-admin-fee" },
    });

    if (setting?.value) {
      const percent = Number(setting.value);
      if (!isNaN(percent) && percent >= 0 && percent <= 100) {
        return percent / 100; // e.g. 10 → 0.10
      }
    }
  } catch (err) {
    console.error("[pageSettingHelper] Failed to read eco-admin-fee:", err);
  }

  return 0.1; // default 10%
};

/**
 * Get admin email recipients from page settings.
 * Key: "eco-admin-email" (stored as a JSON array)
 * Supports both:
 *   - Direct email strings: ["admin@pnps.id", "john@example.com"]
 *   - Senior UUIDs: ["uuid-1", "uuid-2"] → resolved to their Akun emails
 * Returns an array of email strings.
 */
export const getAdminEmailRecipients = async (): Promise<string[]> => {
  try {
    const setting = await prisma.pageSetting.findFirst({
      where: { key: "eco-admin-email" },
    });

    if (!setting?.value) return [];

    const parsed = JSON.parse(setting.value);
    if (!Array.isArray(parsed) || parsed.length === 0) return [];

    const directEmails: string[] = [];
    const uuids: string[] = [];

    // Separate direct emails from UUIDs
    for (const item of parsed) {
      const str = String(item).trim();
      if (str.includes("@")) {
        directEmails.push(str);
      } else if (str.length > 0) {
        uuids.push(str);
      }
    }

    // Resolve Senior UUIDs → Akun emails
    let resolvedEmails: string[] = [];
    if (uuids.length > 0) {
      const seniors = await prisma.senior.findMany({
        where: { uuid: { in: uuids } },
        include: { akun: { select: { email: true } } },
      });

      resolvedEmails = seniors
        .map((s) => s.akun?.email)
        .filter((email): email is string => !!email);
    }

    return [...directEmails, ...resolvedEmails];
  } catch (err) {
    console.error("[pageSettingHelper] Failed to read eco-admin-email:", err);
    return [];
  }
};

/**
 * Get admin bank account info from page settings.
 * Key: "eco-admin-rekening" (stored as a plain text string)
 * Returns the bank account string, or a default fallback.
 */
export const getAdminBankAccount = async (): Promise<string> => {
  try {
    const setting = await prisma.pageSetting.findFirst({
      where: { key: "eco-admin-rekening" },
    });

    if (setting?.value) {
      return setting.value;
    }
  } catch (err) {
    console.error("[pageSettingHelper] Failed to read eco-admin-rekening:", err);
  }

  return "Hubungi admin untuk info rekening";
};
