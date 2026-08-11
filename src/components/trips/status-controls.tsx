"use client";

import { useState, useTransition } from "react";
import { Undo2 } from "lucide-react";
import { updateTripStatus, regressTripStatus } from "@/lib/actions/trips";
import { TRIP_STATUS_LABELS, flowFor } from "@/lib/constants";
import { useT } from "@/components/layout/locale-provider";

export default function StatusControls({
  tripId,
  status,
  tripType = "ONE_WAY",
  delayedFrom,
}: {
  tripId: string;
  status: string;
  tripType?: string;
  // Pre-delay status — Resume returns the trip to it
  delayedFrom?: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const [localStatus, setLocalStatus] = useState(status);
  const t = useT();
  // Status label in the active language (dictionary keys use spaces)
  const statusLabel = (s: string) => t(s.replace(/_/g, " "));

  const FLOW = flowFor(tripType);
  const idx = FLOW.indexOf(localStatus);
  const next = idx >= 0 && idx < FLOW.length - 1 ? FLOW[idx + 1] : null;
  const prev = idx > 0 ? FLOW[idx - 1] : null;
  const finalStatus = FLOW[FLOW.length - 1];
  const isTerminal = localStatus === finalStatus || localStatus === "CANCELLED";
  // Where Resume goes after a delay (fallback: restart the flow sensibly)
  const resumeTo =
    localStatus === "DELAYED" ? (delayedFrom && FLOW.includes(delayedFrom) ? delayedFrom : FLOW[0]) : null;

  function apply(newStatus: string, reason?: string) {
    setLocalStatus(newStatus);
    startTransition(() => updateTripStatus(tripId, newStatus, reason));
  }

  function stepBack() {
    if (!prev) return;
    const ok = confirm(
      `⚠ WARNING — Step the lifecycle BACKWARD?\n\n` +
        `"${TRIP_STATUS_LABELS[localStatus]}" will be undone and the trip will return to "${TRIP_STATUS_LABELS[prev]}".\n\n` +
        `The progress recorded for this stage (its timestamp) will be DELETED.\n\n` +
        `Only do this if the stage was advanced by mistake.`,
    );
    if (!ok) return;
    setLocalStatus(prev);
    startTransition(() => regressTripStatus(tripId));
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {next && (
        <button
          disabled={pending}
          onClick={() => apply(next)}
          className="rounded-lg bg-brand-600 px-3.5 py-2 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {t("Advance to")} {statusLabel(next)}
        </button>
      )}
      {prev && !isTerminal && localStatus !== "DELAYED" && localStatus !== "CANCELLED" && (
        <button
          disabled={pending}
          onClick={stepBack}
          title="Undo the last stage (deletes its recorded progress)"
          className="flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-600 hover:border-red-300 hover:bg-red-50 hover:text-red-600 disabled:opacity-60"
        >
          <Undo2 size={13} /> {t("Step Back")}
        </button>
      )}
      {!isTerminal && localStatus !== "DELAYED" && (
        <button
          disabled={pending}
          onClick={() => apply("DELAYED")}
          className="rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2 text-xs font-medium text-amber-700 hover:bg-amber-100 disabled:opacity-60"
        >
          {t("Mark Delayed")}
        </button>
      )}
      {resumeTo && (
        <button
          disabled={pending}
          onClick={() => apply(resumeTo)}
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-60"
        >
          {t("Resume")} · {statusLabel(resumeTo)}
        </button>
      )}
      {!isTerminal && (
        <button
          disabled={pending}
          onClick={() => {
            const reason = prompt("Reason for cancelling this trip (required):");
            if (reason === null) return;
            if (!reason.trim()) {
              alert("A cancellation reason is required.");
              return;
            }
            apply("CANCELLED", reason.trim());
          }}
          className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-60"
        >
          {t("Cancel Trip")}
        </button>
      )}
      {isTerminal && (
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-400">
            {localStatus === "CANCELLED"
              ? t("Trip cancelled")
              : tripType === "ROUND_TRIP"
                ? t("Round trip completed — empty container offloaded")
                : t("Trip completed")}
          </span>
          {prev && localStatus !== "CANCELLED" && (
            <button
              disabled={pending}
              onClick={stepBack}
              title="Undo the last stage (deletes its recorded progress)"
              className="flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:border-red-300 hover:bg-red-50 hover:text-red-600 disabled:opacity-60"
            >
              <Undo2 size={13} /> {t("Step Back")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
