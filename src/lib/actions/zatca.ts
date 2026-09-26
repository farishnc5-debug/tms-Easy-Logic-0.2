"use server";

import { revalidatePath } from "next/cache";
import { requireCapability } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import {
  onboard,
  resetZatca,
  submitInvoiceToZatca,
  zatcaStatus,
  OnboardingError,
  type OnboardingStep,
} from "@/lib/zatca/service";
import type { ZatcaEnvironment } from "@/lib/zatca/csr";

const ENVS: ZatcaEnvironment[] = ["SANDBOX", "SIMULATION", "PRODUCTION"];

export async function getZatcaState() {
  await requireCapability("read");
  return zatcaStatus();
}

export type OnboardResult = { ok: boolean; steps: OnboardingStep[]; error?: string };

// Full ZATCA onboarding. PRODUCTION creates a legally binding e-invoicing
// identity for the company, so it is admin-only and audit-logged.
export async function zatcaOnboard(formData: FormData): Promise<OnboardResult> {
  const user = await requireCapability("admin");
  const environment = String(formData.get("environment") ?? "SANDBOX") as ZatcaEnvironment;
  const otp = String(formData.get("otp") ?? "").trim();
  if (!ENVS.includes(environment)) return { ok: false, steps: [], error: "Invalid environment." };
  if (!/^\d{6}$/.test(otp)) return { ok: false, steps: [], error: "Enter the 6-digit one-time password (OTP) from the Fatoora portal." };

  try {
    const steps = await onboard(environment, otp);
    await logAudit({ action: "ZATCA_ONBOARDED", entity: "Integration", entityId: "ZATCA", entityRef: environment, after: { by: user.name } });
    revalidatePath("/connections");
    return { ok: true, steps };
  } catch (e) {
    const steps = e instanceof OnboardingError ? e.steps : [];
    return { ok: false, steps, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function zatcaDisconnect() {
  await requireCapability("admin");
  await resetZatca();
  await logAudit({ action: "ZATCA_DISCONNECTED", entity: "Integration", entityId: "ZATCA" });
  revalidatePath("/connections");
}

export async function sendInvoiceToZatca(invoiceId: string) {
  await requireCapability("finance");
  const r = await submitInvoiceToZatca(invoiceId, "INVOICE");
  await logAudit({ action: "ZATCA_SUBMIT", entity: "Invoice", entityId: invoiceId, after: { status: r.status } });
  revalidatePath("/settlements", "layout");
  return r;
}

export async function issueZatcaCreditNote(invoiceId: string, formData: FormData) {
  await requireCapability("finance");
  const reason = String(formData.get("reason") ?? "").trim();
  const r = await submitInvoiceToZatca(invoiceId, "CREDIT", reason);
  await logAudit({ action: "ZATCA_CREDIT_NOTE", entity: "Invoice", entityId: invoiceId, reason, after: { status: r.status } });
  revalidatePath("/settlements", "layout");
  return r;
}
