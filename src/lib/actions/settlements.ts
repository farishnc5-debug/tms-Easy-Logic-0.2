"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { genCode } from "@/lib/constants";
import { logAudit } from "@/lib/audit";

function revalidateSettlement(shipmentId: string) {
  revalidatePath("/settlements");
  revalidatePath(`/settlements/${shipmentId}`);
  revalidatePath(`/shipments/${shipmentId}`);
}

// Settlements are created lazily for delivered shipments, snapshotting the
// customer's agreed payment terms at that moment.
export async function ensureSettlement(shipmentId: string) {
  const existing = await db.settlement.findUnique({ where: { shipmentId } });
  if (existing) return existing;
  const shipment = await db.shipment.findUniqueOrThrow({
    where: { id: shipmentId },
    include: { customer: true },
  });
  return db.settlement.create({
    data: {
      shipmentId,
      status: "DOCS_WITH_DRIVER",
      paymentTerms: shipment.customer.paymentTerms,
      creditDays: shipment.customer.creditDays,
    },
  });
}

// Yard supervisor / dispatcher confirms the driver returned the signed
// originals. This is the gate that releases the driver's trip money.
export async function receiveOriginals(shipmentId: string) {
  const settlement = await ensureSettlement(shipmentId);
  await db.settlement.update({
    where: { id: settlement.id },
    data: { status: "DOCS_IN_YARD", docsReceivedAt: new Date() },
  });

  // The driver is back in the yard, so he has left the delivery side — this
  // completes stage 6 of the one-way cycle (round trips complete it when the
  // empty-return leg starts).
  const shipment = await db.shipment.findUnique({
    where: { id: shipmentId },
    include: { trip: true },
  });
  if (shipment?.tripType !== "ROUND_TRIP") {
    if (shipment?.trip && !shipment.trip.leftDeliveryAt) {
      await db.trip.update({
        where: { id: shipment.trip.id },
        data: { leftDeliveryAt: new Date() },
      });
    }
    if (shipment && shipment.cycleStage === 5) {
      await db.shipment.update({ where: { id: shipmentId }, data: { cycleStage: 6 } });
    }
  }

  await logAudit({
    action: "ORIGINALS_RECEIVED_IN_YARD",
    entity: "Settlement",
    entityId: settlement.id,
    entityRef: shipmentId,
    before: { status: settlement.status },
    after: { status: "DOCS_IN_YARD" },
  });
  revalidateSettlement(shipmentId);
}

export async function handToAccounts(shipmentId: string) {
  const settlement = await db.settlement.findUniqueOrThrow({ where: { shipmentId } });
  if (!settlement.docsReceivedAt) {
    throw new Error("Originals must be received in the yard first.");
  }
  await db.settlement.update({
    where: { id: settlement.id },
    data: { status: "WITH_ACCOUNTS", handedToAccountsAt: new Date() },
  });
  await logAudit({
    action: "ORIGINALS_HANDED_TO_ACCOUNTS",
    entity: "Settlement",
    entityId: settlement.id,
    entityRef: shipmentId,
    before: { status: settlement.status },
    after: { status: "WITH_ACCOUNTS" },
  });
  revalidateSettlement(shipmentId);
}

async function nextInvoiceCode() {
  const rows = await db.invoice.findMany({ select: { code: true } });
  let max = 0;
  for (const { code } of rows) {
    const m = code.match(/(\d+)$/);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return genCode("INV", max + 1, 5);
}

export async function issueInvoice(formData: FormData) {
  const shipmentId = String(formData.get("shipmentId") ?? "");
  const amount = Number(formData.get("amount") ?? 0);
  const vatPct = formData.get("vatPct") !== null && formData.get("vatPct") !== ""
    ? Number(formData.get("vatPct"))
    : 15;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!shipmentId || !amount || amount <= 0) {
    throw new Error("A positive invoice amount is required.");
  }

  // Additional charge lines (waiting time, detention, ...) from the editor
  let charges: { description: string; amount: number }[] = [];
  const chargesRaw = String(formData.get("chargesJson") ?? "").trim();
  if (chargesRaw) {
    try {
      charges = (JSON.parse(chargesRaw) as { description?: string; amount?: string | number }[])
        .map((c) => ({ description: String(c.description ?? "").trim(), amount: Number(c.amount) }))
        .filter((c) => c.description && c.amount > 0);
    } catch {
      charges = [];
    }
  }

  const settlement = await db.settlement.findUniqueOrThrow({ where: { shipmentId } });
  if (!settlement.handedToAccountsAt) {
    throw new Error("Originals must be handed to accounts before invoicing.");
  }
  if (settlement.invoicedAt) {
    throw new Error("An invoice was already issued for this shipment.");
  }

  const now = new Date();
  // CASH: due same day the originals + invoice reach the customer.
  // CREDIT: due after the agreed credit period.
  const dueAt =
    settlement.paymentTerms === "CREDIT" && settlement.creditDays
      ? new Date(now.getTime() + settlement.creditDays * 86400000)
      : now;

  const invoice = await db.invoice.create({
    data: {
      code: await nextInvoiceCode(),
      settlementId: settlement.id,
      amount,
      vatPct,
      dueAt,
      notes,
      charges: { create: charges },
    },
  });

  await db.settlement.update({
    where: { id: settlement.id },
    data: { status: "INVOICED", invoicedAt: now, paymentDueAt: dueAt },
  });

  await logAudit({
    action: "INVOICE_ISSUED",
    entity: "Invoice",
    entityId: invoice.id,
    entityRef: invoice.code,
    after: {
      amount,
      vatPct,
      charges: charges.length,
      chargesTotal: charges.reduce((s, c) => s + c.amount, 0),
      dueAt: dueAt.toISOString(),
      shipmentId,
    },
  });

  revalidateSettlement(shipmentId);
  redirect(`/print/invoice/${invoice.id}`);
}

// Accounts department records the customer's payment and closes the shipment.
export async function markSettlementPaid(shipmentId: string) {
  const settlement = await db.settlement.findUniqueOrThrow({ where: { shipmentId } });
  if (!settlement.invoicedAt) {
    throw new Error("Issue the invoice before marking the shipment as paid.");
  }
  await db.settlement.update({
    where: { id: settlement.id },
    data: { status: "PAID", paidAt: new Date() },
  });
  await logAudit({
    action: "PAYMENT_RECEIVED_CLOSED",
    entity: "Settlement",
    entityId: settlement.id,
    entityRef: shipmentId,
    before: { status: settlement.status },
    after: { status: "PAID" },
  });
  revalidateSettlement(shipmentId);
}

export async function reopenSettlementStep(shipmentId: string) {
  // one step back for corrections (accounts/yard mis-clicks)
  const s = await db.settlement.findUniqueOrThrow({
    where: { shipmentId },
    include: { invoice: true },
  });
  if (s.status === "PAID") {
    await db.settlement.update({
      where: { id: s.id },
      data: { status: "INVOICED", paidAt: null },
    });
  } else if (s.status === "INVOICED") {
    if (s.invoice) await db.invoice.delete({ where: { id: s.invoice.id } });
    await db.settlement.update({
      where: { id: s.id },
      data: { status: "WITH_ACCOUNTS", invoicedAt: null, paymentDueAt: null },
    });
  } else if (s.status === "WITH_ACCOUNTS") {
    await db.settlement.update({
      where: { id: s.id },
      data: { status: "DOCS_IN_YARD", handedToAccountsAt: null },
    });
  } else if (s.status === "DOCS_IN_YARD") {
    await db.settlement.update({
      where: { id: s.id },
      data: { status: "DOCS_WITH_DRIVER", docsReceivedAt: null },
    });
  }
  await logAudit({
    action: "SETTLEMENT_STEP_REVERSED",
    entity: "Settlement",
    entityId: s.id,
    entityRef: shipmentId,
    before: {
      status: s.status,
      invoiceCode: s.invoice?.code ?? null,
      invoiceAmount: s.invoice?.amount ?? null,
    },
    reason: "Settlement step reversed by operator (correction)",
  });
  revalidateSettlement(shipmentId);
}
