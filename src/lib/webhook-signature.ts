import crypto from "crypto";

// Verifies Meta's X-Hub-Signature-256 header ("sha256=<hex hmac of raw body>").
export function validSignature(raw: string, header: string | null, appSecret: string) {
  if (!header?.startsWith("sha256=")) return false;
  const expected = crypto.createHmac("sha256", appSecret).update(raw).digest("hex");
  const given = header.slice(7);
  return given.length === expected.length && crypto.timingSafeEqual(Buffer.from(given), Buffer.from(expected));
}
