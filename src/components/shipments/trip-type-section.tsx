"use client";

import { useState } from "react";
import { ArrowRight, Repeat } from "lucide-react";
import LocationPicker from "@/components/map/location-picker";
import { useT } from "@/components/layout/locale-provider";

export default function TripTypeSection({
  defaults,
  lockedType,
}: {
  // When the booking comes from an agreed lane rate, the trip type is fixed
  lockedType?: string;
  defaults?: {
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
  };
}) {
  const [tripType, setTripType] = useState(lockedType ?? defaults?.tripType ?? "ONE_WAY");
  const roundTrip = tripType === "ROUND_TRIP";
  const locked = lockedType != null;
  const pick = (v: string) => {
    if (!locked) setTripType(v);
  };
  const t = useT();

  return (
    <div className="space-y-4">
      <input type="hidden" name="tripType" value={tripType} />

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">{t("Trip Type")}</label>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => pick("ONE_WAY")}
            disabled={locked && roundTrip}
            className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition ${
              !roundTrip
                ? "border-brand-400 bg-brand-50 ring-2 ring-brand-100"
                : "border-slate-200 hover:bg-slate-50"
            } ${locked && roundTrip ? "cursor-not-allowed opacity-40" : ""}`}
          >
            <ArrowRight size={20} className={!roundTrip ? "text-brand-600" : "text-slate-400"} />
            <span>
              <span className={`block text-sm font-semibold ${!roundTrip ? "text-brand-700" : "text-slate-700"}`}>
                {t("One Way")}
              </span>
              <span className="block text-xs text-slate-500">
                Deliver and the trip is complete (6 lifecycle stages)
              </span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => pick("ROUND_TRIP")}
            disabled={locked && !roundTrip}
            className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition ${
              roundTrip
                ? "border-cyan-400 bg-cyan-50 ring-2 ring-cyan-100"
                : "border-slate-200 hover:bg-slate-50"
            } ${locked && !roundTrip ? "cursor-not-allowed opacity-40" : ""}`}
          >
            <Repeat size={20} className={roundTrip ? "text-cyan-600" : "text-slate-400"} />
            <span>
              <span className={`block text-sm font-semibold ${roundTrip ? "text-cyan-700" : "text-slate-700"}`}>
                {t("Round Trip — Empty Return")}
              </span>
              <span className="block text-xs text-slate-500">
                After delivery the driver returns the empty container (9 lifecycle stages)
              </span>
            </span>
          </button>
        </div>
      </div>

      {roundTrip && (
        <div>
          <label className="mb-1 block text-sm font-medium text-cyan-800">
            {t("Empty Return Location")} <span className="text-red-500">*</span>
          </label>
          <input
            name="returnName"
            list="city-options"
            required
            defaultValue={defaults?.returnName ?? ""}
            placeholder="e.g. Dammam Port (where the empty container is offloaded)"
            className="w-full rounded-lg border border-cyan-200 bg-cyan-50/40 px-3 py-2 text-sm outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
          />
          <p className="mt-1 text-xs text-slate-500">
            The driver takes the empty container here after delivery — stages 7-9 of the lifecycle.
          </p>
        </div>
      )}

      <LocationPicker
        showReturn={roundTrip}
        defaults={{
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
  );
}
