import Link from "next/link";
import { AlertTriangle, AlertOctagon, CheckCircle2, Plus } from "lucide-react";
import { db } from "@/lib/db";
import StatCard from "@/components/dashboard/stat-card";
import { StatusBadge } from "@/components/ui/badge";
import IncidentStatusToggle from "@/components/incidents/incident-status-toggle";
import { timeAgo } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function IncidentsPage() {
  const incidents = await db.incident.findMany({
    include: { trip: true, reportedBy: true },
    orderBy: { createdAt: "desc" },
  });

  const open = incidents.filter((i) => i.status === "OPEN").length;
  const critical = incidents.filter((i) => i.severity === "CRITICAL" || i.severity === "HIGH").length;
  const resolved = incidents.filter((i) => i.status === "RESOLVED").length;

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Link
          href="/incidents/new"
          className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          <Plus size={15} /> Report Incident
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <StatCard icon={AlertTriangle} label="Open Incidents" value={open} color="#f59e0b" />
        <StatCard icon={AlertOctagon} label="High / Critical" value={critical} color="#ef4444" />
        <StatCard icon={CheckCircle2} label="Resolved" value={resolved} color="#16a34a" />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                <th className="px-4 py-3">Incident</th>
                <th className="px-4 py-3">Trip</th>
                <th className="px-4 py-3">Severity</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Reported</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {incidents.map((inc) => (
                <tr key={inc.id} className="border-b border-slate-50 hover:bg-slate-50/60">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">{inc.title}</p>
                    <p className="max-w-md text-xs text-slate-400">{inc.description}</p>
                  </td>
                  <td className="px-4 py-3">
                    {inc.trip ? (
                      <Link href={`/trips/${inc.trip.id}`} className="text-brand-600 hover:underline">
                        {inc.trip.code}
                      </Link>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={inc.severity} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={inc.status} />
                  </td>
                  <td className="px-4 py-3 text-slate-500">{timeAgo(inc.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      <IncidentStatusToggle id={inc.id} status={inc.status} />
                    </div>
                  </td>
                </tr>
              ))}
              {incidents.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-400">
                    No incidents reported.
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
