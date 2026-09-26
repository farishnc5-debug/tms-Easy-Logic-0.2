import crypto from "crypto";

// AES-256-GCM encryption for secrets stored in the database (Gmail app
// password, WhatsApp/Telegram tokens, GPS password). The key comes from
// APP_ENCRYPTION_KEY (preferred) or is derived from SESSION_SECRET. Set
// APP_ENCRYPTION_KEY explicitly in production and never change it afterward,
// or previously saved secrets can no longer be read.
const PREFIX = "enc:v1:";

function getKey() {
  const secret = process.env.APP_ENCRYPTION_KEY || process.env.SESSION_SECRET;
  if (!secret) throw new Error("APP_ENCRYPTION_KEY (or SESSION_SECRET) must be set to store secrets.");
  return crypto.scryptSync(secret, "easy-logic-secrets", 32);
}

export function encryptSecret(plain: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getKey(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return PREFIX + Buffer.concat([iv, tag, enc]).toString("base64");
}

// Also accepts legacy plaintext (values saved before encryption existed) so
// nothing breaks — they get encrypted the next time they are saved.
export function decryptSecret(stored: string): string {
  if (!stored.startsWith(PREFIX)) return stored;
  const raw = Buffer.from(stored.slice(PREFIX.length), "base64");
  const iv = raw.subarray(0, 12);
  const tag = raw.subarray(12, 28);
  const data = raw.subarray(28);
  const decipher = crypto.createDecipheriv("aes-256-gcm", getKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}
