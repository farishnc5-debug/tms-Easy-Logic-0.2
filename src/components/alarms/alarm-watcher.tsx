"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AlarmClock, BellRing, Minimize2, X } from "lucide-react";
import { snoozeAlarm, dismissAlarm } from "@/lib/actions/alarms";
import { t, type Locale } from "@/lib/i18n";

type DueAlarm = {
  id: string;
  shipmentId: string;
  shipmentCode: string;
  route: string;
  label: string | null;
  triggerAt: string;
};

const POLL_MS = 20_000;
const SNOOZE_OPTIONS = [5, 10, 30];

// Mounted once in (app)/layout.tsx. Polls for any due shipment alarm and, on
// find, covers the ENTIRE viewport with a big alert — the "alarm clock"
// behavior the user asked for — until snoozed, minimized, or closed.
export default function AlarmWatcher({ locale }: { locale: Locale }) {
  const [alarm, setAlarm] = useState<DueAlarm | null>(null);
  const [minimized, setMinimized] = useState(false);
  const [pending, setPending] = useState(false);
  const dismissedIds = useRef<Set<string>>(new Set());
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch("/api/alarms/due", { cache: "no-store" });
        if (!res.ok) return;
        const { alarm: due } = (await res.json()) as { alarm: DueAlarm | null };
        if (cancelled) return;
        if (due && !dismissedIds.current.has(due.id)) {
          setAlarm((prev) => (prev?.id === due.id ? prev : due));
        } else if (!due) {
          setAlarm(null);
          setMinimized(false);
        }
      } catch {
        // Silently retry next tick — a failed poll shouldn't break the UI.
      }
    }

    poll();
    const interval = setInterval(poll, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  // Best-effort beep — browsers block audio before any user interaction, so
  // this may be silent on first load. The full-screen overlay is the
  // reliable part of the alert.
  useEffect(() => {
    if (!alarm || minimized) return;
    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = audioCtxRef.current ?? new Ctx();
      audioCtxRef.current = ctx;
      let count = 0;
      const beep = () => {
        if (count >= 4) return;
        count++;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.value = 880;
        osc.connect(gain);
        gain.connect(ctx.destination);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
        setTimeout(beep, 500);
      };
      beep();
    } catch {
      // Web Audio unsupported/blocked — visual overlay still shows.
    }
  }, [alarm, minimized]);

  if (!alarm) return null;

  async function handleSnooze(minutes: number) {
    if (!alarm) return;
    setPending(true);
    await snoozeAlarm(alarm.id, minutes);
    setPending(false);
    setAlarm(null);
    setMinimized(false);
  }

  async function handleDismiss() {
    if (!alarm) return;
    setPending(true);
    dismissedIds.current.add(alarm.id);
    await dismissAlarm(alarm.id);
    setPending(false);
    setAlarm(null);
    setMinimized(false);
  }

  if (minimized) {
    return (
      <button
        onClick={() => setMinimized(false)}
        className="fixed bottom-5 end-5 z-[9999] flex items-center gap-2 rounded-full bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow-2xl animate-pulse hover:bg-red-700"
      >
        <BellRing size={18} /> {t("1 alarm minimized", locale)}
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-red-700/97 p-6 text-center text-white backdrop-blur-sm">
      <div className="animate-bounce">
        <AlarmClock size={96} strokeWidth={1.5} />
      </div>
      <p className="mt-6 text-xs font-semibold tracking-[0.3em] text-red-200">{t("SHIPMENT ALARM", locale)}</p>
      <h1 className="mt-2 text-4xl font-extrabold sm:text-5xl">{alarm.shipmentCode}</h1>
      <p className="mt-2 text-lg text-red-100">{alarm.route}</p>
      {alarm.label && <p className="mt-3 max-w-lg text-xl font-medium">{alarm.label}</p>}

      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        {SNOOZE_OPTIONS.map((m) => (
          <button
            key={m}
            disabled={pending}
            onClick={() => handleSnooze(m)}
            className="rounded-lg bg-white/15 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/25 disabled:opacity-50"
          >
            {t("Snooze", locale)} {m}m
          </button>
        ))}
        <button
          disabled={pending}
          onClick={() => setMinimized(true)}
          className="flex items-center gap-1.5 rounded-lg bg-white/15 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/25 disabled:opacity-50"
        >
          <Minimize2 size={15} /> {t("Minimize", locale)}
        </button>
        <button
          disabled={pending}
          onClick={handleDismiss}
          className="flex items-center gap-1.5 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
        >
          <X size={15} /> {t("Close", locale)}
        </button>
      </div>

      <Link
        href={`/shipments/${alarm.shipmentId}`}
        onClick={() => setMinimized(true)}
        className="mt-8 text-sm text-red-100 underline hover:text-white"
      >
        {t("Open shipment", locale)}
      </Link>
    </div>
  );
}
