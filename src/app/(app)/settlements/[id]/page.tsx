import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Printer,
  Inbox,
  Landmark,
  BadgeDollarSign,
  Undo2,
  Banknote,
  FileText,
} from "lucide-react";
import { db } from "@/lib/db";
import SettlementStepper from "@/components/settlements/settlement-stepper";
import ChargesEditor from "@/components/settlements/charges-editor";
import { StatusBadge, Pill } from "@/components/ui/badge";
import ConfirmSubmitButton from "@/components/ui/confirm-submit-button";
import {
  receiveOriginals,
  handToAccounts,
  issueInvoice,
  markSettlementPaid,
  reopenSettlementStep,
} from "@/lib/actions/settlements";
import { fmtDate, fmtDateTime } from "@/lib/format";
import { settlementStageOf, SETTLEMENT_STATUS_LABELS } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function SettlementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params; // shipment id

  const shipment = await db.shipment.findUnique({
    where: { id },
    include: {
      customer: true,
      trip: { include: { driver: true } },
      settlement: { include: { invoice: true } },
    },
  });
  if (!shipment) notFound();
  if (shipment.status !== "DELIVERED" && !shipment.settlement) {
    // follow-up only exists after delivery
    notFound();
  }

  const st = shipment.settlement;
  const stage = st ? settlementStageOf(st.status) : 1;
  const terms = st?.paymentTerms ?? shipment.customer.paymentTerms;
  const creditDays = st?.creditDays ?? shipment.customer.creditDays;
  const trip = shipment.trip;

  const receiveAction = receiveOriginals.bind(null, id);
  const accountsAction = handToAccounts.bind(null, id);
  const paidAction = markSettlementPaid.bind(null, id);
  const undoAction = reopenSettlementStep.bind(null, id);


  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/settlements"
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft size={15} /> Back to Payment Follow-up
        </Link>
        <div className="flex items-center gap-2">
          {st?.invoice && (
            <Link
              href={`/print/invoice/${st.invoice.id}`}
              className="flex items-center gap-1.5 rounded-lg bg-[#0b1b3a] px-3.5 py-2 text-sm font-medium text-white hover:bg-[#132a54]"
            >
              <Printer size={14} /> Print Invoice {st.invoice.code}
            </Link>
          )}
          {st && stage > 1 && st.status !== "PAID" && (
            <form action={undoAction}>
              <ConfirmSubmitButton
                message="Go one step back in the follow-up? (Invoices are deleted when undoing the invoiced step.)"
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-500 hover:bg-slate-50"
              >
                <Undo2 size={14} /> Undo Step
              </ConfirmSubmitButton>
            </form>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-2xl font-bold text-slate-900">{shipment.code}</h2>
        <StatusBadge status={shipment.status} />
        <Pill
          className={
            terms === "CREDIT" ? "bg-violet-50 text-violet-700" : "bg-emerald-50 text-emerald-700"
          }
        >
          {terms === "CREDIT" ? `Credit — ${creditDays ?? "?"} days` : "Cash — due on receipt"}
        </Pill>
        {st && (
          <Pill className="bg-slate-100 text-slate-600">
            {SETTLEMENT_STATUS_LABELS[st.status]}
          </Pill>
        )}
      </div>

      <SettlementStepper
        currentStage={stage}
        timestamps={{
          deliveredAt: trip?.deliveredAt ?? null,
          docsReceivedAt: st?.docsReceivedAt ?? null,
          handedToAccountsAt: st?.handedToAccountsAt ?? null,
          invoicedAt: st?.invoicedAt ?? null,
          paidAt: st?.paidAt ?? null,
        }}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Stage action card */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="mb-3 text-xs font-semibold tracking-widest text-slate-400">
              NEXT ACTION
            </p>

            {(!st || st.status === "DOCS_WITH_DRIVER") && (
              <div className="space-y-3">
                <p className="text-sm text-slate-600">
                  The signed original delivery documents (POD) are still with the driver
                  {trip?.driver?.name || trip?.manualDriverName
                    ? ` (${trip?.driver?.name ?? trip?.manualDriverName})`
                    : ""}
                  . When the driver hands them to the yard supervisor / dispatcher, confirm receipt
                  below — this also releases the driver&apos;s trip money.
                </p>
                <form action={receiveAction}>
                  <button
                    type="submit"
                    className="flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
                  >
                    <Inbox size={15} /> Confirm Originals Received in Yard
                  </button>
                </form>
              </div>
            )}

            {st?.status === "DOCS_IN_YARD" && (
              <div className="space-y-3">
                <p className="text-sm text-slate-600">
                  Originals received in yard on {fmtDateTime(st.docsReceivedAt)}. Trip money is now
                  released for payment. Next: hand the documents over to the accounts department.
                </p>
                <form action={accountsAction}>
                  <button
                    type="submit"
                    className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
                  >
                    <Landmark size={15} /> Hand Over to Accounts Department
                  </button>
                </form>
              </div>
            )}

            {st?.status === "WITH_ACCOUNTS" && (
              <div className="space-y-4">
                <p className="text-sm text-slate-600">
                  Accounts holds the originals (since {fmtDateTime(st.handedToAccountsAt)}). Issue
                  the invoice — it will be sent to the customer together with the original
                  documents. Due date is set automatically from the agreed terms:{" "}
                  <span className="font-medium">
                    {terms === "CREDIT"
                      ? `${creditDays ?? "?"} days credit`
                      : "cash — payable the same day"}
                  </span>
                  .
                </p>
                <form action={issueInvoice} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <input type="hidden" name="shipmentId" value={id} />
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">
                      Freight Amount (SAR, excl. VAT)
                    </label>
                    <input
                      type="number"
                      name="amount"
                      required
                      min={1}
                      step="0.01"
                      defaultValue={shipment.agreedRate ?? ""}
                      placeholder="e.g. 4500"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400"
                    />
                    {shipment.agreedRate != null && (
                      <p className="mt-1 text-[11px] text-emerald-600">
                        Pre-filled from the customer&apos;s agreed lane rate.
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">VAT %</label>
                    <input
                      type="number"
                      name="vatPct"
                      min={0}
                      step="0.1"
                      defaultValue={15}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400"
                    />
                  </div>
                  <ChargesEditor />
                  <div className="sm:col-span-2">
                    <input
                      name="notes"
                      placeholder="Optional invoice note (e.g. PO reference, contract no.)"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
                    >
                      <FileText size={15} /> Issue Invoice & Print
                    </button>
                  </div>
                </form>
              </div>
            )}

            {st?.status === "INVOICED" && (
              <div className="space-y-3">
                <p className="text-sm text-slate-600">
                  Invoice <span className="font-medium">{st.invoice?.code}</span> issued on{" "}
                  {fmtDate(st.invoicedAt)} and sent with the originals. Payment due{" "}
                  <span
                    className={
                      st.paymentDueAt && st.paymentDueAt.getTime() < Date.now()
                        ? "font-semibold text-red-600"
                        : "font-medium"
                    }
                  >
                    {fmtDate(st.paymentDueAt)}
                  </span>{" "}
                  ({terms === "CREDIT" ? `${creditDays} days credit` : "cash on receipt"}). Follow
                  up with the customer until payment is collected.
                </p>
                <form action={paidAction}>
                  <ConfirmSubmitButton
                    message="Confirm the customer's payment was received? This closes the shipment as PAID."
                    className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                  >
                    <BadgeDollarSign size={15} /> Payment Received — Close as Paid
                  </ConfirmSubmitButton>
                </form>
              </div>
            )}

            {st?.status === "PAID" && (
              <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800 ring-1 ring-green-600/20">
                <span className="font-semibold">Shipment closed as PAID</span> on{" "}
                {fmtDateTime(st.paidAt)} by the accounts department. Invoice {st.invoice?.code} —
                settled.
              </div>
            )}
          </div>

          {/* Trip money status */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold tracking-widest text-slate-400">
              <Banknote size={14} /> DRIVER TRIP MONEY
            </p>
            {trip?.driverAllowance != null ? (
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-700">
                  {trip.driverAllowance.toLocaleString()} SAR —{" "}
                  {trip.allowancePaid ? (
                    <span className="font-medium text-green-700">
                      PAID {trip.allowancePaidAt ? `on ${fmtDate(trip.allowancePaidAt)}` : ""}
                    </span>
                  ) : st?.docsReceivedAt ? (
                    <span className="font-medium text-amber-600">
                      RELEASED — not yet paid to driver
                    </span>
                  ) : (
                    <span className="font-medium text-red-600">
                      LOCKED until originals are received
                    </span>
                  )}
                </span>
                {trip && (
                  <Link
                    href={`/trips/${trip.id}`}
                    className="text-xs font-medium text-brand-600 hover:underline"
                  >
                    Open trip →
                  </Link>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-400">No trip allowance recorded for this trip.</p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="mb-3 text-xs font-semibold tracking-widest text-slate-400">CUSTOMER</p>
            <p className="font-medium text-slate-800">{shipment.customer.name}</p>
            {shipment.customer.nameAr && (
              <p className="text-sm text-slate-600" dir="rtl">
                {shipment.customer.nameAr}
              </p>
            )}
            {shipment.customer.contactPerson && (
              <p className="mt-1 text-xs text-slate-500">
                Contact: {shipment.customer.contactPerson}
              </p>
            )}
            <p className="text-xs text-slate-500">{shipment.customer.phone}</p>
            <div className="mt-2 space-y-0.5 text-xs text-slate-500">
              {shipment.customer.crNumber && <p>CR: {shipment.customer.crNumber}</p>}
              {shipment.customer.vatNumber && <p>VAT: {shipment.customer.vatNumber}</p>}
            </div>
            <Link
              href={`/customers/${shipment.customer.id}`}
              className="mt-2 inline-block text-xs font-medium text-brand-600 hover:underline"
            >
              View customer →
            </Link>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="mb-3 text-xs font-semibold tracking-widest text-slate-400">SHIPMENT</p>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-400">Route</dt>
                <dd className="font-medium text-slate-700">
                  {shipment.originName} → {shipment.destinationName}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">Trip</dt>
                <dd className="font-medium text-slate-700">{trip?.code ?? "-"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">Delivered</dt>
                <dd className="font-medium text-slate-700">{fmtDate(trip?.deliveredAt)}</dd>
              </div>
              {st?.invoice && (
                <>
                  <div className="flex justify-between">
                    <dt className="text-slate-400">Invoice Amount</dt>
                    <dd className="font-medium text-slate-700">
                      {(st.invoice.amount * (1 + st.invoice.vatPct / 100)).toLocaleString(
                        undefined,
                        { minimumFractionDigits: 2 },
                      )}{" "}
                      {st.invoice.currency} (incl. VAT)
                    </dd>
                  </div>
                </>
              )}
            </dl>
            <Link
              href={`/shipments/${shipment.id}`}
              className="mt-2 inline-block text-xs font-medium text-brand-600 hover:underline"
            >
              View shipment →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
