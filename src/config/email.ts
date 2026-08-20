import nodemailer from "nodemailer";
import { env } from "./env";

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: Number(env.SMTP_PORT),
  secure: Number(env.SMTP_PORT) === 465,
  auth:
    env.SMTP_USER && env.SMTP_PASS
      ? { user: env.SMTP_USER, pass: env.SMTP_PASS }
      : undefined,
});

////////////////////////////////////////////////////
// HELPER: BASE EMAIL TEMPLATE
////////////////////////////////////////////////////
const createEmailTemplate = (title: string, preheader: string, content: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9fafb; color: #374151; -webkit-font-smoothing: antialiased;">
  <div style="display: none; max-height: 0px; overflow: hidden;">${preheader}</div>
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background-color: #ffffff; border-radius: 12px; border: 1px solid #e5e7eb; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);">
      <div style="background-color: #015da8; padding: 32px 24px; text-align: center; border-bottom: 4px solid #01437a;">
        <h1 style="color: #ffffff; font-size: 22px; font-weight: 700; margin: 0; letter-spacing: -0.5px;">PNPS GMKI</h1>
      </div>
      <div style="padding: 40px 32px; font-size: 15px; line-height: 1.6; color: #374151;">
        <h2 style="color: #111827; font-size: 20px; font-weight: 700; margin-top: 0; margin-bottom: 24px;">${title}</h2>
        ${content}
      </div>
    </div>
    <div style="padding: 32px 24px; text-align: center; font-size: 13px; color: #6b7280; line-height: 1.5;">
      <p style="margin: 0;">Email ini dikirim secara otomatis oleh sistem, mohon tidak dibalas.</p>
      <p style="margin: 8px 0 0 0;">&copy; ${new Date().getFullYear()} PNPS GMKI & GRIT Institut. Hak Cipta Dilindungi.</p>
    </div>
  </div>
</body>
</html>
`;

////////////////////////////////////////////////////
// HELPER: SEND MAIL
////////////////////////////////////////////////////
const sendMail = async (to: string, subject: string, html: string) => {
  if (env.SMTP_TYPE === "log") {
    console.log("====================================================");
    console.log(`📧 [EMAIL LOG DRIVER] ${subject}`);
    console.log(`To: ${to}`);
    console.log("====================================================");
    return { messageId: "logged" };
  }

  const info = await transporter.sendMail({
    from: `"PNPS GMKI" <${env.SMTP_FROM}>`,
    to,
    subject,
    html,
  });

  if (env.NODE_ENV === "development") {
    console.log("📧 Preview URL:", nodemailer.getTestMessageUrl(info));
  }

  return info;
};

////////////////////////////////////////////////////
// AUTH EMAILS
////////////////////////////////////////////////////
export const sendVerificationEmail = async (to: string, token: string) => {
  const verifyUrl = `${env.FRONTEND_URL}/verify-email?token=${token}`;

  const content = `
    <p style="margin-bottom: 20px;">Halo,</p>
    <p style="margin-bottom: 24px;">Terima kasih telah mendaftar di <strong>PNPS GMKI</strong>. Untuk menyelesaikan pendaftaran dan mengamankan akun Anda, silakan verifikasi alamat email Anda dengan mengklik tombol di bawah ini.</p>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${verifyUrl}" style="background-color: #015da8; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; font-size: 15px; box-shadow: 0 2px 4px rgba(1, 93, 168, 0.25);">Verifikasi Email Anda</a>
    </div>

    <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
      <p style="margin: 0; font-size: 13px; color: #6b7280;">Atau salin dan tempel tautan ini ke browser Anda:</p>
      <a href="${verifyUrl}" style="color: #015da8; font-size: 13px; word-break: break-all; margin-top: 8px; display: inline-block;">${verifyUrl}</a>
    </div>
    
    <p style="margin-top: 0; margin-bottom: 0; font-size: 13px; color: #9ca3af;">Tautan ini berlaku selama 24 jam. Jika Anda tidak mendaftar di PNPS GMKI, Anda dapat mengabaikan email ini dengan aman.</p>
  `;

  return sendMail(
    to,
    "Verifikasi Email - PNPS GMKI",
    createEmailTemplate("Verifikasi Alamat Email", "Selesaikan pendaftaran Anda di PNPS GMKI dengan memverifikasi email Anda.", content)
  );
};

export const sendResetPasswordEmail = async (to: string, token: string) => {
  const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${token}`;

  const content = `
    <p style="margin-bottom: 20px;">Halo,</p>
    <p style="margin-bottom: 24px;">Kami menerima permintaan untuk mengatur ulang kata sandi (reset password) untuk akun PNPS GMKI Anda. Jika ini memang Anda, silakan klik tombol di bawah ini untuk membuat kata sandi baru.</p>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${resetUrl}" style="background-color: #015da8; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; font-size: 15px; box-shadow: 0 2px 4px rgba(1, 93, 168, 0.25);">Atur Ulang Kata Sandi</a>
    </div>

    <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
      <p style="margin: 0; font-size: 13px; color: #6b7280;">Atau salin dan tempel tautan ini ke browser Anda:</p>
      <a href="${resetUrl}" style="color: #015da8; font-size: 13px; word-break: break-all; margin-top: 8px; display: inline-block;">${resetUrl}</a>
    </div>
    
    <p style="margin-top: 0; margin-bottom: 0; font-size: 13px; color: #9ca3af;">Tautan ini hanya berlaku selama 1 jam demi keamanan Anda. Jika Anda tidak meminta pengaturan ulang kata sandi, silakan abaikan email ini.</p>
  `;

  return sendMail(
    to,
    "Reset Password - PNPS GMKI",
    createEmailTemplate("Atur Ulang Kata Sandi", "Permintaan pengaturan ulang kata sandi untuk akun PNPS GMKI Anda.", content)
  );
};

////////////////////////////////////////////////////
// PENDAFTARAN KELAS EMAILS
////////////////////////////////////////////////////
export const sendPendaftaranKelasEmail = async (
  to: string,
  namaPeserta: string,
  namaKelas: string,
  status: "DITERIMA" | "PENDING"
) => {
  const isDiterima = status === "DITERIMA";
  const badgeColor = isDiterima ? "#10b981" : "#f59e0b";
  const badgeBg = isDiterima ? "#d1fae5" : "#fef3c7";
  const badgeText = isDiterima ? "✅ DITERIMA" : "⏳ PENDING";
  
  const statusMessage = isDiterima
    ? "Selamat! Pendaftaran Anda telah disetujui. Kami sangat menantikan partisipasi Anda di kelas."
    : "Pendaftaran Anda saat ini sedang diproses dan menunggu konfirmasi dari pihak admin kami.";

  const content = `
    <p style="margin-bottom: 20px;">Halo <strong>${namaPeserta}</strong>,</p>
    <p style="margin-bottom: 24px;">Terima kasih atas antusiasme Anda mendaftar program pembelajaran di GRIT Institut. Berikut adalah detail pendaftaran kelas Anda:</p>
    
    <div style="background-color: #f8fafc; border-left: 4px solid #015da8; padding: 20px; border-radius: 6px; margin-bottom: 24px;">
      <p style="margin: 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; font-weight: 600; margin-bottom: 4px;">Nama Kelas</p>
      <p style="margin: 0; font-size: 16px; font-weight: 700; color: #0f172a;">${namaKelas}</p>
    </div>

    <div style="margin-bottom: 32px; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px; text-align: center;">
      <p style="margin: 0 0 16px 0; font-size: 14px; color: #475569; font-weight: 500;">Status Pendaftaran Anda:</p>
      <span style="background-color: ${badgeBg}; color: ${badgeColor}; padding: 8px 16px; border-radius: 999px; font-size: 14px; font-weight: 700; letter-spacing: 0.5px; display: inline-block;">
        ${badgeText}
      </span>
      <p style="margin: 16px 0 0 0; font-size: 14px; color: #475569; line-height: 1.5;">${statusMessage}</p>
    </div>
    
    <p style="margin: 0; font-size: 14px; color: #64748b;">Jika Anda merasa tidak melakukan pendaftaran ini, abaikan email ini atau hubungi admin GRIT Institut.</p>
  `;

  return sendMail(
    to,
    "Konfirmasi Pendaftaran Kelas - GRIT Institut",
    createEmailTemplate("Pendaftaran Kelas", `Status pendaftaran Anda di kelas ${namaKelas} adalah ${status}`, content)
  );
};

export const sendUpdateStatusPendaftaranEmail = async (
  to: string,
  namaPeserta: string,
  namaKelas: string,
  statusBaru: string
) => {
  const statusColorMap: Record<string, { color: string, bg: string, emoji: string }> = {
    DITERIMA: { color: "#10b981", bg: "#d1fae5", emoji: "✅" },
    DITOLAK: { color: "#ef4444", bg: "#fee2e2", emoji: "❌" },
    PENDING: { color: "#f59e0b", bg: "#fef3c7", emoji: "⏳" },
    HADIR: { color: "#3b82f6", bg: "#dbeafe", emoji: "🎓" },
  };
  
  const style = statusColorMap[statusBaru] ?? { color: "#64748b", bg: "#f1f5f9", emoji: "ℹ️" };

  const content = `
    <p style="margin-bottom: 20px;">Halo <strong>${namaPeserta}</strong>,</p>
    <p style="margin-bottom: 24px;">Status pendaftaran Anda untuk kelas GRIT Institut telah diperbarui oleh Admin.</p>
    
    <div style="background-color: #f8fafc; border-left: 4px solid #015da8; padding: 20px; border-radius: 6px; margin-bottom: 24px;">
      <p style="margin: 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; font-weight: 600; margin-bottom: 4px;">Nama Kelas</p>
      <p style="margin: 0; font-size: 16px; font-weight: 700; color: #0f172a;">${namaKelas}</p>
    </div>

    <div style="margin-bottom: 32px; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px; text-align: center;">
      <p style="margin: 0 0 16px 0; font-size: 14px; color: #475569; font-weight: 500;">Status Terbaru Anda:</p>
      <span style="background-color: ${style.bg}; color: ${style.color}; padding: 8px 16px; border-radius: 999px; font-size: 14px; font-weight: 700; letter-spacing: 0.5px; display: inline-block;">
        ${style.emoji} ${statusBaru}
      </span>
    </div>
    
    <p style="margin: 0; font-size: 14px; color: #64748b;">Jika ada pertanyaan lebih lanjut, silakan hubungi admin GRIT Institut.</p>
  `;

  return sendMail(
    to,
    "Update Status Pendaftaran Kelas - GRIT Institut",
    createEmailTemplate("Update Status Pendaftaran", `Status pendaftaran kelas Anda telah diubah menjadi ${statusBaru}.`, content)
  );
};

export const sendPembatalanPendaftaranEmail = async (
  to: string,
  namaPeserta: string,
  namaKelas: string
) => {
  const content = `
    <p style="margin-bottom: 20px;">Halo <strong>${namaPeserta}</strong>,</p>
    <p style="margin-bottom: 24px;">Kami ingin memberitahukan bahwa pendaftaran Anda di kelas GRIT Institut <strong>telah dibatalkan oleh Admin</strong>.</p>
    
    <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; border-radius: 6px; margin-bottom: 24px;">
      <p style="margin: 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #991b1b; font-weight: 600; margin-bottom: 4px;">Kelas yang Dibatalkan</p>
      <p style="margin: 0; font-size: 16px; font-weight: 700; color: #7f1d1d;">${namaKelas}</p>
    </div>

    <p style="margin: 0; font-size: 14px; color: #475569; line-height: 1.6;">
      Jika pembatalan ini terjadi tanpa sepengetahuan Anda atau jika Anda merasa ini adalah sebuah kesalahan, silakan segera menghubungi admin GRIT Institut.
    </p>
  `;

  return sendMail(
    to,
    "Pembatalan Pendaftaran Kelas - GRIT Institut",
    createEmailTemplate("Pendaftaran Dibatalkan", `Pendaftaran kelas ${namaKelas} Anda telah dibatalkan.`, content)
  );
};

////////////////////////////////////////////////////
// E-COMMERCE EMAILS
////////////////////////////////////////////////////

export const sendCheckoutInvoiceEmail = async (
  to: string,
  namaPembeli: string,
  nomorPesanan: string,
  subtotal: string,
  biayaLayanan: string,
  pajak: string,
  total: string
) => {
  const content = `
    <p style="margin-bottom: 20px;">Halo <strong>${namaPembeli}</strong>,</p>
    <p style="margin-bottom: 24px;">Checkout pesanan Anda berhasil dibuat. Saat ini kami sedang menunggu penjual menentukan biaya ongkos kirim. Berikut adalah rincian sementara pesanan Anda:</p>
    
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
      <p style="margin: 0 0 16px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; font-weight: 600;">Detail Pesanan</p>
      
      <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 14px; margin-bottom: 16px;">
        <tr>
          <td style="padding: 8px 0; color: #475569;">Nomor Pesanan</td>
          <td style="padding: 8px 0; font-weight: 600; text-align: right; color: #0f172a;">${nomorPesanan}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #475569; border-top: 1px dashed #cbd5e1;">Subtotal</td>
          <td style="padding: 8px 0; font-weight: 500; text-align: right; color: #0f172a; border-top: 1px dashed #cbd5e1;">Rp ${subtotal}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #475569;">Pajak</td>
          <td style="padding: 8px 0; font-weight: 500; text-align: right; color: #0f172a;">Rp ${pajak}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #475569;">Biaya Layanan</td>
          <td style="padding: 8px 0; font-weight: 500; text-align: right; color: #0f172a;">Rp ${biayaLayanan}</td>
        </tr>
      </table>
      
      <div style="background-color: #015da8; border-radius: 6px; padding: 16px; margin-top: 16px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="color: #e0f2fe; font-weight: 500; font-size: 15px;">Total Sementara*</td>
            <td style="color: #ffffff; font-weight: 700; text-align: right; font-size: 18px;">Rp ${total}</td>
          </tr>
        </table>
      </div>
      <p style="margin: 12px 0 0 0; font-size: 12px; color: #94a3b8; text-align: right;">* Belum termasuk ongkos kirim</p>
    </div>
    
    <p style="margin: 0; font-size: 14px; color: #475569; line-height: 1.6;">Kami akan mengirimkan email notifikasi selanjutnya setelah penjual menentukan biaya ongkos kirim.</p>
  `;

  return sendMail(
    to,
    "Invoice Sementara - PNPS E-Commerce",
    createEmailTemplate("Invoice Checkout", `Pesanan ${nomorPesanan} Anda telah berhasil dibuat.`, content)
  );
};

export const sendSellerNewOrderEmail = async (
  to: string,
  namaPenjual: string,
  nomorPesanan: string
) => {
  const content = `
    <p style="margin-bottom: 20px;">Halo <strong>${namaPenjual}</strong>,</p>
    <p style="margin-bottom: 24px;">Anda baru saja menerima pesanan baru di PNPS E-Commerce!</p>
    
    <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; border-radius: 6px; margin-bottom: 24px;">
      <p style="margin: 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #047857; font-weight: 600; margin-bottom: 4px;">Nomor Pesanan</p>
      <p style="margin: 0; font-size: 18px; font-weight: 700; color: #064e3b; font-family: monospace;">${nomorPesanan}</p>
    </div>

    <p style="margin: 0; font-size: 14px; color: #475569; line-height: 1.6; padding: 16px; background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 6px;">
      <strong>⚠️ Tindakan Diperlukan:</strong> Mohon segera login ke dashboard Penjual Anda dan tentukan biaya ongkos kirim untuk pesanan ini maksimal dalam batas waktu 2x24 jam agar pembeli dapat melakukan pelunasan.
    </p>
  `;

  return sendMail(
    to,
    "Pesanan Baru - PNPS E-Commerce",
    createEmailTemplate("Pesanan Baru Masuk 🛒", `Pesanan baru dengan nomor ${nomorPesanan} masuk ke toko Anda.`, content)
  );
};

export const sendFinalInvoiceEmail = async (
  to: string,
  namaPembeli: string,
  nomorPesanan: string,
  ongkir: string,
  total: string,
  nomorRekening?: string
) => {
  const rekeningSection = nomorRekening ? `
    <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
      <p style="margin: 0 0 8px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #047857; font-weight: 600;">Transfer Pembayaran ke:</p>
      <p style="margin: 0; font-size: 16px; font-weight: 700; color: #064e3b; font-family: monospace; line-height: 1.6;">${nomorRekening}</p>
    </div>
  ` : "";

  const content = `
    <p style="margin-bottom: 20px;">Halo <strong>${namaPembeli}</strong>,</p>
    <p style="margin-bottom: 24px;">Penjual telah menentukan biaya ongkos kirim untuk pesanan Anda. Pesanan Anda kini siap untuk dilunasi.</p>
    
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 14px; margin-bottom: 16px;">
        <tr>
          <td style="padding: 8px 0; color: #475569;">Nomor Pesanan</td>
          <td style="padding: 8px 0; font-weight: 600; text-align: right; color: #0f172a; font-family: monospace;">${nomorPesanan}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #475569; border-top: 1px dashed #cbd5e1;">Biaya Ongkir</td>
          <td style="padding: 8px 0; font-weight: 500; text-align: right; color: #0f172a; border-top: 1px dashed #cbd5e1;">Rp ${ongkir}</td>
        </tr>
      </table>
      
      <div style="background-color: #015da8; border-radius: 6px; padding: 16px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="color: #e0f2fe; font-weight: 500; font-size: 15px;">Total Pelunasan</td>
            <td style="color: #ffffff; font-weight: 700; text-align: right; font-size: 20px;">Rp ${total}</td>
          </tr>
        </table>
      </div>
    </div>

    ${rekeningSection}
    
    <div style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; padding: 16px;">
      <p style="margin: 0; font-size: 14px; color: #92400e; line-height: 1.5;">
        <strong>Batas Waktu:</strong> Silakan lakukan pembayaran maksimal 1x24 jam sejak email ini diterima. Jika tidak dilunasi, pesanan akan dibatalkan otomatis.
      </p>
    </div>
  `;

  return sendMail(
    to,
    "Invoice Final Pembayaran - PNPS E-Commerce",
    createEmailTemplate("Invoice Final Pesanan", `Biaya ongkos kirim untuk pesanan ${nomorPesanan} telah ditentukan.`, content)
  );
};

export const sendPaymentSuccessEmail = async (
  to: string,
  namaPembeli: string,
  nomorPesanan: string,
  nominal: string
) => {
  const content = `
    <p style="margin-bottom: 20px;">Halo <strong>${namaPembeli}</strong>,</p>
    <p style="margin-bottom: 24px;">Hore! Pembayaran pesanan Anda telah berhasil kami verifikasi dan terima.</p>
    
    <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 24px; margin-bottom: 24px; text-align: center;">
      <div style="width: 48px; height: 48px; background-color: #d1fae5; border-radius: 50%; display: inline-block; line-height: 48px; font-size: 24px; margin-bottom: 12px;">✅</div>
      <p style="margin: 0 0 8px 0; font-size: 14px; color: #166534; font-weight: 600;">Pembayaran Berhasil</p>
      <p style="margin: 0 0 16px 0; font-size: 24px; font-weight: 800; color: #14532d;">Rp ${nominal}</p>
      
      <div style="background-color: #ffffff; padding: 12px; border-radius: 6px; display: inline-block; margin: 0 auto;">
        <p style="margin: 0; font-size: 12px; color: #64748b; text-transform: uppercase;">Nomor Pesanan</p>
        <p style="margin: 4px 0 0 0; font-size: 15px; font-weight: 600; font-family: monospace; color: #0f172a;">${nomorPesanan}</p>
      </div>
    </div>
    
    <p style="margin: 0; font-size: 14px; color: #475569; line-height: 1.6;">Penjual saat ini sedang mempersiapkan pesanan Anda. Kami akan memberitahukan Anda kembali saat pesanan mulai dikirimkan.</p>
  `;

  return sendMail(
    to,
    "Pembayaran Berhasil - PNPS E-Commerce",
    createEmailTemplate("Pembayaran Berhasil 🎉", `Pembayaran pesanan ${nomorPesanan} telah diterima.`, content)
  );
};

export const sendSellerPaymentNotificationEmail = async (
  to: string,
  namaPenjual: string,
  nomorPesanan: string
) => {
  const content = `
    <p style="margin-bottom: 20px;">Halo <strong>${namaPenjual}</strong>,</p>
    <p style="margin-bottom: 24px;">Pembeli telah berhasil melunasi pembayaran untuk pesanan berikut:</p>
    
    <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; border-radius: 6px; margin-bottom: 24px;">
      <p style="margin: 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #1d4ed8; font-weight: 600; margin-bottom: 4px;">Nomor Pesanan</p>
      <p style="margin: 0; font-size: 18px; font-weight: 700; color: #1e3a8a; font-family: monospace;">${nomorPesanan}</p>
    </div>

    <div style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; padding: 16px;">
      <p style="margin: 0; font-size: 14px; color: #92400e; line-height: 1.5;">
        <strong>Selanjutnya:</strong> Mohon segera melakukan pengemasan barang dan menginput nomor resi pengiriman di dashboard maksimal dalam waktu 1x24 jam untuk menghindari pembatalan otomatis.
      </p>
    </div>
  `;

  return sendMail(
    to,
    "Pembayaran Pesanan Diterima - PNPS E-Commerce",
    createEmailTemplate("Pembayaran Diterima 💰", `Pembayaran untuk pesanan ${nomorPesanan} telah diterima.`, content)
  );
};

export const sendShippingEmail = async (
  to: string,
  namaPembeli: string,
  nomorPesanan: string,
  nomorResi: string
) => {
  const content = `
    <p style="margin-bottom: 20px;">Halo <strong>${namaPembeli}</strong>,</p>
    <p style="margin-bottom: 24px;">Kabar baik! Pesanan Anda telah dikirimkan oleh penjual dan saat ini sedang dalam perjalanan menuju lokasi Anda.</p>
    
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 14px;">
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;">Nomor Pesanan</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; font-weight: 600; text-align: right; color: #0f172a; font-family: monospace;">${nomorPesanan}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; color: #64748b;">Nomor Resi</td>
          <td style="padding: 12px 0; font-weight: 700; text-align: right; color: #015da8; font-size: 16px;">${nomorResi}</td>
        </tr>
      </table>
    </div>
    
    <p style="margin: 0; font-size: 14px; color: #475569; line-height: 1.6;">Silakan gunakan Nomor Resi di atas untuk melacak posisi pengiriman paket Anda melalui situs penyedia jasa pengiriman.</p>
  `;

  return sendMail(
    to,
    "Pesanan Dikirim - PNPS E-Commerce",
    createEmailTemplate("Pesanan Anda Dikirim 🚚", `Pesanan ${nomorPesanan} sedang dalam perjalanan.`, content)
  );
};

export const sendOrderCompletedEmail = async (
  to: string,
  namaPembeli: string,
  nomorPesanan: string
) => {
  const content = `
    <p style="margin-bottom: 20px;">Halo <strong>${namaPembeli}</strong>,</p>
    <p style="margin-bottom: 24px;">Selamat! Pesanan Anda telah kami tandai sebagai <strong>Selesai</strong>.</p>
    
    <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; border-radius: 6px; margin-bottom: 24px;">
      <p style="margin: 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #047857; font-weight: 600; margin-bottom: 4px;">Nomor Pesanan</p>
      <p style="margin: 0; font-size: 18px; font-weight: 700; color: #064e3b; font-family: monospace;">${nomorPesanan}</p>
    </div>

    <p style="margin: 0; font-size: 14px; color: #475569; line-height: 1.6;">Terima kasih banyak telah berbelanja dan mendukung PNPS E-Commerce. Kami berharap Anda puas dengan pesanan Anda dan menantikan kunjungan Anda berikutnya!</p>
  `;

  return sendMail(
    to,
    "Pesanan Selesai - PNPS E-Commerce",
    createEmailTemplate("Pesanan Selesai ✅", `Pesanan ${nomorPesanan} Anda telah sukses diselesaikan.`, content)
  );
};

export const sendOrderCanceledEmail = async (
  to: string,
  namaPembeli: string,
  nomorPesanan: string,
  alasan: string
) => {
  const content = `
    <p style="margin-bottom: 20px;">Halo <strong>${namaPembeli}</strong>,</p>
    <p style="margin-bottom: 24px;">Mohon maaf, kami ingin menginformasikan bahwa pesanan Anda terpaksa <strong>Dibatalkan</strong>.</p>
    
    <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 14px;">
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px dashed #fca5a5; color: #991b1b; width: 120px;">Nomor Pesanan</td>
          <td style="padding: 12px 0; border-bottom: 1px dashed #fca5a5; font-weight: 600; color: #7f1d1d; font-family: monospace;">${nomorPesanan}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; color: #991b1b; vertical-align: top;">Alasan</td>
          <td style="padding: 12px 0; font-weight: 500; color: #7f1d1d; line-height: 1.5;">${alasan}</td>
        </tr>
      </table>
    </div>
    
    <p style="margin: 0; font-size: 14px; color: #475569; line-height: 1.6;">Jika Anda sudah melakukan pembayaran, silakan hubungi tim Support PNPS untuk prosedur pengembalian dana (refund).</p>
  `;

  return sendMail(
    to,
    "Pesanan Dibatalkan - PNPS E-Commerce",
    createEmailTemplate("Pesanan Dibatalkan ❌", `Pesanan ${nomorPesanan} Anda dibatalkan.`, content)
  );
};

////////////////////////////////////////////////////
// EMAIL TRACKING STATUS PENGIRIMAN
////////////////////////////////////////////////////
export const sendTrackingStatusEmail = async (
  to: string,
  namaPembeli: string,
  nomorPesanan: string,
  statusPesanan: string,
  nomorResi?: string,
  keterangan?: string
) => {
  const statusConfig: Record<string, { color: string; bg: string; title: string; emoji: string; description: string }> = {
    WAITING_ONGKIR: { color: "#f59e0b", bg: "#fef3c7", title: "Menunggu Ongkir", emoji: "📦", description: "Penjual sedang menentukan biaya ongkos kirim pesanan Anda." },
    WAITING_CONFIRMATION: { color: "#3b82f6", bg: "#dbeafe", title: "Menunggu Konfirmasi", emoji: "📝", description: "Pembayaran Anda sedang diverifikasi oleh admin." },
    DELIVERING: { color: "#0ea5e9", bg: "#e0f2fe", title: "Sedang Dikirim", emoji: "🚚", description: "Pesanan Anda sedang dalam proses pengiriman oleh kurir." },
    COMPLETED: { color: "#10b981", bg: "#d1fae5", title: "Pesanan Selesai", emoji: "✅", description: "Pesanan Anda telah selesai dan diterima dengan baik." },
    CANCELLED: { color: "#ef4444", bg: "#fee2e2", title: "Pesanan Dibatalkan", emoji: "❌", description: "Pesanan Anda telah dibatalkan." },
  };

  const config = statusConfig[statusPesanan] ?? statusConfig.WAITING_CONFIRMATION;

  const content = `
    <p style="margin-bottom: 20px;">Halo <strong>${namaPembeli}</strong>,</p>
    <p style="margin-bottom: 24px;">Status pesanan Anda telah diperbarui dalam sistem kami.</p>
    
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid ${config.color}; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
      <p style="margin: 0 0 6px 0; font-size: 13px; color: #64748b;">Nomor Pesanan</p>
      <p style="margin: 0 0 20px 0; font-size: 16px; font-weight: 700; color: #0f172a; font-family: monospace;">${nomorPesanan}</p>
      
      <p style="margin: 0 0 8px 0; font-size: 13px; color: #64748b;">Status Saat Ini</p>
      <div style="margin-bottom: 20px;">
        <span style="background-color: ${config.bg}; color: ${config.color}; padding: 8px 16px; border-radius: 999px; font-size: 14px; font-weight: 700; display: inline-block;">
          ${config.emoji} ${config.title}
        </span>
      </div>
      
      ${nomorResi ? `
        <div style="margin-top: 16px; padding-top: 16px; border-top: 1px dashed #cbd5e1;">
          <p style="margin: 0 0 4px 0; font-size: 13px; color: #64748b;">Nomor Resi</p>
          <p style="margin: 0; font-size: 16px; font-weight: 700; color: #0f172a;">${nomorResi}</p>
        </div>
      ` : ""}
      
      ${keterangan ? `
        <div style="margin-top: 16px; padding-top: 16px; border-top: 1px dashed #cbd5e1;">
          <p style="margin: 0 0 4px 0; font-size: 13px; color: #64748b;">Keterangan Tambahan</p>
          <p style="margin: 0; font-size: 14px; font-weight: 500; color: #334155; line-height: 1.5;">${keterangan}</p>
        </div>
      ` : ""}
    </div>
    
    <p style="margin: 0; font-size: 14px; color: #475569; line-height: 1.6;">${config.description}</p>
  `;

  return sendMail(
    to,
    `Update Status Pesanan - ${config.title}`,
    createEmailTemplate("Status Pesanan Diperbarui", `Status pesanan ${nomorPesanan} Anda menjadi ${config.title}.`, content)
  );
};

////////////////////////////////////////////////////
// ADMIN E-COMMERCE NOTIFICATION EMAIL
////////////////////////////////////////////////////
type AdminOrderEvent = "NEW_ORDER" | "PAYMENT_RECEIVED" | "ORDER_COMPLETED" | "ORDER_CANCELED";

const adminEventConfig: Record<AdminOrderEvent, { color: string; bg: string; title: string; emoji: string; description: string }> = {
  NEW_ORDER: { color: "#3b82f6", bg: "#eff6ff", title: "Pesanan Baru Masuk", emoji: "🛒", description: "Pesanan baru telah berhasil dibuat oleh pembeli." },
  PAYMENT_RECEIVED: { color: "#10b981", bg: "#f0fdf4", title: "Pembayaran Diterima", emoji: "💰", description: "Pembayaran untuk pesanan ini telah diterima dan sukses diverifikasi." },
  ORDER_COMPLETED: { color: "#059669", bg: "#d1fae5", title: "Transaksi Selesai", emoji: "✅", description: "Transaksi telah selesai. Silakan proses pengiriman dana ke penjual (sudah dikurangi biaya layanan PNPS)." },
  ORDER_CANCELED: { color: "#ef4444", bg: "#fef2f2", title: "Pesanan Dibatalkan", emoji: "❌", description: "Pesanan telah dibatalkan." },
};

export const sendAdminOrderNotificationEmail = async (
  adminEmails: string[],
  nomorPesanan: string,
  event: AdminOrderEvent,
  extraInfo?: string
) => {
  if (adminEmails.length === 0) return;

  const config = adminEventConfig[event];

  const content = `
    <p style="margin-bottom: 20px;">Halo <strong>Admin PNPS E-Commerce</strong>,</p>
    <p style="margin-bottom: 24px;">Sistem mencatat adanya pembaruan penting mengenai transaksi e-commerce.</p>
    
    <div style="background-color: ${config.bg}; border-left: 4px solid ${config.color}; padding: 20px; border-radius: 6px; margin-bottom: 24px;">
      <p style="margin: 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: ${config.color}; font-weight: 700; margin-bottom: 12px;">${config.emoji} ${config.title}</p>
      
      <div style="background-color: rgba(255,255,255,0.7); padding: 12px; border-radius: 4px;">
        <p style="margin: 0 0 4px 0; font-size: 12px; color: #475569;">Nomor Pesanan</p>
        <p style="margin: 0; font-size: 16px; font-weight: 700; color: #0f172a; font-family: monospace;">${nomorPesanan}</p>
      </div>
      
      ${extraInfo ? `
        <div style="margin-top: 12px; background-color: rgba(255,255,255,0.7); padding: 12px; border-radius: 4px;">
          <p style="margin: 0 0 4px 0; font-size: 12px; color: #475569;">Informasi Tambahan</p>
          <p style="margin: 0; font-size: 14px; font-weight: 500; color: #0f172a;">${extraInfo}</p>
        </div>
      ` : ""}
    </div>

    <p style="margin: 0; font-size: 14px; color: #475569; line-height: 1.6;">${config.description}</p>
  `;

  const subject = `[Admin] ${config.title} - Pesanan ${nomorPesanan.slice(0, 8)}`;

  await Promise.allSettled(
    adminEmails.map((email) => sendMail(
      email, 
      subject, 
      createEmailTemplate(`Notifikasi Admin E-Commerce`, `${config.title} untuk pesanan ${nomorPesanan}`, content)
    ))
  );
};

export const sendAutoCancelNoResiEmail = async (
  to: string,
  nama: string,
  nomorPesanan: string
) => {
  const content = `
    <p style="margin-bottom: 20px;">Halo <strong>${nama}</strong>,</p>
    <p style="margin-bottom: 24px;">Dengan sangat menyesal, kami menginformasikan bahwa pesanan Anda terpaksa <strong>Dibatalkan Otomatis</strong> oleh sistem kami.</p>
    
    <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
      <p style="margin: 0 0 6px 0; font-size: 13px; color: #991b1b;">Nomor Pesanan</p>
      <p style="margin: 0 0 20px 0; font-size: 16px; font-weight: 700; color: #7f1d1d; font-family: monospace;">${nomorPesanan}</p>
      
      <div style="padding-top: 16px; border-top: 1px dashed #fca5a5;">
        <p style="margin: 0 0 6px 0; font-size: 13px; color: #991b1b; font-weight: 600;">Alasan Pembatalan</p>
        <p style="margin: 0; font-size: 14px; color: #7f1d1d; line-height: 1.5;">Penjual tidak merespon / tidak menginput nomor resi pengiriman dalam batas waktu 1x24 jam setelah pembayaran diterima.</p>
      </div>
    </div>
    
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px;">
      <p style="margin: 0; font-size: 14px; color: #334155; line-height: 1.5;">
        <strong>Informasi Refund:</strong> Karena Anda telah melakukan pembayaran, dana Anda akan diproses untuk pengembalian (refund) secara utuh sesuai dengan kebijakan dan prosedur operasional PNPS E-Commerce. Silakan hubungi admin jika Anda membutuhkan bantuan lebih lanjut.
      </p>
    </div>
  `;

  return sendMail(
    to,
    "Pesanan Dibatalkan Otomatis - PNPS E-Commerce",
    createEmailTemplate("Pembatalan Otomatis ⚠️", `Pesanan ${nomorPesanan} dibatalkan karena batas waktu resi habis.`, content)
  );
};
