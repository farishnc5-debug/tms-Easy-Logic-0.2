import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { readIntegrationConfig } from "@/lib/integrations-server";
import { validSignature } from "@/lib/webhook-signature";

type WaConfig = { webhookVerifyToken?: string; appSecret?: string };

// Meta's one-time webhook verification handshake when you register this URL
// in the WhatsApp Cloud API dashboard. Must echo back hub.challenge if the
// verify token matches what's configured on the Connections page.
export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get("hub.mode");
  const token = req.nextUrl.searchParams.get("hub.verify_token");
  const challenge = req.nextUrl.searchParams.get("hub.challenge");

  const cfg = await readIntegrationConfig<WaConfig>("WHATSAPP");
  if (mode === "subscribe" && challenge && cfg?.webhookVerifyToken && token === cfg.webhookVerifyToken) {
    return new NextResponse(challenge, { status: 200 });
  }
  return NextResponse.json({ error: "Verification failed" }, { status: 403 });
}

// Incoming WhatsApp messages (driver/customer replies). Every delivery from
// Meta is signed with the app secret (X-Hub-Signature-256); unsigned or
// wrongly-signed requests are rejected so nobody can inject fake replies.
export async function POST(req: NextRequest) {
  const raw = await req.text();
  const cfg = await readIntegrationConfig<WaConfig>("WHATSAPP");
  if (!cfg?.appSecret) {
    return NextResponse.json({ error: "Set the Meta App Secret on the Connections page first." }, { status: 401 });
  }
  if (!validSignature(raw, req.headers.get("x-hub-signature-256"), cfg.appSecret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  try {
    const payload = JSON.parse(raw);
    for (const entry of payload?.entry ?? []) {
      for (const change of entry?.changes ?? []) {
        for (const msg of change?.value?.messages ?? []) {
          await db.whatsAppMessage.create({
            data: {
              direction: "IN",
              fromPhone: msg?.from ?? "unknown",
              body: msg?.text?.body ?? `[${msg?.type ?? "non-text"} message]`,
              status: "RECEIVED",
            },
          });
        }
      }
    }
  } catch (err) {
    console.error("WhatsApp webhook parse error:", err);
  }
  return NextResponse.json({ received: true });
}
