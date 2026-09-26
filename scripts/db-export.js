// Exports every table of the CURRENT database to data-export.json.
// Run this while the schema is still on SQLite, BEFORE switching to Postgres:
//   node scripts/db-export.js
// The file contains all your business data — keep it private (it is git-ignored).
const { PrismaClient, Prisma } = require("@prisma/client");
const fs = require("fs");

const db = new PrismaClient();
const lower = (s) => s.charAt(0).toLowerCase() + s.slice(1);

(async () => {
  const out = {};
  let total = 0;
  for (const model of Prisma.dmmf.datamodel.models) {
    const rows = await db[lower(model.name)].findMany();
    out[model.name] = rows;
    total += rows.length;
    console.log(`${model.name.padEnd(20)} ${rows.length} rows`);
  }
  fs.writeFileSync("data-export.json", JSON.stringify(out));
  console.log(`\nExported ${total} rows to data-export.json`);
  await db.$disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
