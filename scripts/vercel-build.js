// Production build for Vercel. The repository keeps SQLite for local
// development; at deploy time this flips the datasource to PostgreSQL,
// creates/updates the tables in the production database, then builds.
const { execSync } = require("child_process");

const run = (cmd, env = {}) => execSync(cmd, { stdio: "inherit", env: { ...process.env, ...env } });

if (!process.env.DATABASE_URL || !/^postgres(ql)?:\/\//.test(process.env.DATABASE_URL)) {
  console.error("DATABASE_URL must be a PostgreSQL connection string (e.g. from Neon) for production builds.");
  process.exit(1);
}
for (const v of ["SESSION_SECRET", "APP_ENCRYPTION_KEY"]) {
  if (!process.env[v]) {
    console.error(`Missing required environment variable ${v}.`);
    process.exit(1);
  }
}

run("node scripts/switch-db.js postgresql");
run("npx prisma generate");
// Schema changes need a direct (non-pooled) connection; fall back to the normal URL.
run("npx prisma db push --skip-generate", { DATABASE_URL: process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL });
run("npx next build");
