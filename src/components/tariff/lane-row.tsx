"use client";

import { useState, useTransition } from "react";
import { Pencil, Trash2, X, BadgeCheck } from "lucide-react";
import { saveLane, deleteLane } from "@/lib/actions/tariff";
import { Pill } from "@/components/ui/badge";

export type Lane = {
  id: string;
  vendorId: string;
  vendorName: string;
  originCity: string;
  destinationCity: string;
  vehicleType: string;
  carrierCost: number;
  sellingPrice: number | null;
  distanceKm: number | null;
  isActual: boolean;
  notes: string | null;
  updatedAt: string;
};

const money = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 0 });

export default function LaneRow({
  lane,
  vendors,
  vehicleTypes,
}: {
  lane: Lane;
  vendors: { id: string; name: string }[];
  vehicleTypes: { code: string; label: string }[];
}) {
  const vehicleLabel = vehicleTypes.find((v) => v.code === lane.vehicleType)?.label ?? lane.vehicleType;
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();

  const profit = lane.sellingPrice != null ? lane.sellingPrice - lane.carrierCost : null;
  const margin =
    lane.sellingPrice != null && lane.sellingPrice > 0
      ? (profit! / lane.sellingPrice) * 100
      : null;
  const suggested = Math.round((lane.carrierCost / 0.75) / 10) * 10;
  const perKm = lane.distanceKm ? lane.carrierCost / lane.distanceKm : null;

  const cell = "px-4 py-2.5";
  const input =
    "w-full rounded-md border border-slate-200 px-2 py-1 text-sm outline-none focus:border-sky-400";

  if (editing) {
    return (
      <tr className="border-b border-slate-100 bg-brand-50/40">
        <td colSpan={11} className="px-4 py-3">
          <form
            action={(fd) =>
              startTransition(async () => {
                await saveLane(fd);
                setEditing(false);
              })
            }
            className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8"
          >
            <input type="hidden" name="id" value={lane.id} />
            <label className="text-xs text-slate-500">
              Vendor
              <select name="vendorId" defaultValue={lane.vendorId} required className={input}>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs text-slate-500">
              From
              <input name="originCity" required defaultValue={lane.originCity} className={input} />
            </label>
            <label className="text-xs text-slate-500">
              To
              <input
                name="destinationCity"
                required
                defaultValue={lane.destinationCity}
                className={input}
              />
            </label>
            <label className="text-xs text-slate-500">
              Vehicle type
              <select name="vehicleType" defaultValue={lane.vehicleType} required className={input}>
                {vehicleTypes.map((v) => (
                  <option key={v.code} value={v.code}>
                    {v.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs text-slate-500">
              Carrier cost
              <input
                name="carrierCost"
                type="number"
                min={0}
                step="0.01"
                required
                defaultValue={lane.carrierCost}
                className={input}
              />
            </label>
            <label className="text-xs text-slate-500">
              Selling price
              <input
                name="sellingPrice"
                type="number"
                min={0}
                step="0.01"
                defaultValue={lane.sellingPrice ?? ""}
                placeholder={String(suggested)}
                className={input}
              />
            </label>
            <label className="text-xs text-slate-500">
              Distance km
              <input
                name="distanceKm"
                type="number"
                min={0}
                defaultValue={lane.distanceKm ?? ""}
                className={input}
              />
            </label>
            <label className="text-xs text-slate-500">
              Notes
              <input name="notes" defaultValue={lane.notes ?? ""} className={input} />
            </label>
            <label className="col-span-2 flex items-center gap-2 pt-4 text-xs font-medium text-emerald-700">
              <input type="checkbox" name="isActual" defaultChecked={lane.isActual} />
              Actual negotiated rate (not an estimate)
            </label>
            <div className="col-span-2 flex items-end gap-2 pt-2">
              <button
                type="submit"
                disabled={pending}
                className="rounded-lg bg-brand-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-60"
              >
                {pending ? "Saving…" : "Save lane"}
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                <X size={13} />
              </button>
            </div>
          </form>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-slate-50 hover:bg-slate-50/60">
      <td className={cell}>
        <span className="font-medium text-slate-800">{lane.vendorName}</span>
      </td>
      <td className={cell}>
        <span className="text-slate-700">
          {lane.originCity} → {lane.destinationCity}
        </span>
      </td>
      <td className={`${cell} text-slate-600`}>
        <span className="text-[11px]">{vehicleLabel}</span>
      </td>
      <td className={`${cell} text-end text-slate-500`}>
        {lane.distanceKm ? `${money(lane.distanceKm)} km` : "—"}
      </td>
      <td className={`${cell} text-end`}>
        <span className="font-semibold text-slate-800">{money(lane.carrierCost)}</span>
        {perKm && (
          <span className="block text-[10px] text-slate-400">{perKm.toFixed(2)} /km</span>
        )}
      </td>
      <td className={`${cell} text-end`}>
        {lane.sellingPrice != null ? (
          <span className="font-semibold text-slate-800">{money(lane.sellingPrice)}</span>
        ) : (
          <span className="text-xs text-slate-300">
            not set
            <span className="block text-[10px] text-slate-400">suggest {money(suggested)}</span>
          </span>
        )}
      </td>
      <td className={`${cell} text-end`}>
        {profit != null ? (
          <span className={profit > 0 ? "font-semibold text-emerald-700" : "font-semibold text-red-600"}>
            {money(profit)}
          </span>
        ) : (
          <span className="text-slate-300">—</span>
        )}
      </td>
      <td className={`${cell} text-end`}>
        {margin != null ? (
          <span
            className={
              margin >= 20
                ? "font-semibold text-emerald-700"
                : margin >= 10
                  ? "font-semibold text-amber-600"
                  : "font-semibold text-red-600"
            }
          >
            {margin.toFixed(1)}%
          </span>
        ) : (
          <span className="text-slate-300">—</span>
        )}
      </td>
      <td className={cell}>
        {lane.isActual ? (
          <Pill className="bg-emerald-50 text-emerald-700">
            <BadgeCheck size={11} className="me-1" /> ACTUAL
          </Pill>
        ) : (
          <Pill className="bg-amber-50 text-amber-700">ESTIMATE</Pill>
        )}
      </td>
      <td className={`${cell} text-xs text-slate-400`}>{lane.updatedAt}</td>
      <td className={`${cell} text-end`}>
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => setEditing(true)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            title="Edit lane"
          >
            <Pencil size={14} />
          </button>
          <button
            disabled={pending}
            onClick={() => {
              if (!confirm(`Delete this lane (${lane.originCity} → ${lane.destinationCity})?`)) return;
              startTransition(() => deleteLane(lane.id));
            }}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
            title="Delete lane"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </td>
    </tr>
  );
}
