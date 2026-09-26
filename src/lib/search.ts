// Case-insensitive "contains" filter that works on both databases.
// SQLite's text matching already ignores case; PostgreSQL's does not and needs
// `mode: "insensitive"` (which SQLite rejects), so it is added only on Postgres.
const isPostgres = /^postgres(ql)?:\/\//.test(process.env.DATABASE_URL ?? "");

export function like(q: string) {
  return isPostgres ? { contains: q, mode: "insensitive" as const } : { contains: q };
}
