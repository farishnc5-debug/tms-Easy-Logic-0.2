import Link from "next/link";
import { Plus, Eye, Printer, FileText } from "lucide-react";
import { db } from "@/lib/db";
import { Pill } from "@/components/ui/badge";
import { fmtDate } from "@/lib/format";

export const dynamic = "force-dynamic";

const QUOTE_BADGE: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-600 ring-slate-500/20",
  SENT: "bg-brand-50 text-brand-700 ring-brand-600/20",
  ACCEPTED: "bg-green-50 text-green-700 ring-green-600/20",
  REJECTED: "bg-red-50 text-red-700 ring-red-600/20",
  EXPIRED: "bg-amber-50 text-amber-700 ring-amber-600/20",
};

export default async function QuotationsPage() {
  const quotations = await db.quotation.findMany({
    include: { customer: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Quotations</h2>
          <p className="mt-1 text-sm text-slate-500">
            Create and print professional transport quotations for customer requests.
          </p>
        </div>
        <Link
          href="/quotations/new"
          className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          <Plus size={15} /> New Quotation
        </Link>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                <th className="px-4 py-3">Quotation No.</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Route</th>
                <th className="px-4 py-3">Trip Type</th>
                <th className="px-4 py-3">Amount (excl. VAT)</th>
                <th className="px-4 py-3">Valid Until</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {quotations.map((q) => (
                <tr key={q.id} className="border-b border-slate-50 hover:bg-slate-50/60">
                  <td className="px-4 py-3">
                    <Link href={`/quotations/${q.id}`} className="font-medium text-brand-600 hover:underline">
                      {q.code}
                    </Link>
                    <p className="text-xs text-slate-400">{fmtDate(q.createdAt)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-700">
                      {q.customer?.name ?? q.manualCustomerName ?? "—"}
                      {!q.customer && <span className="ml-1.5 text-[10px] font-medium text-amber-600">(manual)</span>}
                    </p>
                    <p className="text-xs text-slate-400">{q.customer?.company ?? q.manualCustomerCompany}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-slate-700">{q.originName}</p>
                    <p className="text-xs text-slate-400">↓ {q.destinationName}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Pill
                      className={
                        q.tripType === "ROUND_TRIP"
                          ? "bg-purple-50 text-purple-700"
                          : "bg-sky-50 text-sky-700"
                      }
                    >
                      {q.tripType === "ROUND_TRIP" ? "Round Trip (return empty)" : "One Way"}
                    </Pill>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {q.priceAmount.toLocaleString()} {q.currency}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{fmtDate(q.validUntil)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ring-1 ring-inset ${QUOTE_BADGE[q.status] ?? QUOTE_BADGE.DRAFT}`}
                    >
                      {q.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/quotations/${q.id}`}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                        title="View"
                      >
                        <Eye size={15} />
                      </Link>
                      <Link
                        href={`/print/quotation/${q.id}`}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-brand-600"
                        title="Print"
                      >
                        <Printer size={15} />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {quotations.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-14 text-center text-sm text-slate-400">
                    <FileText size={28} className="mx-auto mb-2 text-slate-300" />
                    No quotations yet. Create your first one to send to a customer.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
