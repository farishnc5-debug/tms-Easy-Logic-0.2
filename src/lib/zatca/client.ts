import type { ZatcaEnvironment } from "./csr";

// ZATCA "Fatoora" gateway. SANDBOX = developer portal (free, fake data),
// SIMULATION = pre-production rehearsal, PRODUCTION = legally binding.
const BASE: Record<ZatcaEnvironment, string> = {
  SANDBOX: "https://gw-fatoora.zatca.gov.sa/e-invoicing/developer-portal",
  SIMULATION: "https://gw-fatoora.zatca.gov.sa/e-invoicing/simulation",
  PRODUCTION: "https://gw-fatoora.zatca.gov.sa/e-invoicing/core",
};

export type Credentials = { binarySecurityToken: string; secret: string };

export type ZatcaMessage = { type?: string; code?: string; category?: string; message?: string; status?: string };
export type ZatcaResult = {
  httpStatus: number;
  ok: boolean;
  validationStatus?: string; // PASS | WARNING | ERROR
  reportingStatus?: string | null; // REPORTED | NOT_REPORTED
  clearanceStatus?: string | null; // CLEARED | NOT_CLEARED
  errors: ZatcaMessage[];
  warnings: ZatcaMessage[];
  clearedInvoice?: string; // base64 XML stamped by ZATCA (standard invoices)
  raw: unknown;
};

const auth = (c: Credentials) => "Basic " + Buffer.from(`${c.binarySecurityToken}:${c.secret}`).toString("base64");

async function post(env: ZatcaEnvironment, path: string, headers: Record<string, string>, body: unknown) {
  const res = await fetch(BASE[env] + path, {
    method: "POST",
    headers: { "Accept-Version": "V2", "Accept-Language": "en", "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(60_000),
  });
  const text = await res.text();
  let json: unknown = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* ZATCA sometimes returns plain text errors */
  }
  return { res, text, json };
}

// Step 1 of onboarding: exchange a CSR + one-time password for a compliance certificate.
export async function requestComplianceCsid(env: ZatcaEnvironment, csrPem: string, otp: string) {
  const { res, text, json } = await post(env, "/compliance", { OTP: otp }, { csr: Buffer.from(csrPem).toString("base64") });
  if (!res.ok || !json) throw new Error(`ZATCA refused the certificate request (HTTP ${res.status}): ${text.slice(0, 300)}`);
  const j = json as { requestID: number | string; binarySecurityToken: string; secret: string };
  return { requestId: String(j.requestID), binarySecurityToken: j.binarySecurityToken, secret: j.secret };
}

// Step 3 of onboarding: after the compliance checks pass, exchange for the production certificate.
export async function requestProductionCsid(env: ZatcaEnvironment, ccsid: Credentials, complianceRequestId: string) {
  const { res, text, json } = await post(
    env,
    "/production/csids",
    { Authorization: auth(ccsid) },
    { compliance_request_id: complianceRequestId },
  );
  if (!res.ok || !json) throw new Error(`ZATCA refused the production certificate request (HTTP ${res.status}): ${text.slice(0, 300)}`);
  const j = json as { requestID: number | string; binarySecurityToken: string; secret: string };
  return { requestId: String(j.requestID), binarySecurityToken: j.binarySecurityToken, secret: j.secret };
}

type Submission = { invoiceHash: string; uuid: string; xml: string };

function normalise(httpStatus: number, ok: boolean, json: unknown, text: string): ZatcaResult {
  const j = (json ?? {}) as {
    validationResults?: { status?: string; errorMessages?: ZatcaMessage[]; warningMessages?: ZatcaMessage[] };
    reportingStatus?: string | null;
    clearanceStatus?: string | null;
    clearedInvoice?: string;
    errors?: ZatcaMessage[];
  };
  const errors = [...(j.validationResults?.errorMessages ?? []), ...(j.errors ?? [])];
  if (!json && text) errors.push({ message: text.slice(0, 300) });
  return {
    httpStatus,
    ok,
    validationStatus: j.validationResults?.status,
    reportingStatus: j.reportingStatus,
    clearanceStatus: j.clearanceStatus,
    errors,
    warnings: j.validationResults?.warningMessages ?? [],
    clearedInvoice: j.clearedInvoice,
    raw: json ?? text,
  };
}

// Onboarding compliance check (does not legally submit anything).
export async function complianceCheck(env: ZatcaEnvironment, ccsid: Credentials, s: Submission) {
  const { res, text, json } = await post(env, "/compliance/invoices", { Authorization: auth(ccsid) }, body(s));
  return normalise(res.status, res.ok, json, text);
}

// Standard (B2B) invoices: ZATCA must clear (validate + stamp) before it is issued to the buyer.
export async function clearInvoice(env: ZatcaEnvironment, pcsid: Credentials, s: Submission) {
  const { res, text, json } = await post(
    env,
    "/invoices/clearance/single",
    { Authorization: auth(pcsid), "Clearance-Status": "1" },
    body(s),
  );
  return normalise(res.status, res.ok, json, text);
}

// Simplified (B2C) invoices are issued first and reported to ZATCA within 24 hours.
export async function reportInvoice(env: ZatcaEnvironment, pcsid: Credentials, s: Submission) {
  const { res, text, json } = await post(
    env,
    "/invoices/reporting/single",
    { Authorization: auth(pcsid), "Clearance-Status": "0" },
    body(s),
  );
  return normalise(res.status, res.ok, json, text);
}

const body = (s: Submission) => ({
  invoiceHash: s.invoiceHash,
  uuid: s.uuid,
  invoice: Buffer.from(s.xml).toString("base64"),
});
