import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

/**
 * Berita PIKI tiga bulan terakhir (plus pelantikan DPP yang diminta tetap ada).
 * Isi diparafrase dari liputan publik; gambar memakai arsip foto terbuka.
 * Jalankan sendiri: bun prisma/seed.ts --only-news
 */
export async function seedNewsPiki(prisma: PrismaClient) {
  console.log("Seeding News PIKI...");
  const admin = await prisma.akun.findUnique({
    where: { email: "admin-dpp@piki.org" },
  });
  if (!admin) {
    throw new Error(
      "Akun admin-dpp@piki.org belum ada. Jalankan seed cabang terlebih dahulu."
    );
  }

  const kategoriData = [
    { nama_kategori: "Siaran Pers", slug: "siaran-pers", deskripsi: "Pernyataan resmi organisasi" },
    { nama_kategori: "Organisasi", slug: "organisasi", deskripsi: "Kepengurusan dan tata kelola PIKI" },
    { nama_kategori: "Nasional", slug: "nasional", deskripsi: "Peristiwa tingkat nasional" },
    { nama_kategori: "Kegiatan", slug: "kegiatan", deskripsi: "Agenda dan kegiatan organisasi" },
    { nama_kategori: "Seminar", slug: "seminar", deskripsi: "Seminar, simposium, dan forum kebijakan" },
    { nama_kategori: "Kesehatan", slug: "kesehatan", deskripsi: "Isu kesehatan dan kedaulatan layanan" },
    { nama_kategori: "Hukum", slug: "hukum", deskripsi: "Kajian hukum dan keadilan" },
    { nama_kategori: "Energi", slug: "energi", deskripsi: "Ketahanan dan kemandirian energi" },
    { nama_kategori: "Kemanusiaan", slug: "kemanusiaan", deskripsi: "Tanggap bencana dan kepedulian sosial" },
    { nama_kategori: "Daerah", slug: "daerah", deskripsi: "Kabar DPD dan DPC" },
  ];

  const kategoriRecords = await Promise.all(
    kategoriData.map((k) =>
      prisma.newsKategori.upsert({
        where: { slug: k.slug },
        update: { deskripsi: k.deskripsi, nama_kategori: k.nama_kategori },
        create: { ...k, insert_by: admin.uuid },
      })
    )
  );

  const tagNames = [
    "DPP",
    "DPD",
    "DPC",
    "Pelantikan",
    "Nasional",
    "Seminar",
    "Kesehatan",
    "DBH",
    "Bencana",
    "Flores",
    "Karhutla",
    "Energi",
    "Hukum",
    "Bandung",
    "Tentena",
    "Banten",
    "Jakarta",
    "PIKI Peduli",
  ];

  const tagRecords = await Promise.all(
    tagNames.map((nama_tag) =>
      prisma.newsTag.upsert({
        where: { nama_tag },
        update: {},
        create: { nama_tag, insert_by: admin.uuid },
      })
    )
  );

  const dpdJabar = await ensureRegionalCabang(prisma, {
    nama: "DPD Jawa Barat",
    kota: "Bandung",
    provinsi: "Jawa Barat",
    email: "dpd.jabar@piki.org",
    adminEmail: "admin_dpd_jabar@pnps.id",
    adminUsername: "admin_dpd_jabar",
    adminNama: "Admin DPD Jawa Barat",
    insertBy: admin.uuid,
  });
  const dpdSulteng = await ensureRegionalCabang(prisma, {
    nama: "DPD Sulawesi Tengah",
    kota: "Palu",
    provinsi: "Sulawesi Tengah",
    email: "dpd.sulteng@piki.org",
    adminEmail: "admin_dpd_sulteng@pnps.id",
    adminUsername: "admin_dpd_sulteng",
    adminNama: "Admin DPD Sulawesi Tengah",
    insertBy: admin.uuid,
  });
  const dpdKalbar = await ensureRegionalCabang(prisma, {
    nama: "DPD Kalimantan Barat",
    kota: "Pontianak",
    provinsi: "Kalimantan Barat",
    email: "dpd.kalbar@piki.org",
    adminEmail: "admin_dpd_kalbar@pnps.id",
    adminUsername: "admin_dpd_kalbar",
    adminNama: "Admin DPD Kalimantan Barat",
    insertBy: admin.uuid,
  });
  const dpdBanten = await ensureRegionalCabang(prisma, {
    nama: "DPD Banten",
    kota: "Tangerang",
    provinsi: "Banten",
    email: "dpd.banten@piki.org",
    adminEmail: "admin_dpd_banten@pnps.id",
    adminUsername: "admin_dpd_banten",
    adminNama: "Admin DPD Banten",
    insertBy: admin.uuid,
  });

  const dpp = await prisma.cabang.findFirst({ where: { namaCabang: "DPP Pusat" } });
  const bandung = await prisma.cabang.findFirst({ where: { namaCabang: "Bandung" } });
  const kupang = await prisma.cabang.findFirst({ where: { namaCabang: "Kupang" } });
  if (!dpp || !bandung || !kupang) {
    throw new Error("Cabang DPP Pusat, Bandung, atau Kupang belum tersedia.");
  }

  await ensureExistingCabangAdmin(prisma, "admin_bandung@pnps.id", admin.uuid);
  await ensureExistingCabangAdmin(prisma, "admin_kupang@pnps.id", admin.uuid);
  await ensureExistingCabangAdmin(prisma, "admin_jakarta@pnps.id", admin.uuid);

  const authorBandung =
    (await prisma.akun.findUnique({ where: { email: "admin_bandung@pnps.id" } })) ?? admin;
  const authorKupang =
    (await prisma.akun.findUnique({ where: { email: "admin_kupang@pnps.id" } })) ?? admin;

  const findTag = (name: string) => tagRecords.find((t) => t.nama_tag === name);
  const findKategori = (name: string) =>
    kategoriRecords.find((k) => k.nama_kategori === name);

  const articles: NewsSeed[] = [
    {
      judul: "Maruarar Sirait Resmi Pimpin DPP PIKI Periode 2026-2031",
      slug: "pelantikan-dpp-piki-periode-2026-2031",
      ringkasan:
        "Serah terima jabatan di GPIB Paulus, Jakarta, mengukuhkan kepengurusan baru DPP PIKI dengan tema Tegakkanlah Keadilan. Maruarar Sirait didampingi Benyamin Patondok sebagai Sekretaris Jenderal.",
      thumbnail:
        "https://images.unsplash.com/photo-1438032005730-c779502df39b?auto=format&fit=crop&w=1600&q=80",
      publishedAt: new Date("2026-05-30T13:00:00.000Z"),
      views: 4820,
      durasi: 4,
      cabangUuid: dpp.uuid,
      authorUuid: admin.uuid,
      tags: ["Pelantikan", "DPP", "Nasional", "Jakarta"],
      kategori: ["Organisasi", "Nasional"],
      konten: `
        <p>Jakarta, 30 Mei 2026. Dewan Pimpinan Pusat Persatuan Inteligensia Kristen Indonesia menutup masa bakti 2020-2025 dan menahbiskan susunan pengurus 2026-2031 dalam ibadah di GPIB Paulus. Prosesi berlangsung khidmat, dengan tema yang diangkat dari Amos 5:15: Tegakkanlah Keadilan.</p>
        <p>Tongkat kepemimpinan berpindah dari Dr. Badikenita Br. Sitepu dan Dr. Audy Wuisang kepada Maruarar Sirait sebagai Ketua Umum serta Drs. Benyamin Patondok, M.M. sebagai Sekretaris Jenderal. Maruarar, yang juga Menteri Perumahan dan Kawasan Permukiman, menerima amanah itu bersama jajaran yang ia sebut sebagai tim lintas profesi: akademisi, praktisi hukum, rohaniawan, pengusaha, hingga atlet dan birokrat.</p>
        <p>Dalam sambutan setelah pelantikan, Ketua Umum baru menekankan agar sekolah-sekolah di daerah tidak lagi kesulitan memperoleh guru agama Kristen. Ia menaruh harapan pada Menteri Agama Nasaruddin Umar agar akses pengajaran iman di wilayah pinggiran diperlakukan adil. Ibadah dipimpin Ketua Umum PGI Pdt. Jacklevyn Frits Manuputty, dihadiri antara lain Menteri Dalam Negeri Tito Karnavian dan Kepala Badan Komunikasi Pemerintah Muhammad Qodari.</p>
        <p>Susunan pengurus mencerminkan jejaring nasional. Dewan kehormatan mengikutsertakan sejumlah tokoh senior, sementara jabatan wakil ketua umum diisi antara lain Ribka Haluk, dr. Benjamin Paulus Octavianus, Todotua Pasaribu, Greysia Polii, serta nama-nama yang sudah lama berkarya di lingkungan PIKI. Empat tokoh muda Sulawesi Utara, termasuk Harsen Roy Tampomuri dan Jolene Marie Cholock Rotinsulu, turut masuk dalam formasi ini.</p>
        <p>Kongres yang mendahului pelantikan digelar di Jakarta pada 30 April hingga 2 Mei 2026. Memori jabatan yang diserahkan mencakup hasil Rakernas, dokumen Kongres VII, AD/ART, dan bukti legalitas organisasi. DPP PIKI 2026-2031 menyatakan akan menindaklanjuti konsolidasi itu lewat rapat pengurus, agar lima tahun ke depan tidak berhenti pada seremoni, melainkan pada kerja kebijakan dan pelayanan.</p>
      `,
    },
    {
      judul: "PIKI dan Kemenkes Deklarasikan Kedaulatan Kesehatan Indonesia 2045 di Bandung",
      slug: "seminar-kedaulatan-kesehatan-indonesia-2045-bandung",
      ringkasan:
        "Seminar nasional di GBI Bethel Summarecon, Bandung, melahirkan Buku Putih kesehatan dan deklarasi bersama gereja, akademisi, serta Kementerian Kesehatan menuju Indonesia Emas 2045.",
      thumbnail:
        "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1600&q=80",
      publishedAt: new Date("2026-07-15T09:00:00.000Z"),
      views: 3610,
      durasi: 4,
      cabangUuid: bandung.uuid,
      authorUuid: authorBandung.uuid,
      tags: ["Seminar", "Kesehatan", "Bandung", "DPC"],
      kategori: ["Kesehatan", "Seminar"],
      konten: `
        <p>Bandung, 15 Juli 2026. DPC PIKI Bandung menjadi tuan rumah lapangan bagi Seminar Nasional dan Deklarasi Kedaulatan Kesehatan Indonesia 2045. Forum yang digelar DPP PIKI bersama Kementerian Kesehatan dan aras gereja itu bertempat di GBI Bethel Summarecon, The Journey, Kota Bandung.</p>
        <p>Tema yang dibawa sederhana tetapi luas: membangun bangsa yang sehat, mandiri, inovatif, dan mampu bersaing. Tiga poros pembahasan mengemuka, yaitu generasi yang sehat dan produktif, kemandirian sistem kesehatan, serta akses layanan yang adil sampai ke wilayah yang selama ini tertinggal. Program makan bergizi juga disebut sebagai salah satu cara memutus rantai stunting.</p>
        <p>Wakil Menteri Kesehatan sekaligus Wakil Ketua Umum DPP PIKI, dr. Benjamin Paulus Octavianus, mengingatkan bahwa kesehatan bukan lagi urusan klinik semata. Ia menyebutnya investasi atas mutu manusia, produktivitas, dan daya tahan ekonomi. Enam pilar transformasi layanan, dari fasilitas primer sampai teknologi kesehatan, ia kaitkan dengan kemitraan gereja dan organisasi masyarakat.</p>
        <p>Ketua Umum DPP PIKI Maruarar Sirait menekankan hal yang sama dari sudut perumahan dan lingkungan hidup: tubuh yang sehat sulit tumbuh di permukiman yang rapuh. Dewan Kehormatan Hashim Djojohadikusumo menambahkan bahwa ketahanan kesehatan adalah bagian dari kedaulatan negara. Pada forum itu PIKI menyerahkan Buku Putih Kedaulatan Kesehatan Indonesia 2045 sebagai bahan evaluasi kebijakan, disusun bersama akademisi, BPJS Kesehatan, kementerian, dan kampus.</p>
        <p>Bagi pengurus DPC Bandung, seminar ini bukan acara tamu yang lewat. Rekomendasi yang lahir di Gedebage akan dijalankan sebagai bahan kerja daerah: edukasi preventif di jemaat, jejaring tenaga kesehatan, dan advokasi agar layanan tidak berhenti di kota besar. Komitmen penutup forum adalah kolaborasi lanjutan menuju Indonesia Sehat 2045.</p>
      `,
    },
    {
      judul: "Seminar DBH di Tentena: PIKI Usul Sulawesi Tengah Jadi Pilot Project Nasional",
      slug: "seminar-dbh-pertambangan-tentena-poso",
      ringkasan:
        "Bersama Universitas Kristen Tentena, PIKI merumuskan lima rekomendasi tata kelola Dana Bagi Hasil tambang agar lebih adil, terukur, dan berpihak pada warga daerah penghasil.",
      thumbnail:
        "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1600&q=80",
      publishedAt: new Date("2026-07-24T10:00:00.000Z"),
      views: 2140,
      durasi: 5,
      cabangUuid: dpdSulteng.cabangUuid,
      authorUuid: dpdSulteng.authorUuid,
      tags: ["Seminar", "DBH", "DPD", "Tentena"],
      kategori: ["Seminar", "Daerah"],
      konten: `
        <p>Tentena, 24 Juli 2026. DPD PIKI Sulawesi Tengah mengawal Seminar Nasional optimalisasi Dana Bagi Hasil pertambangan di Kabupaten Poso. Kegiatan bersama Universitas Kristen Tentena ini dibuka secara adat Pekasiwa, lalu dilanjutkan doa oleh Sekretaris Umum Majelis Sinode GKST Pdt. Jetroson Rense. Sekjen DPP PIKI Benyamin Patondok membuka sidang ilmiah sambil membawa salam Ketua Umum Maruarar Sirait.</p>
        <p>Latar persoalannya nyata. Sulawesi Tengah menyimpan cadangan nikel, emas, dan bijih besi yang besar, tetapi transfer DBH yang sudah masuk kas daerah disebut masih sangat kecil dibanding potensi. Anggota DPD RI dapil setempat dan bupati Morowali Utara menyoroti kurang bayar yang membuat perencanaan kesejahteraan warga tertahan, padahal rumus pembagiannya sudah tertulis.</p>
        <p>Dari diskusi itu PIKI menyusun lima butir policy brief. Pertama, depletion cost dimasukkan ke rezim Minerba sebagai penerimaan negara yang sekaligus mengganti modal alam yang hilang. Kedua, satu data PNBP dan DBH dari hulu sampai hilir. Ketiga, kepastian hukum atas tunggakan bagi hasil. Keempat, belanja DBH di daerah harus berujung pada hasil yang terukur: kemiskinan turun, infrastruktur hidup, dan dana tidak habis dalam satu generasi. Kelima, Sulawesi Tengah diusulkan sebagai proyek percontohan nasional.</p>
        <p>Paparan Kementerian Keuangan disampaikan Plt. Dirjen Perimbangan Keuangan Nufransa Wira Sakti melalui konferensi video, sementara Dirjen Minerba Tri Winarno mengirim rekaman mengenai jenis DBH sumber daya alam di provinsi ini. Dewan Pembina DPP PIKI Martin Hutabarat menjadi salah satu narasumber. Wakil Ketua Umum Rizal Calvary Marimbo menegaskan seminar bukan panggung wacana, melainkan jalan agar pemikiran sampai ke Kementerian Keuangan.</p>
        <p>DPD Sulawesi Tengah akan menyimpan rekomendasi itu sebagai agenda advokasi daerah. Bagi pengurus, Tentena dipilih karena dekat dengan komunitas gereja dan kampus yang setiap hari hidup berdampingan dengan lubang tambang, bukan karena jauh dari pusat keputusan.</p>
      `,
    },
    {
      judul: "PIKI Peduli Menyusuri Flores, Menyalurkan Bantuan bagi Warga Terdampak Gempa",
      slug: "piki-peduli-bencana-gempa-flores-ntt",
      ringkasan:
        "Tim kemanusiaan PIKI menjangkau Ende, Sikka, Manggarai, dan Nagekeo. Ratusan kepala keluarga menerima sembako, obat, susu balita, serta perlengkapan darurat.",
      thumbnail:
        "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&w=1600&q=80",
      publishedAt: new Date("2026-08-31T02:00:00.000Z"),
      views: 3980,
      durasi: 4,
      cabangUuid: kupang.uuid,
      authorUuid: authorKupang.uuid,
      tags: ["Bencana", "Flores", "DPC", "PIKI Peduli"],
      kategori: ["Kemanusiaan", "Daerah"],
      konten: `
        <p>Ende, akhir Agustus 2026. Gempa yang mengguncang Flores tidak dijawab PIKI dengan pernyataan belasungkawa saja. Lewat PIKI Peduli, tim lapangan bergerak bersama posko GMIT, PGI, YAKKUM, Jakomkris, dan cabang GMKI, sementara DPC di Nusa Tenggara Timur menjadi simpul kabar dari desa-desa yang sulit dijangkau.</p>
        <p>Di Kabupaten Sikka, penyaluran awal menyasar Dusun Pohu dan Doka, Desa Umauta, Kecamatan Bola. Bantuan yang diberangkatkan meliputi air minum kemasan, lampu darurat, tikar, dan terpal. Melalui sambungan video, Ketua Umum DPP PIKI Maruarar Sirait meminta warga tetap saling menguatkan dan menegaskan bahwa mereka tidak menghadapi reruntuhan itu sendirian.</p>
        <p>Gelombang berikutnya pada 25 Agustus masuk ke Kabupaten Ende. Di Desa Baturaka, Kecamatan Kalimatu, sekitar 190 kepala keluarga menerima paket sembako, disertai obat dan susu. Pendataan setempat mencatat 19 rumah rusak berat. Sore harinya tim pindah ke Desa Kamubheka, Kecamatan Maukaro, menjangkau 200 kepala keluarga di tiga dusun, termasuk 51 balita. Obat disalurkan lewat puskesmas pembantu agar pemakaiannya tidak sembarangan. Kepala Desa Kamubheka, Melkior Mengga, menyebut bantuan itu meringankan hari-hari pertama setelah gempa.</p>
        <p>Perjalanan berlanjut ke Manggarai. Pada 27 Agustus, dari titik kumpul GMIT Imanuel Ruteng, tim membawa 60 paket sembako ke Desa Nenu di Kecamatan Cibal dan Desa Tako di Kecamatan Lamba Leda Selatan. Isi paketnya sederhana: beras, minyak, gula, mi, biskuit, kopi, dan teh. Wakil Sekretaris Jenderal Panca Family mengatakan jarak yang ditempuh bukan wisata bencana, melainkan cara memastikan bantuan sampai ke nama yang sudah didata posko.</p>
        <p>Kepala Kesekretariatan DPP PIKI Timotius Lubis menutup rangkaian Ende dengan kalimat yang kemudian menjadi nada seluruh misi: organisasi ingin hadir, menguatkan, dan berbagi sesuai kemampuan. Usai Ende, rombongan melanjutkan ke Mbay, Nagekeo. DPC PIKI di NTT akan tetap membuka pos informasi bagi warga yang rumahnya belum layak ditinggali.</p>
      `,
    },
    {
      judul: "PIKI Peduli Kirim Ratusan Ribu Masker untuk Warga Terdampak Asap Karhutla Kalimantan",
      slug: "piki-peduli-bencana-asap-karhutla-kalimantan",
      ringkasan:
        "Dua gelombang bantuan menembus kabut asap di Kalimantan Barat dan Kalimantan Tengah: 550 ribu masker plus obat dan multivitamin, disalurkan lewat DPD dan jaringan gereja.",
      thumbnail:
        "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1600&q=80",
      publishedAt: new Date("2026-09-22T08:00:00.000Z"),
      views: 2740,
      durasi: 4,
      cabangUuid: dpdKalbar.cabangUuid,
      authorUuid: dpdKalbar.authorUuid,
      tags: ["Bencana", "Karhutla", "DPD", "PIKI Peduli"],
      kategori: ["Kemanusiaan", "Daerah"],
      konten: `
        <p>Pontianak, September 2026. Kabut asap kebakaran hutan dan lahan kembali menekan pernapasan warga Kalimantan. Atas arahan Ketua Umum DPP PIKI Maruarar Sirait, program PIKI Peduli mengirim bantuan kesehatan dan meminta DPD setempat yang menyerahkannya, bukan berhenti di seremoni ibu kota.</p>
        <p>Pada 19 September, Timotius Lubis dan Lambas Napitupulu menyerahkan 120 karton masker kepada DPD PIKI Kalimantan Barat. Jumlahnya setara 300 ribu keping, ditambah 25 jenis obat. Ketua DPD T.T.A. Nyarong dan Sekretaris M. Gideon Lim menerima kiriman itu ketika pemantauan kualitas udara di Pontianak sedang berada pada kategori yang mengkhawatirkan. Masker dan obat dimaksudkan untuk kelompok rentan: anak, lansia, dan warga yang harus tetap bekerja di luar ruang.</p>
        <p>Tiga hari kemudian giliran Palangka Raya. DPD PIKI Kalimantan Tengah yang diwakili Dr. Lukas menerima 250 ribu masker, obat, dan multivitamin. Tim tidak pulang setelah foto bersama. Bersama pengurus daerah, bantuan dibawa ke GKE Sion, GKE Penenga, GKE Betlehem Bukit Raya, dan GBI Barigas, supaya jemaat yang menjadi pos alami warga bisa membagikannya pada hari yang sama.</p>
        <p>Timotius Lubis menegaskan PIKI Peduli tidak ingin dikenal sebagai organisasi yang hanya datang lalu pergi. Asap mengganggu sekolah, ibadah, dan mata pencarian. Karena itu saluran distribusi dipilih yang sudah dipercaya warga. Dr. Lukas menambahkan, DPD akan terus berkoordinasi dengan gereja dan pos kesehatan agar stok tidak mengendap di gudang.</p>
        <p>Bagi DPD Kalimantan Barat, gelombang ini adalah pengingat bahwa bencana asap bersifat musiman tetapi kerusakannya menumpuk. Pengurus daerah menyiapkan daftar kebutuhan lanjutan bila kemarau masih menahan hujan, sambil tetap mendorong pencegahan karhutla agar masker tidak menjadi jawaban permanen.</p>
      `,
    },
    {
      judul: "Simposium Energi di UPH Banten, PIKI Serahkan Rekomendasi Ketahanan Energi kepada ESDM",
      slug: "simposium-ketahanan-energi-nasional-uph-banten",
      ringkasan:
        "Di kampus Universitas Pelita Harapan, Tangerang, PIKI membahas RUPTL, nuklir, dan listrik desa. Menteri ESDM Bahlil Lahadalia siap memasukkan masukan itu ke peta jalan kementerian.",
      thumbnail:
        "https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&w=1600&q=80",
      publishedAt: new Date("2026-10-15T06:30:00.000Z"),
      views: 1890,
      durasi: 4,
      cabangUuid: dpdBanten.cabangUuid,
      authorUuid: dpdBanten.authorUuid,
      tags: ["Seminar", "Energi", "DPD", "Banten"],
      kategori: ["Energi", "Seminar"],
      konten: `
        <p>Tangerang, 15 Oktober 2026. DPD PIKI Banten menjadi tuan rumah wilayah bagi Simposium Ketahanan Energi Nasional Menuju Swasembada Energi Berkelanjutan. Ruang Grand Chapel, Gedung C kampus utama Universitas Pelita Harapan di Kelapa Dua, dipenuhi akademisi, perumus kebijakan, dan pengurus daerah. Ketua Dewan Pakar DPP PIKI sekaligus pembina yayasan kampus, James Riady, menyambut peserta.</p>
        <p>Tiga sesi menyusun alur diskusi. Sesi pertama menimbang pelaksanaan kebijakan energi dan RUPTL 2025-2034 bersama perencana PLN. Sesi kedua membuka percakapan nuklir bersama unsur Kementerian ESDM dan peneliti BRIN, dengan catatan keselamatan serta hak warga di sekitar calon tapak. Sesi ketiga berpindah ke wilayah 3T: listrik off-grid, dengan pemantik Wakil Menteri Dalam Negeri Ribka Haluk serta pengalaman dari Nias Utara.</p>
        <p>Menteri ESDM Bahlil Lahadalia hadir dan menerima policy brief dari Maruarar Sirait dan Tony Wenas. Ia menyebut masih ada desa yang anak-anaknya belajar dengan lampu pelita, lalu meminta jajarannya memasukkan rekomendasi PIKI ke roadmap kementerian. Target yang ia ulang adalah desa-desa memperoleh akses listrik secara bertahap hingga penghujung dekade ini.</p>
        <p>Tony Wenas, yang memandu steering committee, merangkum empat arah: bauran energi yang menopang Indonesia Emas 2045 dan sasaran emisi, pembangkit nuklir yang aman dan rendah karbon, listrik sebagai hak dasar, serta percepatan pembahasan aturan penyediaan tenaga listrik. Nuklir dibahas sebagai opsi daya besar, bukan sebagai jargon.</p>
        <p>DPD Banten akan menindaklanjuti simposium ini di tingkat provinsi, terutama soal bagaimana kawasan industri dan permukiman baru tidak meninggalkan desa yang jaringannya masih rapuh. Rekomendasi nasional baru berguna bila DPC di kabupaten ikut mengawasi apakah lampu di kampung benar-benar menyala.</p>
      `,
    },
    {
      judul: "Seminar Hukum Nasional di Jakarta, PIKI Dorong Pemulihan Hak Korban Tindak Pidana",
      slug: "seminar-hukum-nasional-perlindungan-korban-jakarta",
      ringkasan:
        "Di Balai Kartini, 20 Oktober 2026, DPP PIKI membahas cara agar putusan pengadilan benar-benar mengembalikan kerugian korban, termasuk lewat regulasi, kurator, dan mekanisme kepailitan.",
      thumbnail:
        "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1600&q=80",
      publishedAt: new Date("2026-10-20T06:30:00.000Z"),
      views: 1260,
      durasi: 4,
      cabangUuid: dpp.uuid,
      authorUuid: admin.uuid,
      tags: ["Seminar", "Hukum", "DPP", "Jakarta"],
      kategori: ["Hukum", "Nasional"],
      konten: `
        <p>Jakarta, 20 Oktober 2026. Sehari sebelum kabar ini diturunkan, DPP PIKI menggelar Seminar Nasional Perlindungan Hukum terhadap Korban Tindak Pidana di Balai Kartini. Fokusnya bukan pada pasal yang sudah dihafal, melainkan pada pertanyaan yang lebih sunyi: setelah hakim mengetuk palu, apakah korban menerima kembali apa yang hilang?</p>
        <p>Forum bertema pelaksanaan putusan pengadilan untuk pemulihan kerugian korban itu dihadiri Jaksa Agung ST Burhanuddin, Wakil Jaksa Agung Prof. Asep Nana Mulyana, Ketua Badan Legislasi DPR Bob Hasan, praktisi, akademisi, dan aliansi korban. Ketua panitia Paulus Lubis, advokat dan kurator, menyiapkan pembahasan bersama steering committee yang diketuai Dr. Jimmy Simanjuntak. Sekitar tiga ratus peserta ditargetkan, dari penegak hukum sampai lembaga bantuan hukum.</p>
        <p>Data yang dibentangkan dalam diskusi memperlihatkan jurang yang lebar. Pada sejumlah perkara dengan banyak korban, aset yang berhasil diamankan ditaksir hanya sebagian kecil dari kerugian, dalam contoh yang disebut forum berada di sekitar sepersepuluh. Verifikasi klaim, antrean eksekusi, dan koordinasi lembaga membuat restitusi macet bertahun-tahun. Salah satu jalan yang diuji adalah kepailitan: kurator di bawah hakim pengawas mendata tagihan korban dan membagi hasil pemberesan secara lebih tertib.</p>
        <p>PIKI menyampaikan tiga rekomendasi. Perlu aturan yang membuat pemulihan berbasis putusan bisa dijalankan, kolaborasi Kejaksaan, LPSK, dan kurator harus punya meja yang sama, dan mekanisme kepailitan layak dipakai bila pelaku menyembunyikan harta, baik korporasi maupun subjek hukum lain. Maruarar Sirait mengatakan seminar ini hanya sah bila berpihak pada keadilan korban, bukan pada kemeriahan podium.</p>
        <p>Jaksa Agung menerima masukan itu dan menyatakan Kejaksaan akan mengkaji aturan yang bisa dirasionalkan. Ia menggarisbawahi bahwa perkara semacam ini tidak selesai di satu institusi. Bob Hasan mengingatkan agar harapan korban tidak menggantung sebagai mimpi atas putusan yang tidak pernah dieksekusi. DPP PIKI akan merapikan risalah seminar menjadi naskah usulan bagi pembentuk undang-undang dan lembaga eksekusi.</p>
      `,
    },
  ];

  for (const item of articles) {
    const news = await prisma.newsUtama.upsert({
      where: { slug: item.slug },
      update: {
        judul: item.judul,
        ringkasan: item.ringkasan.trim(),
        konten: item.konten.trim(),
        url_thumbnail_img: item.thumbnail,
        statusNewsUtama: "PUBLISHED",
        cabangUuid: item.cabangUuid,
        author_akun_uuid: item.authorUuid,
        published_at: item.publishedAt,
        published_by: item.authorUuid,
        jumlah_dibaca: item.views,
        durasi_baca: item.durasi,
        update_by: admin.uuid,
      },
      create: {
        judul: item.judul,
        ringkasan: item.ringkasan.trim(),
        konten: item.konten.trim(),
        slug: item.slug,
        url_thumbnail_img: item.thumbnail,
        statusNewsUtama: "PUBLISHED",
        author_akun_uuid: item.authorUuid,
        published_at: item.publishedAt,
        published_by: item.authorUuid,
        jumlah_dibaca: item.views,
        durasi_baca: item.durasi,
        cabangUuid: item.cabangUuid,
        insert_by: admin.uuid,
      },
    });

    await prisma.newsUtamaTag.deleteMany({ where: { news_utama_uuid: news.uuid } });
    await prisma.newsUtamaKategori.deleteMany({ where: { news_utama_uuid: news.uuid } });

    const tagIds = item.tags
      .map((name) => findTag(name)?.uuid)
      .filter((id): id is string => Boolean(id));
    const kategoriIds = item.kategori
      .map((name) => findKategori(name)?.uuid)
      .filter((id): id is string => Boolean(id));

    if (tagIds.length) {
      await prisma.newsUtamaTag.createMany({
        data: tagIds.map((news_tag_uuid) => ({
          news_utama_uuid: news.uuid,
          news_tag_uuid,
          insert_by: admin.uuid,
        })),
        skipDuplicates: true,
      });
    }
    if (kategoriIds.length) {
      await prisma.newsUtamaKategori.createMany({
        data: kategoriIds.map((news_kategori_uuid) => ({
          news_utama_uuid: news.uuid,
          news_kategori_uuid,
          insert_by: admin.uuid,
        })),
        skipDuplicates: true,
      });
    }
    console.log(`  ✅ PIKI News: ${item.judul}`);
  }

  const allTags = await prisma.newsTag.findMany({ select: { uuid: true } });
  for (const tag of allTags) {
    const jumlah = await prisma.newsUtamaTag.count({
      where: { news_tag_uuid: tag.uuid },
    });
    await prisma.newsTag.update({
      where: { uuid: tag.uuid },
      data: { jumlah_penggunaan: jumlah },
    });
  }

  console.log("✅ News PIKI seeded");
}

interface NewsSeed {
  judul: string;
  slug: string;
  ringkasan: string;
  konten: string;
  thumbnail: string;
  publishedAt: Date;
  views: number;
  durasi: number;
  cabangUuid: string;
  authorUuid: string;
  tags: string[];
  kategori: string[];
}

async function ensureRegionalCabang(
  prisma: PrismaClient,
  input: {
    nama: string;
    kota: string;
    provinsi: string;
    email: string;
    adminEmail: string;
    adminUsername: string;
    adminNama: string;
    insertBy: string;
  }
) {
  const cabang = await prisma.cabang.upsert({
    where: { email: input.email },
    update: {
      namaCabang: input.nama,
      kabupatenKota: input.kota,
      provinsi: input.provinsi,
      wilayah: "Provinsi",
      isCabang: true,
      statusCabang: "ACTIVE",
    },
    create: {
      namaCabang: input.nama,
      alamat: `Sekretariat ${input.nama}`,
      kabupatenKota: input.kota,
      provinsi: input.provinsi,
      wilayah: "Provinsi",
      statusCabang: "ACTIVE",
      isCabang: true,
      deskripsiCabang: `${input.nama} adalah pengurus provinsi Persatuan Inteligensia Kristen Indonesia.`,
      visi: "Menghadirkan peran inteligensia Kristen yang adil bagi daerah.",
      noWa: "081234567890",
      instagram: input.adminUsername,
      facebook: input.nama,
      youtube: input.nama,
      email: input.email,
    },
  });

  const authorUuid = await ensureCabangAdmin(prisma, {
    cabangUuid: cabang.uuid,
    email: input.adminEmail,
    username: input.adminUsername,
    nama: input.adminNama,
    insertBy: input.insertBy,
  });

  return { cabangUuid: cabang.uuid, authorUuid };
}

async function ensureCabangAdmin(
  prisma: PrismaClient,
  input: {
    cabangUuid: string;
    email: string;
    username: string;
    nama: string;
    insertBy: string;
  }
) {
  let anggota = await prisma.anggota.findFirst({
    where: { namaLengkap: input.nama, cabangUuid: input.cabangUuid },
  });
  if (!anggota) {
    anggota = await prisma.anggota.create({
      data: {
        namaLengkap: input.nama,
        namaPanggil: "Admin",
        angkatan: "2018",
        statusKeanggotaan: "MEMBER",
        cabangUuid: input.cabangUuid,
        isApprovedByDPC: true,
        isApprovedByDPP: true,
        provinsi: null,
      },
    });
  } else {
    await prisma.anggota.update({
      where: { uuid: anggota.uuid },
      data: { isApprovedByDPC: true, isApprovedByDPP: true, cabangUuid: input.cabangUuid },
    });
  }

  const password = await bcrypt.hash("password123", 10);
  const akun = await prisma.akun.upsert({
    where: { email: input.email },
    update: {
      statusAkun: "ACTIVE",
      anggotaUuid: anggota.uuid,
    },
    create: {
      username: input.username,
      email: input.email,
      password,
      statusAkun: "ACTIVE",
      anggotaUuid: anggota.uuid,
    },
  });

  const role = await prisma.role.findUnique({ where: { namaRole: "ADMIN_CABANG" } });
  if (role) {
    await prisma.akunRole.upsert({
      where: { akunUuid_roleUuid: { akunUuid: akun.uuid, roleUuid: role.uuid } },
      update: {},
      create: { akunUuid: akun.uuid, roleUuid: role.uuid, insert_by: input.insertBy },
    });
  }
  return akun.uuid;
}

async function ensureExistingCabangAdmin(
  prisma: PrismaClient,
  email: string,
  insertBy: string
) {
  const akun = await prisma.akun.findUnique({ where: { email } });
  if (!akun) return;
  const role = await prisma.role.findUnique({ where: { namaRole: "ADMIN_CABANG" } });
  if (!role) return;
  await prisma.akunRole.upsert({
    where: { akunUuid_roleUuid: { akunUuid: akun.uuid, roleUuid: role.uuid } },
    update: {},
    create: { akunUuid: akun.uuid, roleUuid: role.uuid, insert_by: insertBy },
  });
}
