import Link from "next/link";
import { BadgeCheck, Clock, Plus } from "lucide-react";
import { db } from "@/lib/db";
import StatCard from "@/components/dashboard/stat-card";
import { Avatar } from "@/components/ui/avatar";
import { fmtDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PodPage() {
  const [awaitingPod, completedPods] = await Promise.all([
    db.shipment.findMany({
      where: { status: "AT_DELIVERY", pod: null },
      include: { customer: true },
      orderBy: { updatedAt: "desc" },
    }),
    db.proofOfDelivery.findMany({
      include: { shipment: { include: { customer: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-2">
        <StatCard icon={Clock} label="Pending POD" value={awaitingPod.length} color="#f59e0b" />
        <StatCard icon={BadgeCheck} label="Completed PODs" value={completedPods.length} color="#16a34a" />
      </div>

      <div className="card p-5">
        <p className="mb-3 text-xs font-semibold tracking-widest text-slate-400">
          AWAITING PROOF OF DELIVERY
        </p>
        {awaitingPod.length === 0 ? (
          <p className="text-sm text-slate-400">No deliveries pending confirmation.</p>
        ) : (
          <ul className="space-y-2">
            {awaitingPod.map((s) => (
              <li key={s.id} className="flex items-center justify-between rounded-lg border border-slate-100 p-3">
                <div className="flex items-center gap-2">
                  <Avatar name={s.customer.name} size={28} />
                  <div>
                    <p className="text-sm font-medium text-slate-700">{s.code}</p>
                    <p className="text-xs text-slate-400">{s.customer.name} · {s.destinationName}</p>
                  </div>
                </div>
                <Link
                  href={`/pod/new?shipmentId=${s.id}`}
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
                >
                  <Plus size={13} /> Upload POD
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card p-5">
        <p className="mb-3 text-xs font-semibold tracking-widest text-slate-400">RECENT PODs</p>
        {completedPods.length === 0 ? (
          <p className="text-sm text-slate-400">No proof of delivery records yet.</p>
        ) : (
          <ul className="space-y-2">
            {completedPods.map((p) => (
              <li key={p.id} className="flex items-center justify-between rounded-lg border border-slate-100 p-3">
                <div>
                  <Link href={`/shipments/${p.shipmentId}`} className="text-sm font-medium text-brand-600 hover:underline">
                    {p.shipment.code}
                  </Link>
                  <p className="text-xs text-slate-400">
                    Received by {p.receivedBy} · {p.shipment.customer.name}
                  </p>
                </div>
                <span className="text-xs text-slate-400">{fmtDateTime(p.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
