"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { requireCapability } from "@/lib/rbac";
import { readIntegrationConfig, sealIntegrationConfig, sendWhatsAppMessage } from "@/lib/integrations-server";

// Each channel's config is a small JSON object stored in Integration.config.
// The keys the app reads for each type:
//   GMAIL:    { email, appPassword, fromName? }
//   WHATSAPP: { phoneNumberId, accessToken, testRecipient? }
//   TELEGRAM: { botToken, chatId }
//   TGA:      { carrierCode, apiKey, environment? }  — Wasiqa road transport document
export type IntegrationType = "GMAIL" | "WHATSAPP" | "TELEGRAM" | "TGA";

// Status only — credentials are never returned to the browser.
export async function getAllIntegrations() {
  await requireCapability("admin");
  const rows = await db.integration.findMany();
  const byType = new Map(rows.map((r) => [r.type, r]));
  return (["GMAIL", "WHATSAPP", "TELEGRAM", "TGA"] as const).map((type) => {
    const r = byType.get(type);
    return {
      type,
      status: r?.status ?? "DISCONNECTED",
      lastTestAt: r?.lastTestAt ?? null,
      lastTestOk: r?.lastTestOk ?? null,
      lastError: r?.lastError ?? null,
      updatedAt: r?.updatedAt ?? new Date(),
    };
  });
}

async function saveConfig(type: IntegrationType, config: Record<string, string>) {
  await requireCapability("admin");
  await db.integration.upsert({
    where: { type },
    create: { type, status: "CONNECTED", config: sealIntegrationConfig(config) },
    update: { status: "CONNECTED", config: sealIntegrationConfig(config), lastError: null },
  });
  await logAudit({ action: "INTEGRATION_CONFIGURED", entity: "Integration", entityId: type, entityRef: type });
  revalidatePath("/connections");
}

export async function saveGmailConfig(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const appPassword = String(formData.get("appPassword") ?? "").trim();
  const fromName = String(formData.get("fromName") ?? "").trim();
  if (!email || !appPassword) throw new Error("Gmail address and App Password are required.");
  await saveConfig("GMAIL", { email, appPassword, fromName });
}

export async function saveWhatsAppConfig(formData: FormData) {
  const phoneNumberId = String(formData.get("phoneNumberId") ?? "").trim();
  const accessToken = String(formData.get("accessToken") ?? "").trim();
  const testRecipient = String(formData.get("testRecipient") ?? "").trim();
  const webhookVerifyToken = String(formData.get("webhookVerifyToken") ?? "").trim();
  const appSecret = String(formData.get("appSecret") ?? "").trim();
  if (!phoneNumberId || !accessToken) throw new Error("Phone Number ID and Access Token are required.");
  await saveConfig("WHATSAPP", { phoneNumberId, accessToken, testRecipient, webhookVerifyToken, appSecret });
}

export async function saveTelegramConfig(formData: FormData) {
  const botToken = String(formData.get("botToken") ?? "").trim();
  const chatId = String(formData.get("chatId") ?? "").trim();
  if (!botToken || !chatId) throw new Error("Bot Token and Chat ID are required.");
  await saveConfig("TELEGRAM", { botToken, chatId });
}

export async function disconnectIntegration(type: IntegrationType) {
  await requireCapability("admin");
  await db.integration
    .update({ where: { type }, data: { status: "DISCONNECTED", config: null, lastError: null } })
    .catch(() => {});
  await logAudit({ action: "INTEGRATION_DISCONNECTED", entity: "Integration", entityId: type, entityRef: type });
  revalidatePath("/connections");
}

async function recordTestResult(type: IntegrationType, ok: boolean, error?: string) {
  await db.integration.update({
    where: { type },
    data: { lastTestAt: new Date(), lastTestOk: ok, lastError: ok ? null : (error ?? "Unknown error"), status: ok ? "CONNECTED" : "ERROR" },
  });
  revalidatePath("/connections");
}

// Sends a real test email via Gmail SMTP using an App Password
// (Google Account → Security → 2-Step Verification → App Passwords).
export async function sendGmailTest() {
  await requireCapability("admin");
  const cfg = await readIntegrationConfig<{ email: string; appPassword: string; fromName?: string }>("GMAIL");
  if (!cfg) throw new Error("Gmail is not configured yet.");

  try {
    const nodemailer = await import("nodemailer");
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: cfg.email, pass: cfg.appPassword },
    });
    await transporter.sendMail({
      from: cfg.fromName ? `${cfg.fromName} <${cfg.email}>` : cfg.email,
      to: cfg.email,
      subject: "Easy Logic — Gmail connection test",
      text: "This is a test message sent from your Easy Logic TMS Connections page. Gmail is connected correctly.",
    });
    await recordTestResult("GMAIL", true);
    return { ok: true, message: `Test email sent to ${cfg.email}.` };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await recordTestResult("GMAIL", false, message);
    return { ok: false, message };
  }
}

// Sends a real test message via the WhatsApp Cloud API (Meta).
export async function sendWhatsAppTest() {
  await requireCapability("admin");
  const cfg = await readIntegrationConfig<{ testRecipient?: string }>("WHATSAPP");
  if (!cfg) throw new Error("WhatsApp is not configured yet.");
  if (!cfg.testRecipient) return { ok: false, message: "Add a test recipient number first." };

  const result = await sendWhatsAppMessage(cfg.testRecipient, "Easy Logic TMS — WhatsApp connection test message.");
  await recordTestResult("WHATSAPP", result.ok, result.ok ? undefined : result.message);
  return result;
}

// Sends a real test message via the Telegram Bot API.
export async function sendTelegramTest() {
  await requireCapability("admin");
  const cfg = await readIntegrationConfig<{ botToken: string; chatId: string }>("TELEGRAM");
  if (!cfg) throw new Error("Telegram is not configured yet.");

  try {
    const res = await fetch(`https://api.telegram.org/bot${cfg.botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: cfg.chatId,
        text: "Easy Logic TMS — Telegram connection test message.",
      }),
    });
    const body = await res.json();
    if (!res.ok || !body.ok) throw new Error(body?.description ?? `HTTP ${res.status}`);
    await recordTestResult("TELEGRAM", true);
    return { ok: true, message: "Test message sent." };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await recordTestResult("TELEGRAM", false, message);
    return { ok: false, message };
  }
}
