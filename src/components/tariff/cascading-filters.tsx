"use client";

import { useRouter } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";

type VendorOpt = { id: string; name: string; count: number };
type VehicleTypeOpt = { code: string; label: string };

export default function CascadingFilters({
  vendors,
  origins,
  destinations,
  vehicleTypes,
  selected,
}: {
  vendors: VendorOpt[];
  origins: string[];
  destinations: string[];
  vehicleTypes: VehicleTypeOpt[];
  selected: { vendorId: string; origin: string; destination: string; vehicleType: string };
}) {
  const router = useRouter();

  // Changing an upstream dropdown clears every dropdown below it — that is
  // the "cascade": vendor changes reset origin/destination/vehicle, origin
  // changes reset destination/vehicle, etc.
  function go(next: Partial<typeof selected>) {
    const merged = { ...selected, ...next };
    const params = new URLSearchParams();
    if (merged.vendorId) params.set("vendorId", merged.vendorId);
    if (merged.origin) params.set("origin", merged.origin);
    if (merged.destination) params.set("destination", merged.destination);
    if (merged.vehicleType) params.set("vehicleType", merged.vehicleType);
    router.push(`/tariff${params.toString() ? `?${params.toString()}` : ""}`);
  }

  const selectCls =
    "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-400 disabled:bg-slate-50 disabled:text-slate-400";

  const anyFilter = selected.vendorId || selected.origin || selected.destination || selected.vehicleType;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-2 flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-xs font-semibold tracking-widest text-slate-400">
          <SlidersHorizontal size={13} /> FIND A RATE — CHOOSE VENDOR, THEN LANE, THEN EQUIPMENT
        </p>
        {anyFilter && (
          <button
            onClick={() => router.push("/tariff")}
            className="flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-red-500"
          >
            <X size={12} /> Clear all
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
        <label className="text-xs font-medium text-slate-600">
          1. Vendor
          <select
            value={selected.vendorId}
            onChange={(e) => go({ vendorId: e.target.value, origin: "", destination: "", vehicleType: "" })}
            className={selectCls}
          >
            <option value="">All vendors</option>
            {vendors.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} ({v.count})
              </option>
            ))}
          </select>
        </label>

        <label className="text-xs font-medium text-slate-600">
          2. From (origin)
          <select
            value={selected.origin}
            onChange={(e) => go({ origin: e.target.value, destination: "", vehicleType: "" })}
            disabled={origins.length === 0}
            className={selectCls}
          >
            <option value="">All origins</option>
            {origins.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </label>

        <label className="text-xs font-medium text-slate-600">
          3. To (destination)
          <select
            value={selected.destination}
            onChange={(e) => go({ destination: e.target.value, vehicleType: "" })}
            disabled={destinations.length === 0}
            className={selectCls}
          >
            <option value="">All destinations</option>
            {destinations.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>

        <label className="text-xs font-medium text-slate-600">
          4. Vehicle / equipment type
          <select
            value={selected.vehicleType}
            onChange={(e) => go({ vehicleType: e.target.value })}
            disabled={vehicleTypes.length === 0}
            className={selectCls}
          >
            <option value="">All types</option>
            {vehicleTypes.map((v) => (
              <option key={v.code} value={v.code}>
                {v.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
