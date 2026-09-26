// Imports data-export.json into the CURRENT database (run after switching to
// Postgres and running `npx prisma db push`):
//   node scripts/db-import.js
// Tables are inserted parents-first so foreign keys are satisfied. Refuses to
// run if the target already has rows, so you can't double-import by accident.
const { PrismaClient, Prisma } = require("@prisma/client");
const fs = require("fs");

const db = new PrismaClient();
const lower = (s) => s.charAt(0).toLowerCase() + s.slice(1);

function orderModels(models) {
  const byName = new Map(models.map((m) => [m.name, m]));
  const deps = new Map(
    models.map((m) => [
      m.name,
      new Set(
        m.fields
          .filter((f) => f.relationFromFields && f.relationFromFields.length && f.type !== m.name)
          .map((f) => f.type),
      ),
    ]),
  );
  const done = new Set();
  const ordered = [];
  while (ordered.length < models.length) {
    const ready = models.filter((m) => !done.has(m.name) && [...deps.get(m.name)].every((d) => done.has(d)));
    const batch = ready.length ? ready : models.filter((m) => !done.has(m.name)).slice(0, 1); // break cycles
    for (const m of batch) {
      done.add(m.name);
      ordered.push(byName.get(m.name));
    }
  }
  return ordered;
}

(async () => {
  if (!fs.existsSync("data-export.json")) throw new Error("data-export.json not found — run scripts/db-export.js first.");
  const data = JSON.parse(fs.readFileSync("data-export.json", "utf8"));
  const models = orderModels(Prisma.dmmf.datamodel.models);

  for (const m of models) {
    if (await db[lower(m.name)].count()) {
      throw new Error(`${m.name} already has rows in the target database. Import into an EMPTY database only.`);
    }
  }

  let total = 0;
  for (const m of models) {
    const rows = data[m.name] ?? [];
    if (!rows.length) continue;
    const dateFields = m.fields.filter((f) => f.type === "DateTime").map((f) => f.name);
    const fixed = rows.map((r) => {
      const copy = { ...r };
      for (const f of dateFields) if (copy[f] != null) copy[f] = new Date(copy[f]);
      return copy;
    });
    // chunk to stay under parameter limits
    for (let i = 0; i < fixed.length; i += 500) {
      await db[lower(m.name)].createMany({ data: fixed.slice(i, i + 500) });
    }
    total += rows.length;
    console.log(`${m.name.padEnd(20)} ${rows.length} rows`);
  }
  console.log(`\nImported ${total} rows.`);
  await db.$disconnect();
})().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
