"use client";

import { useState } from "react";
import { MapPinPlus, Trash2, MapPin } from "lucide-react";
import { useT } from "@/components/layout/locale-provider";

export type StopRow = {
  name: string;
  address: string;
  contactName: string;
  contactPhone: string;
  notes: string;
};

const empty = (): StopRow => ({
  name: "",
  address: "",
  contactName: "",
  contactPhone: "",
  notes: "",
});

// Extra drop-off points inside the destination city. The main destination is
// the first delivery; these are additional stops the driver must visit.
export default function DeliveryStops({ initial = [] }: { initial?: StopRow[] }) {
  const [stops, setStops] = useState<StopRow[]>(initial);
  const t = useT();

  const serialized = JSON.stringify(stops.filter((s) => s.name.trim()));

  function update(i: number, patch: Partial<StopRow>) {
    setStops((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  }

  const inputCls =
    "w-full rounded-lg border border-slate-200 px-2.5 py-2 text-sm outline-none focus:border-sky-400";

  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <input type="hidden" name="stopsJson" value={serialized} />

      <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold tracking-widest text-slate-400">
        <MapPin size={14} /> {t("ADDITIONAL DELIVERY POINTS")}
      </p>
      <p className="mb-3 text-xs text-slate-500">
        {t("If the shipment is dropped at more than one point in the destination city, add each point here. The main destination is delivery point 1.")}
      </p>

      {stops.length > 0 && (
        <div className="space-y-3">
          {stops.map((s, i) => (
            <div key={i} className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="rounded-md bg-purple-100 px-2 py-0.5 text-xs font-bold text-purple-700">
                  {t("Delivery point")} {i + 2}
                </span>
                <button
                  type="button"
                  onClick={() => setStops((prev) => prev.filter((_, idx) => idx !== i))}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <input
                  value={s.name}
                  onChange={(e) => update(i, { name: e.target.value })}
                  placeholder={t("Point name (e.g. Branch 2 — Al Olaya)")}
                  className={inputCls}
                />
                <input
                  value={s.address}
                  onChange={(e) => update(i, { address: e.target.value })}
                  placeholder={t("Address or Google Maps link")}
                  className={inputCls}
                />
                <input
                  value={s.contactName}
                  onChange={(e) => update(i, { contactName: e.target.value })}
                  placeholder={t("Contact person at this point")}
                  className={inputCls}
                />
                <input
                  value={s.contactPhone}
                  onChange={(e) => update(i, { contactPhone: e.target.value })}
                  placeholder={t("Contact phone")}
                  className={inputCls}
                />
                <input
                  value={s.notes}
                  onChange={(e) => update(i, { notes: e.target.value })}
                  placeholder={t("Notes (what is dropped here)")}
                  className={`${inputCls} sm:col-span-2`}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => setStops((prev) => [...prev, empty()])}
        className="mt-3 flex items-center gap-1.5 rounded-lg border border-dashed border-purple-300 bg-purple-50 px-3 py-2 text-xs font-semibold text-purple-700 hover:border-purple-400 hover:bg-purple-100"
      >
        <MapPinPlus size={14} /> {t("Additional point of delivery")}
      </button>
    </div>
  );
}
