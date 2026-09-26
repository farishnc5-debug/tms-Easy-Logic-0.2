import crypto from "crypto";
import { db } from "@/lib/db";

// Authenticates an API key from an "Authorization: Bearer" header. Lives
// outside any "use server" file so it is not exposed as a public action.
// Compares SHA-256 hashes, so the plaintext key is never stored.
export async function verifyApiKey(rawKey: string) {
  const hash = crypto.createHash("sha256").update(rawKey).digest("hex");
  const row = await db.apiKey.findUnique({ where: { keyHash: hash } });
  if (!row || row.revokedAt) return null;
  db.apiKey.update({ where: { id: row.id }, data: { lastUsedAt: new Date() } }).catch(() => {});
  return row;
}

export { hasScope } from "@/lib/api-key-scope";
