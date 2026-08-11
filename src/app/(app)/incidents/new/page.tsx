import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/db";
import { createIncident } from "@/lib/actions/incidents";
import { INCIDENT_SEVERITIES } from "@/lib/constants";

export default async function NewIncidentPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const defaultTripId = typeof sp.tripId === "string" ? sp.tripId : "";

  const trips = await db.trip.findMany({
    where: { status: { in: ["DISPATCHED", "COLLECTING", "IN_TRANSIT", "AT_DELIVERY", "DELAYED"] } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link href="/incidents" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft size={15} /> Back to Incidents
      </Link>
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-1 text-lg font-semibold text-slate-900">Report Incident</h2>
        <p className="mb-5 text-sm text-slate-500">Log an issue affecting a trip or general operations.</p>
        <form action={createIncident} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Title</label>
            <input
              name="title"
              required
              placeholder="e.g. Traffic congestion on route"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Description</label>
            <textarea
              name="description"
              required
              rows={4}
              placeholder="Describe what happened..."
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Severity</label>
              <select
                name="severity"
                defaultValue="MEDIUM"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400"
              >
                {INCIDENT_SEVERITIES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Related Trip</label>
              <select
                name="tripId"
                defaultValue={defaultTripId}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400"
              >
                <option value="">None</option>
                {trips.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.code} · {t.originName} → {t.destinationName}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <Link href="/incidents" className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
              Cancel
            </Link>
            <button type="submit" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
              Report Incident
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
