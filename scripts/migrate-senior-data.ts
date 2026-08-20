import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting data migration for Senior master tables...');

  const seniors = await prisma.$queryRaw<any[]>`
    SELECT uuid, pendidikan, pekerjaan, "bidangStudi", "bidangMinat"
    FROM "Senior"
  `;

  console.log(`Found ${seniors.length} seniors to migrate.`);

  // 1. Collect unique values
  const pendidikanSet = new Set<string>();
  const pekerjaanSet = new Set<string>();
  const bidangStudiSet = new Set<string>();
  const bidangMinatSet = new Set<string>();

  for (const s of seniors) {
    if (s.pendidikan?.trim()) pendidikanSet.add(s.pendidikan.trim());
    if (s.pekerjaan?.trim()) pekerjaanSet.add(s.pekerjaan.trim());
    if (s.bidangStudi?.trim()) bidangStudiSet.add(s.bidangStudi.trim());
    if (s.bidangMinat?.trim()) bidangMinatSet.add(s.bidangMinat.trim());
  }

  // 2. Insert into Master tables and build lookup maps
  const mapPendidikan = new Map<string, string>();
  for (const name of pendidikanSet) {
    let record = await prisma.masterPendidikan.findUnique({ where: { nama: name } });
    if (!record) {
      record = await prisma.masterPendidikan.create({ data: { nama: name } });
    }
    mapPendidikan.set(name, record.uuid);
  }

  const mapPekerjaan = new Map<string, string>();
  for (const name of pekerjaanSet) {
    let record = await prisma.masterPekerjaan.findUnique({ where: { nama: name } });
    if (!record) {
      record = await prisma.masterPekerjaan.create({ data: { nama: name } });
    }
    mapPekerjaan.set(name, record.uuid);
  }

  const mapBidangStudi = new Map<string, string>();
  for (const name of bidangStudiSet) {
    let record = await prisma.masterBidangStudi.findUnique({ where: { nama: name } });
    if (!record) {
      record = await prisma.masterBidangStudi.create({ data: { nama: name } });
    }
    mapBidangStudi.set(name, record.uuid);
  }

  const mapBidangMinat = new Map<string, string>();
  for (const name of bidangMinatSet) {
    let record = await prisma.masterBidangMinat.findUnique({ where: { nama: name } });
    if (!record) {
      record = await prisma.masterBidangMinat.create({ data: { nama: name } });
    }
    mapBidangMinat.set(name, record.uuid);
  }

  console.log(`Created ${mapPendidikan.size} Pendidikan, ${mapPekerjaan.size} Pekerjaan, ${mapBidangStudi.size} Bidang Studi, ${mapBidangMinat.size} Bidang Minat.`);

  // 3. Update Seniors with UUIDs
  let updatedCount = 0;
  for (const s of seniors) {
    const dataToUpdate: any = {};

    if (s.pendidikan?.trim()) {
      dataToUpdate.pendidikanUuid = mapPendidikan.get(s.pendidikan.trim());
    }
    if (s.pekerjaan?.trim()) {
      dataToUpdate.pekerjaanUuid = mapPekerjaan.get(s.pekerjaan.trim());
    }
    if (s.bidangStudi?.trim()) {
      dataToUpdate.bidangStudiUuid = mapBidangStudi.get(s.bidangStudi.trim());
    }
    if (s.bidangMinat?.trim()) {
      dataToUpdate.bidangMinatUuid = mapBidangMinat.get(s.bidangMinat.trim());
    }

    if (Object.keys(dataToUpdate).length > 0) {
      await prisma.senior.update({
        where: { uuid: s.uuid },
        data: dataToUpdate,
      });
      updatedCount++;
    }
  }

  console.log(`Successfully updated ${updatedCount} seniors with foreign keys.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
