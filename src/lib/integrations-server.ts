import { db } from "@/lib/db";
import { encryptSecret, decryptSecret } from "@/lib/crypto";

// Server-only helpers for integration credentials. These are deliberately NOT
// in a "use server" file: everything exported from one of those becomes a
// publicly callable endpoint, which must never include "read the secrets" or
// "send a WhatsApp message as the company".

export type IntegrationKind = "GMAIL" | "WHATSAPP" | "TELEGRAM" | "TGA" | "ZATCA";

export async function readIntegrationConfig<T = Record<string, string>>(
  type: IntegrationKind,
): Promise<T | null> {
  const row = await db.integration.findUnique({ where: { type } });
  if (!row?.config) return null;
  return JSON.parse(decryptSecret(row.config)) as T;
}

export function sealIntegrationConfig(config: object) {
  return encryptSecret(JSON.stringify(config));
}

// Core send primitive for the WhatsApp Cloud API (Meta). Every attempt is
// logged to WhatsAppMessage regardless of outcome.
export async function sendWhatsAppMessage(
  to: string,
  body: string,
  shipmentId?: string,
): Promise<{ ok: boolean; message: string }> {
  const cfg = await readIntegrationConfig<{ phoneNumberId: string; accessToken: string }>("WHATSAPP");
  if (!cfg) {
    return { ok: false, message: "WhatsApp is not connected. Configure it on the Connections page first." };
  }

  try {
    const res = await fetch(`https://graph.facebook.com/v21.0/${cfg.phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cfg.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messaging_product: "whatsapp", to, type: "text", text: { body } }),
    });
    const resBody = await res.json();
    if (!res.ok) throw new Error(resBody?.error?.message ?? `HTTP ${res.status}`);
    await db.whatsAppMessage.create({
      data: { direction: "OUT", toPhone: to, body, status: "SENT", shipmentId },
    });
    return { ok: true, message: `Message sent to ${to}.` };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await db.whatsAppMessage.create({
      data: { direction: "OUT", toPhone: to, body, status: "FAILED", error: message, shipmentId },
    });
    return { ok: false, message };
  }
}
