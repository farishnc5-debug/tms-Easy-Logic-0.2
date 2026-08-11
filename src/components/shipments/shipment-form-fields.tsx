"use client";

import { useMemo, useState } from "react";
import { SHIPMENT_PRIORITIES, SAUDI_CITIES } from "@/lib/constants";
import TripTypeSection from "@/components/shipments/trip-type-section";
import EquipmentPicker from "@/components/shipments/equipment-picker";
import DeliveryStops, { type StopRow } from "@/components/shipments/delivery-stops";
import { useT } from "@/components/layout/locale-provider";

export type LaneRate = {
  id: string;
  originName: string;
  destinationName: string;
  tripType: string;
  rateAmount: number;
};

// Company facilities first, then every major Saudi city (searchable as you type)
const CITY_OPTIONS = [
  "Jeddah Warehouse",
  "Jeddah Customer",
  "Jeddah Hospital",
  "Makkah Hub",
  "Taif Depot",
  "Riyadh DC",
  "Riyadh Customer",
  "Riyadh Hospital",
  "Dammam Port",
  "Dammam Customer",
  "Jubail Terminal",
  "Madinah Hub",
  "Qassim Depot",
  "Abha Hub",
  "Tabuk Depot",
  ...Object.keys(SAUDI_CITIES),
];

export default function ShipmentFormFields({
  customers,
  defaults,
}: {
  customers: { id: string; name: string; company: string | null; rates?: LaneRate[] }[];
  defaults?: {
    customerId?: string;
    originName?: string;
    destinationName?: string;
    priority?: string;
    weightKg?: number | null;
    notes?: string | null;
    tripType?: string | null;
    returnName?: string | null;
    originAddress?: string | null;
    destinationAddress?: string | null;
    returnAddress?: string | null;
    originX?: number | null;
    originY?: number | null;
    destX?: number | null;
    destY?: number | null;
    returnX?: number | null;
    returnY?: number | null;
    vehicleTypes?: string | null;
    tempMinC?: number | null;
    tempMaxC?: number | null;
    stops?: StopRow[];
  };
}) {
  const t = useT();
  const [customerId, setCustomerId] = useState(defaults?.customerId ?? "");

  const selected = useMemo(() => customers.find((c) => c.id === customerId), [customers, customerId]);
  const lanes = selected?.rates ?? [];
  const hasLanes = lanes.length > 0;

  // Pre-select the lane matching an existing booking when editing
  const defaultLaneId = useMemo(() => {
    if (!defaults?.originName) return "";
    return (
      lanes.find(
        (l) =>
          l.originName === defaults.originName &&
          l.destinationName === defaults.destinationName &&
          l.tripType === (defaults.tripType ?? "ONE_WAY"),
      )?.id ?? ""
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lanes]);
  const [laneId, setLaneId] = useState(defaultLaneId);
  const lane = lanes.find((l) => l.id === laneId) ?? null;

  const inputCls =
    "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100";

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label className="mb-1 block text-sm font-medium text-slate-700">{t("Customer")}</label>
        <select
          name="customerId"
          required
          value={customerId}
          onChange={(e) => {
            setCustomerId(e.target.value);
            setLaneId("");
          }}
          className={inputCls}
        >
          <option value="" disabled>
            {t("Select customer")}
          </option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} {c.company ? `(${c.company})` : ""}
            </option>
          ))}
        </select>
      </div>

      {hasLanes ? (
        /* Customer has an agreed rate card — bookings limited to those lanes */
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium text-slate-700">
            {t("Agreed lane (rate card)")}
          </label>
          <select
            required
            value={laneId}
            onChange={(e) => setLaneId(e.target.value)}
            className={inputCls}
          >
            <option value="" disabled>
              {t("Select agreed lane")}
            </option>
            {lanes.map((l) => (
              <option key={l.id} value={l.id}>
                {l.originName} → {l.destinationName} ·{" "}
                {l.tripType === "ROUND_TRIP" ? t("Round Trip") : t("One Way")} · SAR{" "}
                {l.rateAmount.toLocaleString()}
              </option>
            ))}
          </select>
          {/* Lane drives the actual booking fields */}
          <input type="hidden" name="originName" value={lane?.originName ?? ""} />
          <input type="hidden" name="destinationName" value={lane?.destinationName ?? ""} />
          <input type="hidden" name="agreedRate" value={lane?.rateAmount ?? ""} />
          {lane && (
            <p className="mt-1.5 text-xs text-emerald-700">
              {t("Agreed rate")}: <b>SAR {lane.rateAmount.toLocaleString()}</b> —{" "}
              {lane.originName} → {lane.destinationName}
            </p>
          )}
        </div>
      ) : (
        <>
          {customerId && (
            <p className="sm:col-span-2 -mb-2 text-xs text-amber-600">
              {t("No agreed rates for this customer — free entry")}
            </p>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">{t("Origin")}</label>
            <input
              name="originName"
              list="city-options"
              required
              defaultValue={defaults?.originName ?? ""}
              placeholder="e.g. Jeddah Warehouse"
              className={inputCls}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">{t("Destination")}</label>
            <input
              name="destinationName"
              list="city-options"
              required
              defaultValue={defaults?.destinationName ?? ""}
              placeholder="e.g. Riyadh DC"
              className={inputCls}
            />
          </div>
        </>
      )}
      <datalist id="city-options">
        {CITY_OPTIONS.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">{t("Priority")}</label>
        <select
          name="priority"
          defaultValue={defaults?.priority ?? "STANDARD"}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
        >
          {SHIPMENT_PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {p.charAt(0) + p.slice(1).toLowerCase()}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">{t("Weight (kg)")}</label>
        <input
          type="number"
          name="weightKg"
          min={0}
          step="0.1"
          defaultValue={defaults?.weightKg ?? ""}
          placeholder="e.g. 1200"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
        />
      </div>

      <div className="sm:col-span-2">
        <TripTypeSection
          key={lane?.id ?? "free-entry"}
          lockedType={lane ? lane.tripType : undefined}
          defaults={{
            tripType: lane ? lane.tripType : defaults?.tripType,
            returnName: lane && lane.tripType === "ROUND_TRIP" ? (defaults?.returnName ?? lane.originName) : defaults?.returnName,
            originAddress: defaults?.originAddress,
            destinationAddress: defaults?.destinationAddress,
            returnAddress: defaults?.returnAddress,
            originX: defaults?.originX,
            originY: defaults?.originY,
            destX: defaults?.destX,
            destY: defaults?.destY,
            returnX: defaults?.returnX,
            returnY: defaults?.returnY,
          }}
        />
      </div>

      <div className="sm:col-span-2">
        <EquipmentPicker
          defaults={{
            vehicleTypes: defaults?.vehicleTypes,
            tempMinC: defaults?.tempMinC,
            tempMaxC: defaults?.tempMaxC,
          }}
        />
      </div>

      <div className="sm:col-span-2">
        <DeliveryStops initial={defaults?.stops ?? []} />
      </div>

      <div className="sm:col-span-2">
        <label className="mb-1 block text-sm font-medium text-slate-700">{t("Notes")}</label>
        <textarea
          name="notes"
          rows={3}
          defaultValue={defaults?.notes ?? ""}
          placeholder="Optional internal notes about this shipment..."
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
        />
      </div>
    </div>
  );
}
