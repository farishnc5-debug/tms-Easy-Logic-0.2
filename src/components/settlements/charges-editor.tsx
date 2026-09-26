"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useT } from "@/components/layout/locale-provider";

type ChargeRow = { description: string; amount: string };

// Additional invoice charges (waiting time, detention, handling...). Rows are
// serialized to a hidden JSON input carried by the invoice form post.
export default function ChargesEditor() {
  const [rows, setRows] = useState<ChargeRow[]>([]);
  const t = useT();

  const serialized = JSON.stringify(
    rows.filter((r) => r.description.trim() && Number(r.amount) > 0),
  );
  const chargesTotal = rows.reduce((sum, r) => sum + (Number(r.amount) > 0 ? Number(r.amount) : 0), 0);

  function update(i: number, patch: Partial<ChargeRow>) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  return (
    <div className="sm:col-span-3 rounded-lg border border-dashed border-slate-300 bg-slate-50/50 p-3">
      <input type="hidden" name="chargesJson" value={serialized} />
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold tracking-widest text-slate-500">
          {t("ADDITIONAL CHARGES (OPTIONAL)")}
        </p>
        {chargesTotal > 0 && (
          <span className="text-xs font-medium text-slate-600">
            + SAR {chargesTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        )}
      </div>
      <p className="mb-2 text-[11px] text-slate-400">
        {t("e.g. 1 day waiting charges, extra offloading hour, detention — VAT is calculated on freight + charges.")}
      </p>

      <div className="space-y-2">
        {rows.map((r, i) => (
          <div key={i} className="grid grid-cols-[1fr_130px_36px] items-center gap-2">
            <input
              value={r.description}
              onChange={(e) => update(i, { description: e.target.value })}
              placeholder={t("Charge description (e.g. 1 day waiting charges)")}
              className="w-full rounded-lg border border-slate-200 px-2.5 py-2 text-sm outline-none focus:border-sky-400"
            />
            <input
              type="number"
              min={0}
              step="0.01"
              value={r.amount}
              onChange={(e) => update(i, { amount: e.target.value })}
              placeholder={t("Amount") + " SAR"}
              className="w-full rounded-lg border border-slate-200 px-2.5 py-2 text-sm outline-none focus:border-sky-400"
            />
            <button
              type="button"
              onClick={() => setRows((prev) => prev.filter((_, idx) => idx !== i))}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setRows((prev) => [...prev, { description: "", amount: "" }])}
        className="mt-2 flex items-center gap-1.5 rounded-lg border border-dashed border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-500 hover:border-sky-400 hover:text-sky-600"
      >
        <Plus size={13} /> {t("Add charge line")}
      </button>
    </div>
  );
}
