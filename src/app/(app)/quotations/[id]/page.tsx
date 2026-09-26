import Link from "next/link";
import { totalsOf } from "@/lib/money";
import { notFound } from "next/navigation";
import { ArrowLeft, Printer, Trash2 } from "lucide-react";
import { db } from "@/lib/db";
import { deleteQuotation, updateQuotationStatus } from "@/lib/actions/quotations";
import ConfirmSubmitButton from "@/components/ui/confirm-submit-button";
import { fmtDate } from "@/lib/format";

const QUOTE_BADGE: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-600 ring-slate-500/20",
  SENT: "bg-brand-50 text-brand-700 ring-brand-600/20",
  ACCEPTED: "bg-green-50 text-green-700 ring-green-600/20",
  REJECTED: "bg-red-50 text-red-700 ring-red-600/20",
  EXPIRED: "bg-amber-50 text-amber-700 ring-amber-600/20",
};

export default async function QuotationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const q = await db.quotation.findUnique({ where: { id }, include: { customer: true } });
  if (!q) notFound();

  const { vat: vatAmount, total } = totalsOf(q.priceAmount, q.vatPct);
  const deleteAction = deleteQuotation.bind(null, id);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/quotations" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
          <ArrowLeft size={15} /> Back to Quotations
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href={`/print/quotation/${q.id}`}
            className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            <Printer size={14} /> Print Quotation
          </Link>
          <form action={deleteAction}>
            <ConfirmSubmitButton
              message="Delete this quotation?"
              className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2 text-sm font-medium text-red-600 hover:bg-red-100"
            >
              <Trash2 size={14} /> Delete
            </ConfirmSubmitButton>
          </form>
        </div>
      </div>

      <div className="card p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{q.code}</h2>
            <p className="text-xs text-slate-400">Created {fmtDate(q.createdAt)}</p>
          </div>
          <span
            className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${QUOTE_BADGE[q.status] ?? QUOTE_BADGE.DRAFT}`}
          >
            {q.status}
          </span>
        </div>

        <dl className="grid grid-cols-1 gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
          <div className="flex justify-between border-b border-slate-50 pb-2">
            <dt className="text-slate-400">Customer</dt>
            <dd className="font-medium text-slate-700">
              {q.customer?.name ?? q.manualCustomerName ?? "-"}
              {!q.customer && <span className="ml-1.5 text-[10px] font-medium text-amber-600">(manual entry)</span>}
            </dd>
          </div>
          <div className="flex justify-between border-b border-slate-50 pb-2">
            <dt className="text-slate-400">Company</dt>
            <dd className="font-medium text-slate-700">{q.customer?.company ?? q.manualCustomerCompany ?? "-"}</dd>
          </div>
          <div className="flex justify-between border-b border-slate-50 pb-2">
            <dt className="text-slate-400">Loading Point</dt>
            <dd className="font-medium text-slate-700">{q.originName}</dd>
          </div>
          <div className="flex justify-between border-b border-slate-50 pb-2">
            <dt className="text-slate-400">Destination</dt>
            <dd className="font-medium text-slate-700">{q.destinationName}</dd>
          </div>
          <div className="flex justify-between border-b border-slate-50 pb-2">
            <dt className="text-slate-400">Trip Type</dt>
            <dd className="font-medium text-slate-700">
              {q.tripType === "ROUND_TRIP" ? "Round Trip (return empty)" : "One Way"}
            </dd>
          </div>
          <div className="flex justify-between border-b border-slate-50 pb-2">
            <dt className="text-slate-400">Vehicle Type</dt>
            <dd className="font-medium text-slate-700">{q.vehicleType ?? "-"}</dd>
          </div>
          <div className="flex justify-between border-b border-slate-50 pb-2">
            <dt className="text-slate-400">Cargo</dt>
            <dd className="font-medium text-slate-700">{q.cargoDescription ?? "-"}</dd>
          </div>
          <div className="flex justify-between border-b border-slate-50 pb-2">
            <dt className="text-slate-400">Valid Until</dt>
            <dd className="font-medium text-slate-700">{fmtDate(q.validUntil)}</dd>
          </div>
        </dl>

        <div className="mt-5 rounded-lg bg-slate-50 p-4">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Price (excl. VAT)</span>
            <span className="font-medium text-slate-800">
              {q.priceAmount.toLocaleString()} {q.currency}
            </span>
          </div>
          <div className="mt-1 flex justify-between text-sm">
            <span className="text-slate-500">VAT ({q.vatPct}%)</span>
            <span className="font-medium text-slate-800">
              {vatAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })} {q.currency}
            </span>
          </div>
          <div className="mt-2 flex justify-between border-t border-slate-200 pt-2 text-base font-bold text-slate-900">
            <span>Total</span>
            <span>
              {total.toLocaleString(undefined, { maximumFractionDigits: 2 })} {q.currency}
            </span>
          </div>
        </div>

        {q.notes && (
          <div className="mt-4 rounded-lg border border-slate-100 p-3 text-sm text-slate-600">
            {q.notes}
          </div>
        )}

        <div className="mt-5 border-t border-slate-100 pt-4">
          <p className="mb-2 text-xs font-semibold tracking-widest text-slate-400">SET STATUS</p>
          <div className="flex flex-wrap gap-2">
            {["DRAFT", "SENT", "ACCEPTED", "REJECTED", "EXPIRED"].map((s) => {
              const action = updateQuotationStatus.bind(null, q.id, s);
              return (
                <form key={s} action={action}>
                  <button
                    type="submit"
                    disabled={q.status === s}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${
                      q.status === s
                        ? "border-brand-300 bg-brand-50 text-brand-700"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {s}
                  </button>
                </form>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
