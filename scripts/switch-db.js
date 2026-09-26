// Flips the Prisma datasource between SQLite (local dev) and PostgreSQL
// (production) so it's a one-command change instead of hand-editing:
//   node scripts/switch-db.js postgresql
//   node scripts/switch-db.js sqlite
// Then update DATABASE_URL in .env, run `npx prisma db push`, and (when moving
// existing data) node scripts/db-import.js.
const fs = require("fs");

const target = process.argv[2];
if (!["sqlite", "postgresql"].includes(target)) {
  console.error("Usage: node scripts/switch-db.js <sqlite|postgresql>");
  process.exit(1);
}
const file = "prisma/schema.prisma";
const s = fs.readFileSync(file, "utf8");
const next = s.replace(/(datasource db \{\s*provider\s*=\s*")(sqlite|postgresql)(")/, `$1${target}$3`);
if (next === s) {
  console.log(`Schema already uses ${target}.`);
} else {
  fs.writeFileSync(file, next);
  console.log(`Schema datasource switched to ${target}.`);
}
console.log(
  target === "postgresql"
    ? 'Next: set DATABASE_URL="postgresql://..." (e.g. your Neon string), then `npx prisma db push`.'
    : 'Next: set DATABASE_URL="file:./dev.db", then `npx prisma db push`.',
);
