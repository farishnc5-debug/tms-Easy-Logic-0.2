"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import LiveMap from "@/components/map/live-map";
import { StatusBadge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import ProgressBar from "@/components/trips/progress-bar";
import { fmtDateTime } from "@/lib/format";
import type { TripRow } from "@/components/trips/trips-board";

export interface GPSLocation {
  id: string;
  vehicleId: string;
  plateNumber: string;
  vehicleType: string;
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  timestamp: Date;
}

export default function MapTrackingBoard({
  trips,
  gpsLocations = [],
}: {
  trips: TripRow[];
  gpsLocations?: GPSLocation[];
}) {
  const [selectedId, setSelectedId] = useState<string | null>(trips[0]?.id ?? null);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return trips;
    return trips.filter(
      (t) =>
        t.code.toLowerCase().includes(q) ||
        t.driverName?.toLowerCase().includes(q) ||
        t.originName.toLowerCase().includes(q) ||
        t.destinationName.toLowerCase().includes(q),
    );
  }, [trips, query]);

  const selected = useMemo(() => trips.find((t) => t.id === selectedId) ?? null, [trips, selectedId]);

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
      <div className="card p-3 xl:col-span-1">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search trips..."
          className="mb-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400"
        />
        <div className="max-h-[600px] space-y-1.5 overflow-y-auto">
          {filtered.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedId(t.id)}
              className={`w-full rounded-lg border p-2.5 text-left transition ${
                selectedId === t.id
                  ? "border-brand-300 bg-brand-50"
                  : "border-transparent hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-800">{t.code}</span>
                <StatusBadge status={t.status} />
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {t.originName} → {t.destinationName}
              </p>
              <div className="mt-1.5 flex items-center gap-2">
                {t.driverName && <Avatar name={t.driverName} size={18} />}
                <span className="text-xs text-slate-400">{t.driverName ?? "Unassigned"}</span>
              </div>
              <div className="mt-1.5">
                <ProgressBar pct={t.progressPct} delayed={t.status === "DELAYED"} />
              </div>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="py-8 text-center text-sm text-slate-400">No trips found.</p>
          )}
        </div>
      </div>

      <div className="space-y-4 xl:col-span-3">
        <div className="card p-4">
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
            gpsLocations={gpsLocations.map((g) => ({
              vehicleId: g.vehicleId,
              plateNumber: g.plateNumber,
              latitude: g.latitude,
              longitude: g.longitude,
              speed: g.speed,
              heading: g.heading,
            }))}
            selectedTripId={selectedId ?? undefined}
            onSelectTrip={setSelectedId}
            height={520}
          />
        </div>

        {selected && (
          <div className="card p-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-lg font-bold text-slate-900">{selected.code}</p>
              <StatusBadge status={selected.status} />
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Info label="Driver" value={selected.driverName ?? "Unassigned"} />
              <Info label="Vehicle" value={selected.vehiclePlate ?? "-"} />
              <Info label="Route" value={`${selected.originName} → ${selected.destinationName}`} />
              <Info label="ETA" value={fmtDateTime(selected.etaAt)} />
            </div>
            <Link
              href={`/trips/${selected.id}`}
              className="mt-4 inline-block text-xs font-medium text-brand-600 hover:underline"
            >
              View full trip details →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-slate-700">{value}</p>
    </div>
  );
}
