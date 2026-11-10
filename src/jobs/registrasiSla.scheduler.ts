import { notifikasiDpdBelumVerifikasi } from "../services/registrasi.service";

const SATU_JAM = 60 * 60 * 1000;

const jalankan = async () => {
  try {
    const { count } = await notifikasiDpdBelumVerifikasi();
    if (count > 0) console.log(`[SLA Scheduler] ${count} notifikasi eskalasi dikirim ke DPD`);
  } catch (err) {
    console.error("[SLA Scheduler] Gagal menjalankan pengecekan:", err);
  }
};

// Cek tiap jam; pendaftar yang sudah pernah dinotifikasi dilewati (tercatat di registrasi_log)
export const startRegistrasiSlaScheduler = () => {
  setTimeout(jalankan, 30 * 1000);
  setInterval(jalankan, SATU_JAM);
};
