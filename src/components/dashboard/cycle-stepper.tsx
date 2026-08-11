"use client";

import {
  ClipboardEdit,
  HandCoins,
  Truck,
  MapPin,
  PackageCheck,
  Flag,
  CornerDownLeft,
  Container,
  CheckCircle2,
} from "lucide-react";
import { cycleStagesFor } from "@/lib/constants";
import { useT } from "@/components/layout/locale-provider";

const ICONS = [
  ClipboardEdit,
  HandCoins,
  Truck,
  MapPin,
  PackageCheck,
  Flag,
  CornerDownLeft,
  Container,
  CheckCircle2,
];
const COLORS = [
  "#2563eb",
  "#16a34a",
  "#2563eb",
  "#7c3aed",
  "#f97316",
  "#64748b",
  "#0891b2",
  "#9333ea",
  "#059669",
];

export type CycleTimestamps = {
  dispatchedAt: Date | string | null;
  collectingAt: Date | string | null;
  inTransitAt: Date | string | null;
  atDeliveryAt: Date | string | null;
  deliveredAt: Date | string | null;
  leftDeliveryAt: Date | string | null;
  returnTransitAt?: Date | string | null;
  atReturnAt?: Date | string | null;
  returnOffloadedAt?: Date | string | null;
};

function fmt(d: Date | string | null | undefined) {
  if (!d) return "--:--";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

export default function CycleStepper({
  currentStage,
  timestamps,
  tripType = "ONE_WAY",
}: {
  currentStage: number;
  timestamps: CycleTimestamps;
  tripType?: string;
}) {
  const stages = cycleStagesFor(tripType);
  const roundTrip = tripType === "ROUND_TRIP";
  const t = useT();

  const stampFor = (stage: number) => {
    switch (stage) {
      case 1:
        return timestamps.dispatchedAt;
      case 2:
        return timestamps.collectingAt;
      case 3:
        return timestamps.inTransitAt;
      case 4:
        return timestamps.atDeliveryAt;
      case 5:
        return timestamps.deliveredAt;
      case 6:
        return timestamps.leftDeliveryAt;
      case 7:
        return timestamps.returnTransitAt ?? null;
      case 8:
        return timestamps.atReturnAt ?? null;
      case 9:
        return timestamps.returnOffloadedAt ?? null;
      default:
        return null;
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="mb-5 flex items-center gap-2">
        <p className="text-xs font-semibold tracking-widest text-slate-400">
          {t("LOGISTICS CYCLE — END TO END VISIBILITY")}
        </p>
        {roundTrip && (
          <span className="rounded-full bg-cyan-50 px-2 py-0.5 text-[10px] font-semibold text-cyan-700 ring-1 ring-cyan-200">
            {t("ROUND TRIP — EMPTY RETURN")}
          </span>
        )}
      </div>
      <div className="flex items-start overflow-x-auto pb-1">
        {stages.map((stage, i) => {
          const Icon = ICONS[i] ?? Flag;
          const done = stage.stage < currentStage;
          const active = stage.stage === currentStage;
          const stamp = stampFor(stage.stage);
          return (
            <div
              key={stage.stage}
              className={`flex flex-1 flex-col items-center ${roundTrip ? "min-w-[100px]" : "min-w-[120px]"}`}
            >
              <div className="flex w-full items-center">
                <div
                  className={`h-0.5 flex-1 ${i === 0 ? "opacity-0" : done || active ? "bg-emerald-400" : "bg-slate-200"}`}
                />
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${
                    done ? "bg-emerald-500" : active ? "" : "bg-slate-300"
                  }`}
                  style={active ? { backgroundColor: COLORS[i] } : undefined}
                >
                  {stage.stage}
                </div>
                <div
                  className={`h-0.5 flex-1 ${i === stages.length - 1 ? "opacity-0" : done ? "bg-emerald-400" : "bg-slate-200"}`}
                />
              </div>
              <div
                className={`mt-3 flex h-12 w-12 items-center justify-center rounded-full ring-4 ${
                  done
                    ? "bg-emerald-50 text-emerald-600 ring-emerald-50"
                    : active
                      ? "text-white ring-4"
                      : "bg-slate-50 text-slate-300 ring-slate-50"
                }`}
                style={active ? { backgroundColor: COLORS[i], boxShadow: `0 0 0 4px ${COLORS[i]}22` } : undefined}
              >
                <Icon size={20} />
              </div>
              <p className="mt-2 text-center text-[11px] font-bold tracking-wide text-slate-700">
                {t(stage.label).toUpperCase()}
              </p>
              <p className="mt-0.5 max-w-[110px] text-center text-[10px] text-slate-400">
                {t(stage.sub)}
              </p>
              <span
                className={`mt-2 rounded-md border px-2 py-0.5 text-[10px] font-medium ${
                  done || active
                    ? "border-slate-200 text-slate-600"
                    : "border-slate-100 text-slate-300"
                }`}
              >
                {done || active ? fmt(stamp) : "--:--"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
