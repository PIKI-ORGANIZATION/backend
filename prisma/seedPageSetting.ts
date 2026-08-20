import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  log: ["info", "warn", "error"],
});

const PAGE_SETTINGS = [
  {
    key: "grit-photo",
    nama: "Grit Photo",
    type: "IMAGE" as const,
    value: "/sdsad/asdasd.png",
  },
  {
    key: "grit-desc",
    nama: "Grit Description",
    type: "TEXT" as const,
    value: `<p><span style="font-size: 20px; color: oklch(0.556 0 0); background-color: rgb(255, 255, 255); font-family: Alata, sans-serif">Pusat Pengembangan Kepemimpinan &amp; Karakter</span></p>
<p><span style="font-size: 18px; color: oklch(0.556 0 0); background-color: rgb(255, 255, 255); font-family: Alata, sans-serif">Wadah pembentukan generasi emas yang siap menghadapi tantangan global dengan integritas dan profesionalisme tinggi.</span></p>
<ul>
<li><span style="font-size: medium; color: oklch(0.145 0 0); background-color: rgb(255, 255, 255); font-family: Alata, sans-serif">Membangun karakter kepemimpinan yang tangguh dan berintegritas.</span></li>
<li><span style="font-size: medium; color: oklch(0.145 0 0); background-color: rgb(255, 255, 255); font-family: Alata, sans-serif">Mempersiapkan kader pemimpin masa depan melalui pendidikan intensif.</span></li>
<li><span style="font-size: medium; color: oklch(0.145 0 0); background-color: rgb(255, 255, 255); font-family: Alata, sans-serif">Mengasah kemampuan berpikir kritis dan problem-solving secara komprehensif.</span></li>
<li><span style="font-size: medium; color: oklch(0.145 0 0); background-color: rgb(255, 255, 255); font-family: Alata, sans-serif">Memperluas jaringan dan kolaborasi antar profesional muda.</span></li>
</ul>`,
  },
  {
    key: "eco-admin-fee",
    nama: "Ecommerce Admin Fee (%)",
    type: "NUMBER" as const,
    value: "15",
  },
  {
    key: "eco-admin-email",
    nama: "Ecommerce Admin Email Recepients",
    type: "ARRAY" as const,
    value: JSON.stringify(["admin@pnps.id", "admin2@pnps.id"]),
  },
  {
    key: "eco-admin-rekening",
    nama: "Nomor Rekening Admin E-Commerce",
    type: "TEXT" as const,
    value: "BCA - 1234567890 a/n PNPS GMKI",
  },
  {
    key: "land-youtube",
    nama: "Landing YouTube Video Link",
    type: "TEXT" as const,
    value: "https://www.youtube.com/@seniorgmki1",
  },
  {
    key: "values-headline",
    nama: "Values Section — Headline",
    type: "TEXT" as const,
    value: `<p><strong>Bersatu melayani lewat peran senior GMKI se-tanah air</strong></p>
<p><strong>untuk menghadirkan </strong><span style="color: #015da8"><strong>damai sejahtera bagi Indonesia</strong></span></p>`,
  },
  {
    key: "values-cards",
    nama: "Values Section — Cards",
    type: "TEXT" as const,
    value: JSON.stringify([
      {
        title: "Perkumpulan SENIOR GMKI",
        description: "Perkumpulan SENIOR GMKI adalah perkumpulan dari senior-senior GMKI se-Indonesia yang memiliki misi bersama",
        icon: "Users",
        color: "blue",
      },
      {
        title: "Pengurus Nasional Perkumpulan Senior (PNPS)",
        description: "Berpusat dan berkedudukan di Jakarta, Ibukota Indonesia",
        icon: "MapPin",
        color: "light",
      },
      {
        title: "Pengurus Nasional Perkumpulan Senior (PNPS)",
        description: "PNPS didirikan pada tanggal 27 November 2010 di Makassar",
        icon: "Calendar",
        color: "light",
      },
      {
        title: "Pengurus Nasional Perkumpulan Senior (PNPS)",
        description: "Merupakan perkumpulan resmi dari Gerakan Mahasiswa Kristen Indonesia (GMKI)",
        icon: "Link",
        color: "light",
      },
    ]),
  },
];

async function main() {
  console.log("🚀 Seeding Page Settings...");

  for (const setting of PAGE_SETTINGS) {
    await prisma.pageSetting.upsert({
      where: { key: setting.key },
      update: {
        nama: setting.nama,
        type: setting.type,
        value: setting.value,
      },
      create: setting,
    });
    console.log(`  ✅ ${setting.key} → "${setting.nama}" [${setting.type}]`);
  }

  console.log(`✅ ${PAGE_SETTINGS.length} Page Settings seeded.`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
