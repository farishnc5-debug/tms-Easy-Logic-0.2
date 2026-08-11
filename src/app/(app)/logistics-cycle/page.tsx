import Link from "next/link";
import { db } from "@/lib/db";
import { ROUND_TRIP_CYCLE_STAGES } from "@/lib/constants";
import { Pill } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function LogisticsCyclePage() {
  const shipments = await db.shipment.findMany({
    where: { status: { notIn: ["CANCELLED"] } },
    include: { customer: true },
    orderBy: { updatedAt: "desc" },
  });

  // All 9 stages — one-way shipments occupy 1-6, round trips continue through 7-9
  const columns = ROUND_TRIP_CYCLE_STAGES.map((stage) => ({
    ...stage,
    items: shipments.filter((s) => s.cycleStage === stage.stage),
  }));

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">
        Shipments grouped by their current logistics cycle stage. Click a shipment to update its
        status.
      </p>
      <div className="grid grid-cols-1 gap-4 overflow-x-auto md:grid-cols-3 xl:grid-cols-6">
        {columns.map((col) => (
          <div key={col.stage} className="min-w-[220px] rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="mb-3 flex items-center justify-between px-1">
              <p className="text-xs font-semibold text-slate-600">
                {col.stage}. {col.label}
              </p>
              <span className="text-xs text-slate-400">{col.items.length}</span>
            </div>
            <div className="space-y-2">
              {col.items.map((s) => (
                <Link
                  key={s.id}
                  href={`/shipments/${s.id}`}
                  className="block rounded-lg border border-slate-200 bg-white p-2.5 hover:shadow-sm"
                >
                  <p className="text-xs font-medium text-brand-600">{s.code}</p>
                  <p className="mt-0.5 truncate text-xs text-slate-600">{s.customer.name}</p>
                  <p className="truncate text-[11px] text-slate-400">
                    {s.originName} → {s.destinationName}
                  </p>
                  {s.status === "DELAYED" && (
                    <Pill className="mt-1 bg-red-50 text-red-600">Delayed</Pill>
                  )}
                </Link>
              ))}
              {col.items.length === 0 && (
                <p className="px-1 py-6 text-center text-xs text-slate-400">Empty</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
