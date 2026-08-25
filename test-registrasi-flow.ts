import { prisma } from "./src/config/prisma";
import { createRegistrasi, verifikasiRegistrasi, prosesPembayaran, aktivasiKta, deleteRegistrasi } from "./src/services/registrasi.service";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const runTest = async () => {
  const TEST_USER_EMAIL = "adiyahardi335@gmail.com";
  console.log("=========================================");
  console.log("🚀 MEMULAI TEST END-TO-END REGISTRASI PIKI");
  console.log("=========================================");

  try {
    // 0. Bersihkan data test lama
    const existing = await prisma.registrasi.findMany({ 
      where: { 
        email: { in: [TEST_USER_EMAIL, "adiyahardi335+acc@gmail.com"] } 
      } 
    });
    for (const ex of existing) {
      console.log(`[0] Menghapus data test lama...`);
      if (ex.akunUuid) {
        await prisma.akunRole.deleteMany({ where: { akunUuid: ex.akunUuid } });
        await prisma.akun.delete({ where: { uuid: ex.akunUuid } });
      }
      if (ex.seniorUuid) {
        await prisma.akun.updateMany({ where: { seniorUuid: ex.seniorUuid }, data: { seniorUuid: null } });
        await prisma.senior.delete({ where: { uuid: ex.seniorUuid } });
      }
      await deleteRegistrasi(ex.id);
    }
    console.log(`[0] ✅ Data lama terhapus.\n`);

    // ==========================================
    // SKENARIO 1: PENDAFTARAN DITOLAK
    // ==========================================
    console.log(`\n=========================================`);
    console.log(`❌ SKENARIO 1: PENDAFTARAN DITOLAK`);
    console.log(`=========================================`);
    console.log(`\n[S1-1] 📝 TAHAP 1: User submit pendaftaran (DITOLAK)...`);
    const regRejected = await createRegistrasi({
      nik: "1111111111111111",
      namaLengkap: "Aditya (Test Ditolak)",
      tanggalLahir: "1995-08-17",
      noWa: "08111111111",
      email: TEST_USER_EMAIL,
      alamatDomisili: "Jl. Test Flow No. 123",
      fileKtpUrl: "/uploads/ktp/test-ktp.jpg",
      buktiBayarUrl: "/uploads/transfer/test-transfer.jpg",
      dpp: "Sumatera Utara",
      dpc: "Medan",
      kode_provinsi: "12",
      kode_kabupaten: "71",
      kotaDomisili: "Medan",
      tingkatPendidikan: "S1",
      pekerjaan: "Software Engineer",
      minatBidang: "Teknologi",
      motivasiBergabung: "Ingin berkontribusi",
    });
    console.log(`[S1-1] ✅ Pendaftaran sukses. ID: ${regRejected.id}`);
    console.log(`[S1-1] ⏳ Menunggu 10 detik sebelum di-reject...`);
    await sleep(10000);

    console.log(`\n[S1-2] 🕵️‍♂️ TAHAP 2: Admin me-REJECT...`);
    await verifikasiRegistrasi({
      id: regRejected.id,
      status: "REJECTED",
      actorNama: "Admin Super",
      catatanVerifikasi: "Mohon maaf, foto KTP buram dan bukti transfer tidak valid.",
    });
    console.log(`[S1-2] ✅ Registrasi berhasil DITOLAK (Email penolakan terkirim).`);
    console.log(`[S1-2] ⏳ Menunggu 10 detik sebelum lanjut ke Skenario 2...`);
    await sleep(10000);


    // ==========================================
    // SKENARIO 2: PENDAFTARAN DITERIMA & KTA AKTIF
    // ==========================================
    console.log(`\n=========================================`);
    console.log(`✅ SKENARIO 2: PENDAFTARAN DITERIMA`);
    console.log(`=========================================`);
    console.log(`\n[S2-1] 📝 TAHAP 1: User submit pendaftaran (DITERIMA)...`);
    const regApproved = await createRegistrasi({
      nik: "2222222222222222",
      namaLengkap: "Aditya (Test Diterima)",
      tanggalLahir: "1995-08-17",
      noWa: "08222222222",
      email: "adiyahardi335+acc@gmail.com",
      alamatDomisili: "Jl. Test Flow No. 123",
      fileKtpUrl: "/uploads/ktp/test-ktp.jpg",
      buktiBayarUrl: "/uploads/transfer/test-transfer.jpg",
      dpp: "Sumatera Utara",
      dpc: "Medan",
      kode_provinsi: "12",
      kode_kabupaten: "71",
      kotaDomisili: "Medan",
      tingkatPendidikan: "S1",
      pekerjaan: "Software Engineer",
      minatBidang: "Teknologi",
      motivasiBergabung: "Ingin berkontribusi",
    });
    console.log(`[S2-1] ✅ Pendaftaran sukses. ID: ${regApproved.id}`);
    console.log(`[S2-1] ⏳ Menunggu 10 detik sebelum di-approve...`);
    await sleep(10000);

    console.log(`\n[S2-2] 🕵️‍♂️ TAHAP 2: Admin meng-APPROVE...`);
    await verifikasiRegistrasi({
      id: regApproved.id,
      status: "APPROVED_DPP",
      actorNama: "Admin Super",
      catatanVerifikasi: "Data lengkap.",
    });
    console.log(`[S2-2] ✅ Registrasi APPROVED_DPP. (Tidak ada email intermediate)`);
    
    console.log(`\n[S2-3] 💳 TAHAP 4: Konfirmasi pembayaran...`);
    await prosesPembayaran({
      id: regApproved.id,
      statusPembayaran: "PAID",
      actorNama: "Keuangan PIKI",
    });
    console.log(`[S2-3] ✅ Pembayaran lunas. (Tidak ada email intermediate)`);
    console.log(`[S2-3] ⏳ Menunggu 5 detik sebelum Aktivasi KTA...`);
    await sleep(5000);

    console.log(`\n[S2-4] 🪪 TAHAP 5: Aktivasi KTA Digital...`);
    const finalReg = await aktivasiKta({
      id: regApproved.id,
      actorNama: "Admin Super",
    });
    console.log(`[S2-4] ✅ KTA Digital Berhasil Diterbitkan! (Email KTA terkirim)`);
    console.log(`Nomor KTA: ${finalReg.noKta}`);
    console.log(`Status KTA: ${finalReg.statusKta}`);
    
    const akun = await prisma.akun.findUnique({ where: { uuid: finalReg.akunUuid! } });
    console.log(`Akun Username: ${akun?.username}`);

    console.log("\n🎉 SEMUA TEST END-TO-END SUKSES! Silakan cek email user dan superadmin Anda.");
    
  } catch (error) {
    console.error("❌ TEST GAGAL:", error);
  } finally {
    await prisma.$disconnect();
  }
};

runTest();
