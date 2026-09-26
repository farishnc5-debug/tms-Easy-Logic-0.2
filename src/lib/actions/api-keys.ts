"use server";

import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireCapability } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { API_KEY_SCOPES } from "@/lib/constants";

// API keys authenticate external callers — chiefly the future "Agent TMS"
// (an agentic AI that will drive this system programmatically). Only the
// SHA-256 hash is ever stored; the plaintext key is returned once, at
// creation time, and never again.
function generateKey() {
  const secret = crypto.randomBytes(24).toString("base64url");
  const key = `elk_live_${secret}`;
  const hash = crypto.createHash("sha256").update(key).digest("hex");
  const prefix = key.slice(0, 16) + "…";
  return { key, hash, prefix };
}

export async function listApiKeys() {
  await requireCapability("admin");
  return db.apiKey.findMany({ orderBy: { createdAt: "desc" }, include: { createdBy: { select: { name: true } } } });
}

// Returns the plaintext key exactly once — the caller must show it to the
// user immediately, it cannot be retrieved again afterward.
export async function createApiKey(formData: FormData) {
  const user = await requireCapability("admin");
  const name = String(formData.get("name") ?? "").trim();
  const scopes = formData.getAll("scopes").map(String);
  const validCodes = new Set<string>(API_KEY_SCOPES.map((s) => s.code));
  if (!name) throw new Error("Give the key a name (e.g. 'Agent TMS — production').");
  if (scopes.length === 0) throw new Error("Select at least one scope.");
  if (scopes.some((s) => !validCodes.has(s))) throw new Error("Invalid scope.");

  const { key, hash, prefix } = generateKey();
  await db.apiKey.create({
    data: {
      name,
      keyPrefix: prefix,
      keyHash: hash,
      scopes: scopes.join(","),
      createdById: user.id,
    },
  });
  await logAudit({ action: "API_KEY_CREATED", entity: "ApiKey", entityId: prefix, entityRef: name });
  revalidatePath("/connections");
  return key;
}

export async function revokeApiKey(id: string) {
  await requireCapability("admin");
  const row = await db.apiKey.update({ where: { id }, data: { revokedAt: new Date() } });
  await logAudit({ action: "API_KEY_REVOKED", entity: "ApiKey", entityId: id, entityRef: row.name });
  revalidatePath("/connections");
}
