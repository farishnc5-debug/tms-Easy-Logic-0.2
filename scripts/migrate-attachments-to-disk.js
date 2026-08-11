// One-time migration: moves attachments stored as base64 data-URLs inside the
// database out to storage/uploads/ files, replacing the DB value with the
// serving path (/api/files/...). Safe to run repeatedly — already-migrated
// rows are skipped.
//
// Run with: node scripts/migrate-attachments-to-disk.js
const { PrismaClient } = require("@prisma/client");
const { mkdirSync, writeFileSync } = require("fs");
const path = require("path");
const crypto = require("crypto");

const db = new PrismaClient();
const ROOT = path.join(process.cwd(), "storage", "uploads");

const EXT = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "application/pdf": "pdf",
};

function persist(dataUrl, folder) {
  const m = /^data:([^;]+);base64,(.+)$/s.exec(dataUrl);
  if (!m) return null;
  const ext = EXT[m[1]] ?? "bin";
  const id = crypto.randomBytes(12).toString("hex");
  const dir = path.join(ROOT, folder);
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, `${id}.${ext}`), Buffer.from(m[2], "base64"));
  return `/api/files/${folder}/${id}.${ext}`;
}

(async () => {
  let moved = 0;

  const customers = await db.customer.findMany({
    where: {
      OR: [{ crDocDataUrl: { startsWith: "data:" } }, { vatDocDataUrl: { startsWith: "data:" } }],
    },
  });
  for (const c of customers) {
    const data = {};
    if (c.crDocDataUrl?.startsWith("data:")) {
      const p = persist(c.crDocDataUrl, "customers");
      if (p) { data.crDocDataUrl = p; moved++; }
    }
    if (c.vatDocDataUrl?.startsWith("data:")) {
      const p = persist(c.vatDocDataUrl, "customers");
      if (p) { data.vatDocDataUrl = p; moved++; }
    }
    if (Object.keys(data).length) await db.customer.update({ where: { id: c.id }, data });
  }

  const docs = await db.document.findMany({ where: { dataUrl: { startsWith: "data:" } } });
  for (const d of docs) {
    const p = persist(d.dataUrl, "documents");
    if (p) { await db.document.update({ where: { id: d.id }, data: { dataUrl: p } }); moved++; }
  }

  const pods = await db.proofOfDelivery.findMany({
    where: { photoDataUrl: { startsWith: "data:" } },
  });
  for (const pod of pods) {
    const p = persist(pod.photoDataUrl, "pod");
    if (p) { await db.proofOfDelivery.update({ where: { id: pod.id }, data: { photoDataUrl: p } }); moved++; }
  }

  console.log(`Migrated ${moved} attachment(s) from the database to storage/uploads/`);
  await db.$disconnect();
})();
