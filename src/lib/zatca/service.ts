import crypto from "crypto";
import { db } from "@/lib/db";
import { readIntegrationConfig, sealIntegrationConfig } from "@/lib/integrations-server";
import { generateKeyPair, buildCsr, type ZatcaEnvironment } from "./csr";
import {
  buildInvoiceTemplate,
  computeTotals,
  money,
  type ZatcaParty,
  type ZatcaDocInput,
  type ZatcaLine,
} from "./invoice-xml";
import { signInvoice } from "./sign";
import {
  requestComplianceCsid,
  requestProductionCsid,
  complianceCheck,
  clearInvoice,
  reportInvoice,
  type Credentials,
  type ZatcaResult,
} from "./client";
import { validateParty, validateSellerVat } from "./validate";

// What is stored (encrypted) in the Integration row of type "ZATCA".
export type ZatcaConfig = {
  environment: ZatcaEnvironment;
  privateKeyPem: string;
  commonName: string;
  egsSerial: string;
  complianceRequestId: string;
  ccsid: Credentials;
  pcsid?: Credentials; // present once onboarding is complete
  onboardedAt?: string;
};

// Hash the first invoice in the chain points back to: SHA-256("0") as hex, Base64 encoded.
export const INITIAL_PIH = Buffer.from(crypto.createHash("sha256").update("0").digest("hex")).toString("base64");

export async function getZatcaConfig() {
  return readIntegrationConfig<ZatcaConfig>("ZATCA");
}

async function saveZatcaConfig(cfg: ZatcaConfig) {
  const sealed = sealIntegrationConfig(cfg);
  await db.integration.upsert({
    where: { type: "ZATCA" },
    create: { type: "ZATCA", status: cfg.pcsid ? "CONNECTED" : "DISCONNECTED", config: sealed },
    update: { status: cfg.pcsid ? "CONNECTED" : "DISCONNECTED", config: sealed, lastError: null },
  });
}

export async function zatcaStatus() {
  const cfg = await getZatcaConfig();
  return {
    onboarded: !!cfg?.pcsid,
    environment: cfg?.environment ?? null,
    onboardedAt: cfg?.onboardedAt ?? null,
  };
}

// ---------- Riyadh local time (ZATCA expects the taxpayer's local date/time) ----------
export function riyadhParts(d = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Riyadh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(d);
  const g = (t: string) => parts.find((p) => p.type === t)!.value;
  return { date: `${g("year")}-${g("month")}-${g("day")}`, time: `${g("hour")}:${g("minute")}:${g("second")}` };
}

// ---------- seller / buyer from our own records ----------
export async function loadSeller(): Promise<ZatcaParty> {
  const c = await db.companyProfile.findFirst();
  if (!c) throw new Error("Fill in your Company Profile first.");
  const problems = [
    ...validateSellerVat(c.vatNumber),
    ...validateParty("Company profile", {
      street: c.streetName,
      buildingNumber: c.buildingNumber,
      district: c.district,
      city: c.city,
      postalCode: c.postalCode,
    }),
  ];
  if (!c.crNumber) problems.push("Company profile: commercial registration (CR) number is missing.");
  if (problems.length) throw new Error(problems.join(" "));
  return {
    name: c.name,
    vatNumber: c.vatNumber!,
    crNumber: c.crNumber!,
    street: c.streetName!,
    buildingNumber: c.buildingNumber!,
    district: c.district!,
    city: c.city!,
    postalCode: c.postalCode!,
  };
}

// ---------- onboarding ----------
// Sample documents used for ZATCA's mandatory compliance tests
function sampleDoc(
  seller: ZatcaParty,
  invoiceType: "STANDARD" | "SIMPLIFIED",
  docType: "INVOICE" | "CREDIT" | "DEBIT",
  icv: number,
  previousHash: string,
): ZatcaDocInput {
  const now = riyadhParts();
  return {
    invoiceType,
    docType,
    number: `TEST-${invoiceType[0]}${docType[0]}-${icv}`,
    uuid: crypto.randomUUID(),
    issueDate: now.date,
    issueTime: now.time,
    icv,
    previousHash,
    supplier: seller,
    buyer:
      invoiceType === "STANDARD"
        ? {
            name: "Compliance Test Buyer",
            vatNumber: "399999999800003",
            street: "King Fahd Road",
            buildingNumber: "5678",
            district: "Al Olaya",
            city: "Riyadh",
            postalCode: "12211",
          }
        : undefined,
    lines: [{ name: "Compliance test service", quantity: 1, unitPrice: 100 }],
    vatPct: 15,
    supplyDate: now.date,
    originalInvoiceNumber: docType === "INVOICE" ? undefined : "TEST-ORIGINAL-0",
    reason: docType === "INVOICE" ? undefined : "Compliance test",
  };
}

export type OnboardingStep = { step: string; ok: boolean; detail?: string };

// Full onboarding: keys + CSR -> compliance certificate -> mandatory compliance
// tests (all 6 document types) -> production certificate.
export async function onboard(environment: ZatcaEnvironment, otp: string): Promise<OnboardingStep[]> {
  const steps: OnboardingStep[] = [];
  const seller = await loadSeller();

  const { privateKeyPem, publicKeyDer, privateKey } = generateKeyPair();
  const prefix = environment === "PRODUCTION" ? "" : environment === "SIMULATION" ? "PRE-" : "TST-";
  const commonName = `${prefix}EasyLogic-${seller.vatNumber}`;
  const egsSerial = `1-EasyLogic|2-TMS|3-${crypto.randomUUID()}`;
  const csr = buildCsr(
    {
      environment,
      vatNumber: seller.vatNumber!,
      organizationName: seller.name,
      organizationUnit: seller.city,
      commonName,
      egsSerial,
      registeredAddress: `${seller.district} ${seller.city}`,
      businessCategory: "Transportation",
    },
    privateKey,
    publicKeyDer,
  );

  const ccsid = await requestComplianceCsid(environment, csr, otp.trim());
  steps.push({ step: "Compliance certificate issued by ZATCA", ok: true });
  const creds: Credentials = { binarySecurityToken: ccsid.binarySecurityToken, secret: ccsid.secret };

  // ZATCA requires every document type to pass its compliance check
  let prev = INITIAL_PIH;
  const combos: ["STANDARD" | "SIMPLIFIED", "INVOICE" | "CREDIT" | "DEBIT"][] = [
    ["STANDARD", "INVOICE"],
    ["STANDARD", "CREDIT"],
    ["STANDARD", "DEBIT"],
    ["SIMPLIFIED", "INVOICE"],
    ["SIMPLIFIED", "CREDIT"],
    ["SIMPLIFIED", "DEBIT"],
  ];
  for (const [i, [invType, docType]] of combos.entries()) {
    const d = sampleDoc(seller, invType, docType, i + 1, prev);
    const t = computeTotals(d.lines, d.vatPct);
    const signed = signInvoice({
      template: buildInvoiceTemplate(d),
      privateKeyPem,
      binarySecurityToken: creds.binarySecurityToken,
      sellerName: seller.name,
      vatNumber: seller.vatNumber!,
      issueDate: d.issueDate,
      issueTime: d.issueTime,
      gross: money(t.gross),
      vat: money(t.vat),
      simplified: invType === "SIMPLIFIED",
    });
    const r = await complianceCheck(environment, creds, { invoiceHash: signed.invoiceHash, uuid: d.uuid, xml: signed.xml });
    const label = `Compliance test: ${invType.toLowerCase()} ${docType.toLowerCase()}`;
    if (r.validationStatus === "ERROR" || !r.ok) {
      const detail = r.errors.map((e) => `${e.code}: ${e.message}`).join("; ");
      steps.push({ step: label, ok: false, detail });
      throw new OnboardingError(`${label} failed — ${detail}`, steps);
    }
    steps.push({ step: label, ok: true });
    prev = signed.invoiceHash;
  }

  const pcsid = await requestProductionCsid(environment, creds, ccsid.requestId);
  steps.push({ step: "Production certificate issued by ZATCA", ok: true });

  await saveZatcaConfig({
    environment,
    privateKeyPem,
    commonName,
    egsSerial,
    complianceRequestId: ccsid.requestId,
    ccsid: creds,
    pcsid: { binarySecurityToken: pcsid.binarySecurityToken, secret: pcsid.secret },
    onboardedAt: new Date().toISOString(),
  });
  return steps;
}

export class OnboardingError extends Error {
  constructor(
    message: string,
    public steps: OnboardingStep[],
  ) {
    super(message);
  }
}

export async function resetZatca() {
  await db.integration.deleteMany({ where: { type: "ZATCA" } });
}

// ---------- submitting real invoices ----------
export type SubmitOutcome = { ok: boolean; status: string; message: string; documentId?: string };

const paymentCode = (terms: string) => (terms === "CREDIT" ? "30" : "10");

async function nextChainPosition(environment: string) {
  const last = await db.zatcaDocument.findFirst({
    where: { environment, icv: { not: null }, status: { in: ["CLEARED", "REPORTED"] } },
    orderBy: { icv: "desc" },
  });
  return { icv: (last?.icv ?? 0) + 1, previousHash: last?.hash ?? INITIAL_PIH };
}

function invoiceLines(inv: {
  amount: number;
  charges: { description: string; amount: number }[];
  settlement: { shipment: { code: string; originName: string; destinationName: string } };
}): ZatcaLine[] {
  const s = inv.settlement.shipment;
  return [
    { name: `Road transport ${s.originName} to ${s.destinationName} (${s.code})`, quantity: 1, unitPrice: inv.amount },
    ...inv.charges.map((c) => ({ name: c.description, quantity: 1, unitPrice: c.amount })),
  ];
}

// Builds, signs and submits one document for an invoice. docType INVOICE is the
// normal case; CREDIT reverses an already-accepted invoice in full.
export async function submitInvoiceToZatca(
  invoiceId: string,
  docType: "INVOICE" | "CREDIT" = "INVOICE",
  reason?: string,
): Promise<SubmitOutcome> {
  const cfg = await getZatcaConfig();
  if (!cfg?.pcsid) return { ok: false, status: "NOT_CONNECTED", message: "ZATCA is not connected. Complete onboarding on the Connections page." };

  const invoice = await db.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      charges: true,
      zatcaDocuments: true,
      settlement: { include: { shipment: { include: { customer: true, trip: true } } } },
    },
  });
  if (!invoice) return { ok: false, status: "ERROR", message: "Invoice not found." };

  const accepted = invoice.zatcaDocuments.find(
    (d) => d.docType === "INVOICE" && d.environment === cfg.environment && ["CLEARED", "REPORTED"].includes(d.status),
  );
  if (docType === "INVOICE" && accepted) return { ok: true, status: accepted.status, message: "Already submitted to ZATCA.", documentId: accepted.id };
  if (docType === "CREDIT") {
    if (!accepted) return { ok: false, status: "ERROR", message: "Only an invoice already accepted by ZATCA can be credited." };
    if (!reason?.trim()) return { ok: false, status: "ERROR", message: "A reason is required for a credit note." };
  }

  const customer = invoice.settlement.shipment.customer;
  const invoiceType: "STANDARD" | "SIMPLIFIED" = accepted?.invoiceType === "SIMPLIFIED" || !customer.vatNumber ? "SIMPLIFIED" : "STANDARD";

  let seller: ZatcaParty;
  try {
    seller = await loadSeller();
  } catch (e) {
    return { ok: false, status: "ERROR", message: (e as Error).message };
  }

  let buyer: ZatcaParty | undefined;
  if (invoiceType === "STANDARD") {
    const problems = [
      ...validateParty(`Customer "${customer.name}"`, {
        street: customer.streetName,
        buildingNumber: customer.buildingNumber,
        district: customer.district,
        city: customer.city,
        postalCode: customer.postalCode,
      }),
      ...validateSellerVat(customer.vatNumber, `Customer "${customer.name}" VAT number`),
    ];
    if (problems.length) return { ok: false, status: "ERROR", message: problems.join(" ") };
    buyer = {
      name: customer.company || customer.name,
      vatNumber: customer.vatNumber!,
      street: customer.streetName!,
      buildingNumber: customer.buildingNumber!,
      district: customer.district!,
      city: customer.city!,
      postalCode: customer.postalCode!,
    };
  }

  const lines = invoiceLines(invoice);
  const totals = computeTotals(lines, invoice.vatPct);
  const now = riyadhParts();
  const supplyDate = invoice.settlement.shipment.trip?.deliveredAt
    ? riyadhParts(invoice.settlement.shipment.trip.deliveredAt).date
    : now.date;
  const number = docType === "INVOICE" ? invoice.code : `${invoice.code}-CN${invoice.zatcaDocuments.filter((d) => d.docType === "CREDIT").length + 1}`;

  // One submission at a time per environment: the chain (counter + previous hash)
  // must not fork. A stuck PENDING row older than 5 minutes is ignored.
  const inFlight = await db.zatcaDocument.count({
    where: { environment: cfg.environment, status: "PENDING", createdAt: { gt: new Date(Date.now() - 5 * 60_000) } },
  });
  if (inFlight) return { ok: false, status: "BUSY", message: "Another invoice is being sent to ZATCA right now. Try again in a moment." };

  const { icv, previousHash } = await nextChainPosition(cfg.environment);
  const uuid = crypto.randomUUID();
  const doc: ZatcaDocInput = {
    invoiceType,
    docType,
    number,
    uuid,
    issueDate: now.date,
    issueTime: now.time,
    icv,
    previousHash,
    supplier: seller,
    buyer,
    lines,
    vatPct: invoice.vatPct,
    supplyDate,
    paymentMeansCode: paymentCode(invoice.settlement.paymentTerms),
    originalInvoiceNumber: docType === "CREDIT" ? invoice.code : undefined,
    reason: docType === "CREDIT" ? reason : undefined,
  };

  const signed = signInvoice({
    template: buildInvoiceTemplate(doc),
    privateKeyPem: cfg.privateKeyPem,
    binarySecurityToken: cfg.pcsid.binarySecurityToken,
    sellerName: seller.name,
    vatNumber: seller.vatNumber!,
    issueDate: doc.issueDate,
    issueTime: doc.issueTime,
    gross: money(totals.gross),
    vat: money(totals.vat),
    simplified: invoiceType === "SIMPLIFIED",
  });

  // Record the attempt first, so nothing is ever sent to ZATCA without a local record.
  const row = await db.zatcaDocument.create({
    data: {
      invoiceId,
      docType,
      invoiceType,
      number,
      uuid,
      environment: cfg.environment,
      hash: signed.invoiceHash,
      previousHash,
      icv, // reserved now; the unique (environment, icv) index stops two documents taking the same slot
      xml: signed.xml,
      qr: signed.qr,
      status: "PENDING",
      reason: reason ?? null,
      amountGross: totals.gross,
    },
  });

  let result: ZatcaResult;
  try {
    const send = invoiceType === "STANDARD" ? clearInvoice : reportInvoice;
    result = await send(cfg.environment, cfg.pcsid, { invoiceHash: signed.invoiceHash, uuid, xml: signed.xml });
  } catch (e) {
    // Network problem: ZATCA may or may not have received it. Keep it as ERROR for a safe retry.
    await db.zatcaDocument.update({ where: { id: row.id }, data: { status: "ERROR", icv: null, response: JSON.stringify({ error: String(e) }) } });
    return { ok: false, status: "ERROR", message: `Could not reach ZATCA: ${(e as Error).message}. It will be retried.`, documentId: row.id };
  }

  const accepted2 = result.ok && result.validationStatus !== "ERROR" && (result.clearanceStatus === "CLEARED" || result.reportingStatus === "REPORTED");
  if (!accepted2) {
    await db.zatcaDocument.update({
      where: { id: row.id },
      data: { status: "REJECTED", icv: null, response: JSON.stringify(result.raw), submittedAt: new Date() },
    });
    const detail = result.errors.map((e) => e.message).filter(Boolean).join("; ") || `HTTP ${result.httpStatus}`;
    return { ok: false, status: "REJECTED", message: `ZATCA rejected the invoice: ${detail}`, documentId: row.id };
  }

  // Cleared invoices come back stamped by ZATCA — keep that version as the legal copy.
  const finalXml = result.clearedInvoice ? Buffer.from(result.clearedInvoice, "base64").toString("utf8") : signed.xml;
  const qrFromXml = /<cbc:ID>QR<\/cbc:ID>\s*<cac:Attachment>\s*<cbc:EmbeddedDocumentBinaryObject[^>]*>([^<]+)</.exec(finalXml)?.[1];
  await db.zatcaDocument.update({
    where: { id: row.id },
    data: {
      status: result.clearanceStatus === "CLEARED" ? "CLEARED" : "REPORTED",
      xml: finalXml,
      qr: qrFromXml ?? signed.qr,
      response: JSON.stringify(result.raw),
      submittedAt: new Date(),
    },
  });
  return { ok: true, status: result.clearanceStatus === "CLEARED" ? "CLEARED" : "REPORTED", message: "Accepted by ZATCA.", documentId: row.id };
}
