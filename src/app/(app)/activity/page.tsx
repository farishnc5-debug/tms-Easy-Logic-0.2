import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { History } from "lucide-react";
import { Pill } from "@/components/ui/badge";
import { fmtDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

const ACTION_STYLES: Record<string, string> = {
  TRIP_STATUS_ADVANCED: "bg-brand-50 text-brand-700",
  TRIP_STATUS_REVERSED: "bg-red-50 text-red-700",
  TRIP_CANCELLED: "bg-red-50 text-red-700",
  TRIP_MONEY_PAID: "bg-emerald-50 text-emerald-700",
  TRIP_MONEY_PAYMENT_REVERSED: "bg-red-50 text-red-700",
  SHIPMENT_DISPATCHED: "bg-brand-50 text-brand-700",
  BOOKING_CANCELLED: "bg-red-50 text-red-700",
  SHIPMENT_DELETED: "bg-red-100 text-red-800",
  ORIGINALS_RECEIVED_IN_YARD: "bg-cyan-50 text-cyan-700",
  ORIGINALS_HANDED_TO_ACCOUNTS: "bg-violet-50 text-violet-700",
  INVOICE_ISSUED: "bg-amber-50 text-amber-700",
  PAYMENT_RECEIVED_CLOSED: "bg-green-50 text-green-700",
  SETTLEMENT_STEP_REVERSED: "bg-red-50 text-red-700",
};

function prettyAction(a: string) {
  return a
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/^./, (c) => c.toUpperCase());
}

function DiffBlock({ label, json }: { label: string; json: string | null }) {
  if (!json) return null;
  let entries: [string, unknown][] = [];
  try {
    entries = Object.entries(JSON.parse(json));
  } catch {
    return null;
  }
  if (entries.length === 0) return null;
  return (
    <span className="text-xs text-slate-500">
      <span className="font-medium text-slate-400">{label}: </span>
      {entries.map(([k, v], i) => (
        <span key={k}>
          {i > 0 && ", "}
          {k}=<span className="font-medium text-slate-600">{String(v ?? "—")}</span>
        </span>
      ))}
    </span>
  );
}

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const action = typeof sp.action === "string" ? sp.action : "";

  const where: Prisma.AuditLogWhereInput = {};
  if (action) where.action = action;
  if (q) {
    where.OR = [
      { entityRef: { contains: q } },
      { userName: { contains: q } },
      { entityId: { contains: q } },
    ];
  }

  const [logs, actions] = await Promise.all([
    db.auditLog.findMany({ where, orderBy: { createdAt: "desc" }, take: 200 }),
    db.auditLog.findMany({ select: { action: true }, distinct: ["action"] }),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <History size={18} className="text-slate-500" />
        <p className="text-sm text-slate-500">
          Every status change, correction and money event is recorded here permanently — who did
          it, when, and what the values were before and after. Corrections never erase history.
        </p>
      </div>

      <form className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by trip/shipment/invoice code or user..."
          className="w-64 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400"
        />
        <select
          name="action"
          defaultValue={action}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400"
        >
          <option value="">All actions</option>
          {actions.map((a) => (
            <option key={a.action} value={a.action}>
              {prettyAction(a.action)}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          Filter
        </button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Record</th>
              <th className="px-4 py-3">Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b border-slate-50 align-top hover:bg-slate-50/50">
                <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                  {fmtDateTime(log.createdAt)}
                </td>
                <td className="px-4 py-3 font-medium text-slate-700">{log.userName}</td>
                <td className="px-4 py-3">
                  <Pill className={ACTION_STYLES[log.action] ?? "bg-slate-100 text-slate-600"}>
                    {prettyAction(log.action)}
                  </Pill>
                </td>
                <td className="px-4 py-3">
                  <span className="font-medium text-slate-800">{log.entityRef ?? log.entityId.slice(0, 10)}</span>
                  <span className="block text-xs text-slate-400">{log.entity}</span>
                </td>
                <td className="max-w-md px-4 py-3">
                  <div className="flex flex-col gap-0.5">
                    <DiffBlock label="Before" json={log.before} />
                    <DiffBlock label="After" json={log.after} />
                    {log.reason && (
                      <span className="text-xs italic text-amber-700">Reason: {log.reason}</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-400">
                  No activity recorded yet{q || action ? " for this filter" : ""}.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
