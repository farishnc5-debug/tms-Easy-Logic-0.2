import { PackageCheck, Inbox, Landmark, FileText, BadgeDollarSign } from "lucide-react";
import { SETTLEMENT_STAGES } from "@/lib/constants";

const ICONS = [PackageCheck, Inbox, Landmark, FileText, BadgeDollarSign];
const COLORS = ["#16a34a", "#0284c7", "#7c3aed", "#f97316", "#16a34a"];

function fmt(d: Date | string | null | undefined) {
  if (!d) return "--:--";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function SettlementStepper({
  currentStage,
  timestamps,
}: {
  currentStage: number;
  timestamps: {
    deliveredAt: Date | string | null;
    docsReceivedAt: Date | string | null;
    handedToAccountsAt: Date | string | null;
    invoicedAt: Date | string | null;
    paidAt: Date | string | null;
  };
}) {
  const stampFor = (stage: number) => {
    switch (stage) {
      case 1:
        return timestamps.deliveredAt;
      case 2:
        return timestamps.docsReceivedAt;
      case 3:
        return timestamps.handedToAccountsAt;
      case 4:
        return timestamps.invoicedAt;
      case 5:
        return timestamps.paidAt;
      default:
        return null;
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <p className="mb-5 text-xs font-semibold tracking-widest text-slate-400">
        PAYMENT FOLLOW-UP — ORIGINALS, INVOICE & COLLECTION
      </p>
      <div className="flex items-start overflow-x-auto pb-1">
        {SETTLEMENT_STAGES.map((stage, i) => {
          const Icon = ICONS[i];
          const done = stage.stage < currentStage;
          const active = stage.stage === currentStage;
          const stamp = stampFor(stage.stage);
          return (
            <div key={stage.stage} className="flex min-w-[130px] flex-1 flex-col items-center">
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
                  className={`h-0.5 flex-1 ${i === SETTLEMENT_STAGES.length - 1 ? "opacity-0" : done ? "bg-emerald-400" : "bg-slate-200"}`}
                />
              </div>
              <div
                className={`mt-3 flex h-12 w-12 items-center justify-center rounded-full ${
                  done
                    ? "bg-emerald-50 text-emerald-600"
                    : active
                      ? "text-white"
                      : "bg-slate-50 text-slate-300"
                }`}
                style={
                  active
                    ? { backgroundColor: COLORS[i], boxShadow: `0 0 0 4px ${COLORS[i]}22` }
                    : undefined
                }
              >
                <Icon size={20} />
              </div>
              <p className="mt-2 text-center text-[11px] font-bold tracking-wide text-slate-700">
                {stage.label.toUpperCase()}
              </p>
              <p className="mt-0.5 max-w-[120px] text-center text-[10px] text-slate-400">
                {stage.sub}
              </p>
              <span
                className={`mt-2 rounded-md border px-2 py-0.5 text-[10px] font-medium ${
                  done || active
                    ? "border-slate-200 text-slate-600"
                    : "border-slate-100 text-slate-300"
                }`}
              >
                {done || (active && stamp) ? fmt(stamp) : "--:--"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
