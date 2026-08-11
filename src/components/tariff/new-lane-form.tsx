"use client";

import { useState, useTransition } from "react";
import { Plus, X } from "lucide-react";
import { saveLane } from "@/lib/actions/tariff";
import { SAUDI_CITIES } from "@/lib/constants";

const CITY_OPTIONS = Object.keys(SAUDI_CITIES);

export default function NewLaneForm({
  vendors,
  vehicleTypes,
  defaultVendorId,
}: {
  vendors: { id: string; name: string }[];
  vehicleTypes: { code: string; label: string }[];
  defaultVendorId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const input =
    "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400";

  if (vendors.length === 0) return null;

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
      >
        <Plus size={15} /> Add lane to tariff book
      </button>
    );
  }

  return (
    <form
      action={(fd) =>
        startTransition(async () => {
          await saveLane(fd);
          setOpen(false);
        })
      }
      className="rounded-xl border border-slate-200 bg-white p-4"
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold tracking-widest text-slate-400">ADD LANE</p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
        >
          <X size={15} />
        </button>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <label className="text-xs font-medium text-slate-600">
          Vendor
          <select name="vendorId" required defaultValue={defaultVendorId ?? ""} className={input}>
            <option value="" disabled>
              Select vendor
            </option>
            {vendors.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-medium text-slate-600">
          From (origin)
          <input name="originCity" list="lane-cities" required className={input} />
        </label>
        <label className="text-xs font-medium text-slate-600">
          To (destination)
          <input name="destinationCity" list="lane-cities" required className={input} />
        </label>
        <label className="text-xs font-medium text-slate-600">
          Vehicle / equipment type
          <select name="vehicleType" required defaultValue="" className={input}>
            <option value="" disabled>
              Select type
            </option>
            {vehicleTypes.map((v) => (
              <option key={v.code} value={v.code}>
                {v.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-medium text-slate-600">
          Carrier cost (SAR)
          <input name="carrierCost" type="number" min={0} step="0.01" required className={input} />
        </label>
        <label className="text-xs font-medium text-slate-600">
          Selling price (SAR)
          <input name="sellingPrice" type="number" min={0} step="0.01" className={input} />
        </label>
        <label className="text-xs font-medium text-slate-600">
          Distance (km)
          <input name="distanceKm" type="number" min={0} className={input} />
        </label>
        <label className="text-xs font-medium text-slate-600">
          Notes
          <input name="notes" className={input} />
        </label>
      </div>
      <datalist id="lane-cities">
        {CITY_OPTIONS.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>
      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
        <label className="flex items-center gap-2 text-xs font-medium text-emerald-700">
          <input type="checkbox" name="isActual" />
          This is an actual negotiated rate (not an estimate)
        </label>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {pending ? "Saving…" : "Add lane"}
        </button>
      </div>
    </form>
  );
}
