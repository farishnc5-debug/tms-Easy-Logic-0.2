"use client";

import { useState } from "react";
import { Plus, Trash2, Route } from "lucide-react";
import { useT } from "@/components/layout/locale-provider";

export type RateRow = {
  originName: string;
  destinationName: string;
  tripType: string; // ONE_WAY | ROUND_TRIP
  rateAmount: string; // keep as string for the input; validated server-side
};

// Agreed rate card editor. Rows are serialized to JSON in a hidden input so
// the plain server-action form post carries them without client fetch logic.
export default function RatesEditor({
  initial = [],
  cityOptions,
}: {
  initial?: RateRow[];
  cityOptions: string[];
}) {
  const [rows, setRows] = useState<RateRow[]>(
    initial.length > 0
      ? initial
      : [{ originName: "", destinationName: "", tripType: "ONE_WAY", rateAmount: "" }],
  );
  const t = useT();

  function update(i: number, patch: Partial<RateRow>) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }
  function addRow() {
    setRows((prev) => [
      ...prev,
      { originName: "", destinationName: "", tripType: "ONE_WAY", rateAmount: "" },
    ]);
  }
  function removeRow(i: number) {
    setRows((prev) => prev.filter((_, idx) => idx !== i));
  }

  // Only complete rows are submitted
  const serialized = JSON.stringify(
    rows.filter((r) => r.originName.trim() && r.destinationName.trim() && Number(r.rateAmount) > 0),
  );

  const inputCls =
    "w-full rounded-lg border border-slate-200 px-2.5 py-2 text-sm outline-none focus:border-sky-400";

  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <input type="hidden" name="ratesJson" value={serialized} />
      <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold tracking-widest text-slate-400">
        <Route size={14} /> {t("AGREED LANE RATES")}
      </p>
      <p className="mb-3 text-xs text-slate-500">
        {t("Bookings for this customer are limited to these agreed lanes. Add one row per route and trip type.")}
      </p>

      <div className="space-y-2">
        {rows.map((r, i) => (
          <div key={i} className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[1fr_1fr_150px_120px_36px]">
            <input
              list="rate-city-options"
              value={r.originName}
              onChange={(e) => update(i, { originName: e.target.value })}
              placeholder={t("From (origin)")}
              className={inputCls}
            />
            <input
              list="rate-city-options"
              value={r.destinationName}
              onChange={(e) => update(i, { destinationName: e.target.value })}
              placeholder={t("To (destination)")}
              className={inputCls}
            />
            <select
              value={r.tripType}
              onChange={(e) => update(i, { tripType: e.target.value })}
              className={inputCls}
            >
              <option value="ONE_WAY">{t("One Way")}</option>
              <option value="ROUND_TRIP">{t("Round Trip")}</option>
            </select>
            <input
              type="number"
              min={0}
              step="0.01"
              value={r.rateAmount}
              onChange={(e) => update(i, { rateAmount: e.target.value })}
              placeholder={t("Rate SAR")}
              className={inputCls}
            />
            <button
              type="button"
              onClick={() => removeRow(i)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500"
              title={t("Delete")}
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>

      <datalist id="rate-city-options">
        {cityOptions.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>

      <button
        type="button"
        onClick={addRow}
        className="mt-3 flex items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-500 hover:border-sky-400 hover:text-sky-600"
      >
        <Plus size={13} /> {t("Add lane rate")}
      </button>
    </div>
  );
}
