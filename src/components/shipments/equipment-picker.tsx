"use client";

import { useState } from "react";
import { Truck, Thermometer } from "lucide-react";
import { VEHICLE_TYPES, TEMP_PRESETS, isColdSelection } from "@/lib/constants";
import { useT } from "@/components/layout/locale-provider";

// Multi-select equipment picker. When a temperature-controlled unit is
// selected, the required temperature range becomes visible and mandatory.
export default function EquipmentPicker({
  defaults,
}: {
  defaults?: {
    vehicleTypes?: string | null; // comma-separated codes
    tempMinC?: number | null;
    tempMaxC?: number | null;
  };
}) {
  const t = useT();
  const [selected, setSelected] = useState<string[]>(
    defaults?.vehicleTypes ? defaults.vehicleTypes.split(",").filter(Boolean) : [],
  );
  const [tempMin, setTempMin] = useState(
    defaults?.tempMinC != null ? String(defaults.tempMinC) : "",
  );
  const [tempMax, setTempMax] = useState(
    defaults?.tempMaxC != null ? String(defaults.tempMaxC) : "",
  );

  const cold = isColdSelection(selected);

  function toggle(code: string) {
    setSelected((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code],
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <input type="hidden" name="vehicleTypes" value={selected.join(",")} />
      {/* Only submitted when a cold unit is selected */}
      <input type="hidden" name="tempMinC" value={cold ? tempMin : ""} />
      <input type="hidden" name="tempMaxC" value={cold ? tempMax : ""} />

      <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold tracking-widest text-slate-400">
        <Truck size={14} /> {t("EQUIPMENT REQUIRED")}
      </p>
      <p className="mb-3 text-xs text-slate-500">
        {t("Select one or more vehicle types needed for this shipment.")}
      </p>

      <div className="flex flex-wrap gap-2">
        {VEHICLE_TYPES.map((v) => {
          const on = selected.includes(v.code);
          return (
            <button
              key={v.code}
              type="button"
              onClick={() => toggle(v.code)}
              className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                on
                  ? v.cold
                    ? "border-cyan-400 bg-cyan-50 text-cyan-700 ring-2 ring-cyan-100"
                    : "border-brand-400 bg-brand-50 text-brand-700 ring-2 ring-brand-100"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {v.cold && <Thermometer size={12} className="me-1 inline" />}
              {v.label}
            </button>
          );
        })}
      </div>

      {selected.length === 0 && (
        <p className="mt-2 text-xs text-amber-600">
          {t("No equipment selected yet — pick at least one vehicle type.")}
        </p>
      )}

      {/* Temperature range — only for refrigerated / frozen units */}
      {cold && (
        <div className="mt-4 rounded-lg border border-cyan-200 bg-cyan-50/50 p-3">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold tracking-widest text-cyan-800">
            <Thermometer size={14} /> {t("REQUIRED TEMPERATURE")}
          </p>

          <div className="mb-2 flex flex-wrap gap-1.5">
            {TEMP_PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => {
                  setTempMin(String(p.min));
                  setTempMax(String(p.max));
                }}
                className={`rounded-md border px-2 py-1 text-xs font-medium ${
                  tempMin === String(p.min) && tempMax === String(p.max)
                    ? "border-cyan-500 bg-cyan-100 text-cyan-800"
                    : "border-cyan-200 bg-white text-cyan-700 hover:bg-cyan-50"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-cyan-800">
                {t("Min °C")}
              </label>
              <input
                type="number"
                step="0.5"
                required
                value={tempMin}
                onChange={(e) => setTempMin(e.target.value)}
                placeholder="-18"
                className="w-full rounded-lg border border-cyan-200 bg-white px-3 py-2 text-sm outline-none focus:border-cyan-400"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-cyan-800">
                {t("Max °C")}
              </label>
              <input
                type="number"
                step="0.5"
                required
                value={tempMax}
                onChange={(e) => setTempMax(e.target.value)}
                placeholder="-15"
                className="w-full rounded-lg border border-cyan-200 bg-white px-3 py-2 text-sm outline-none focus:border-cyan-400"
              />
            </div>
          </div>
          <p className="mt-1.5 text-[11px] text-cyan-700">
            {t("This temperature range is printed on the waybill for the driver.")}
          </p>
        </div>
      )}
    </div>
  );
}
