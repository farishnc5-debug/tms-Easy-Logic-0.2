"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Eye, Phone, MoreVertical } from "lucide-react";
import LiveMap from "@/components/map/live-map";
import { StatusBadge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import ProgressBar from "@/components/trips/progress-bar";
import StatusControls from "@/components/trips/status-controls";
import { fmtDateTime } from "@/lib/format";

export type TripRow = {
  id: string;
  code: string;
  shipmentId: string;
  tripType?: string;
  delayedFrom?: string | null;
  shipmentCode: string;
  customerName: string;
  originName: string;
  destinationName: string;
  originX: number;
  originY: number;
  destX: number;
  destY: number;
  currentX: number | null;
  currentY: number | null;
  status: string;
  statusNote: string | null;
  progressPct: number;
  distanceKm: number | null;
  departureAt: string | null;
  etaAt: string | null;
  driverName: string | null;
  driverPhone: string | null;
  vehiclePlate: string | null;
};

export default function TripsBoard({ trips }: { trips: TripRow[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(trips[0]?.id ?? null);
  const selected = useMemo(() => trips.find((t) => t.id === selectedId) ?? null, [trips, selectedId]);

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
      <div className="rounded-xl border border-slate-200 bg-white xl:col-span-2">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                <th className="px-4 py-3">Trip ID</th>
                <th className="px-4 py-3">Route</th>
                <th className="px-4 py-3">Driver / Vehicle</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Progress</th>
                <th className="px-4 py-3">ETA</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {trips.map((t) => (
                <tr
                  key={t.id}
                  onClick={() => setSelectedId(t.id)}
                  className={`cursor-pointer border-b border-slate-50 hover:bg-slate-50/60 ${
                    selectedId === t.id ? "bg-sky-50/70" : ""
                  }`}
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-brand-600">{t.code}</p>
                    <p className="text-xs text-slate-400">{t.shipmentCode}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-slate-700">{t.originName}</p>
                    <p className="text-xs text-slate-400">↓ {t.destinationName}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {t.driverName && <Avatar name={t.driverName} size={22} />}
                      <div>
                        <p className="text-slate-700">{t.driverName ?? "Unassigned"}</p>
                        <p className="text-xs text-slate-400">{t.vehiclePlate ?? "-"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={t.status} />
                    {t.statusNote && <p className="mt-0.5 text-xs text-slate-400">{t.statusNote}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <ProgressBar pct={t.progressPct} delayed={t.status === "DELAYED"} />
                  </td>
                  <td className="px-4 py-3 text-slate-500">{fmtDateTime(t.etaAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/trips/${t.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                        title="View"
                      >
                        <Eye size={15} />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {trips.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-400">
                    No trips match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold tracking-widest text-slate-400">LIVE TRIP MAP</p>
            <Link href="/map-tracking" className="text-xs font-medium text-brand-600 hover:underline">
              View Full Map ↗
            </Link>
          </div>
          <LiveMap
            trips={trips.map((t) => ({
              id: t.id,
              code: t.code,
              originName: t.originName,
              destinationName: t.destinationName,
              originX: t.originX,
              originY: t.originY,
              destX: t.destX,
              destY: t.destY,
              currentX: t.currentX,
              currentY: t.currentY,
              status: t.status,
            }))}
            selectedTripId={selectedId ?? undefined}
            onSelectTrip={setSelectedId}
            height={260}
          />
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold tracking-widest text-slate-400">
              SELECTED TRIP DETAILS
            </p>
            {selected && <StatusBadge status={selected.status} />}
          </div>
          {selected ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-lg font-bold text-slate-900">{selected.code}</p>
                <button
                  className="flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-600"
                  title="Live tracking active"
                >
                  <MoreVertical size={12} /> Track Live
                </button>
              </div>
              <dl className="space-y-2 text-sm">
                <Row label="Shipment ID" value={selected.shipmentCode} />
                <Row label="Customer" value={selected.customerName} />
                <Row label="Driver" value={selected.driverName ?? "Unassigned"} />
                <Row label="Vehicle" value={selected.vehiclePlate ?? "-"} />
                <Row label="Origin" value={selected.originName} />
                <Row label="Destination" value={selected.destinationName} />
                <Row label="Distance" value={selected.distanceKm ? `${selected.distanceKm} KM` : "-"} />
                <Row label="Departure" value={fmtDateTime(selected.departureAt)} />
                <Row label="ETA" value={fmtDateTime(selected.etaAt)} />
              </dl>
              {selected.driverPhone && (
                <a
                  href={`tel:${selected.driverPhone}`}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:underline"
                >
                  <Phone size={13} /> Call driver
                </a>
              )}
              <div className="border-t border-slate-100 pt-3">
                <StatusControls
                  tripId={selected.id}
                  status={selected.status}
                  tripType={selected.tripType}
                  delayedFrom={selected.delayedFrom}
                />
              </div>
              <Link
                href={`/trips/${selected.id}`}
                className="mt-2 flex items-center justify-center gap-1 rounded-lg bg-slate-900 py-2 text-xs font-medium text-white hover:bg-slate-800"
              >
                View Trip Details →
              </Link>
            </div>
          ) : (
            <p className="text-sm text-slate-400">Select a trip to view details.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-slate-400">{label}</dt>
      <dd className="text-right font-medium text-slate-700">{value}</dd>
    </div>
  );
}
