"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { TRIP_STATUSES, TRIP_STATUS_LABELS } from "@/lib/constants";

export default function ShipmentFilters({
  origins,
  destinations,
}: {
  origins: string[];
  destinations: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [q, setQ] = useState(searchParams.get("q") ?? "");

  // Keep the box in sync when the URL changes (back/forward, "clear filters")
  // by adjusting state during render rather than in an effect.
  const urlQ = searchParams.get("q") ?? "";
  const [prevUrlQ, setPrevUrlQ] = useState(urlQ);
  if (urlQ !== prevUrlQ) {
    setPrevUrlQ(urlQ);
    setQ(urlQ);
  }

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  useEffect(() => {
    const handle = setTimeout(() => {
      if (q !== (searchParams.get("q") ?? "")) setParam("q", q);
    }, 350);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center">
      <div className="relative flex-1 lg:max-w-xs">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search Trip ID / Driver / Vehicle"
          className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
        />
      </div>

      <div className="flex flex-1 flex-wrap items-center gap-2">
        <select
          value={searchParams.get("status") ?? "ALL"}
          onChange={(e) => setParam("status", e.target.value === "ALL" ? "" : e.target.value)}
          className="rounded-lg border border-slate-200 px-2.5 py-2 text-sm text-slate-600 outline-none focus:border-sky-400"
        >
          <option value="ALL">All Status</option>
          {TRIP_STATUSES.map((s) => (
            <option key={s} value={s}>
              {TRIP_STATUS_LABELS[s]}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={searchParams.get("from") ?? ""}
          onChange={(e) => setParam("from", e.target.value)}
          className="rounded-lg border border-slate-200 px-2.5 py-2 text-sm text-slate-600 outline-none focus:border-sky-400"
        />
        <input
          type="date"
          value={searchParams.get("to") ?? ""}
          onChange={(e) => setParam("to", e.target.value)}
          className="rounded-lg border border-slate-200 px-2.5 py-2 text-sm text-slate-600 outline-none focus:border-sky-400"
        />

        <select
          value={searchParams.get("origin") ?? "ALL"}
          onChange={(e) => setParam("origin", e.target.value === "ALL" ? "" : e.target.value)}
          className="rounded-lg border border-slate-200 px-2.5 py-2 text-sm text-slate-600 outline-none focus:border-sky-400"
        >
          <option value="ALL">All Origin</option>
          {origins.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>

        <select
          value={searchParams.get("destination") ?? "ALL"}
          onChange={(e) => setParam("destination", e.target.value === "ALL" ? "" : e.target.value)}
          className="rounded-lg border border-slate-200 px-2.5 py-2 text-sm text-slate-600 outline-none focus:border-sky-400"
        >
          <option value="ALL">All Destination</option>
          {destinations.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>

        {(searchParams.get("status") ||
          searchParams.get("from") ||
          searchParams.get("to") ||
          searchParams.get("origin") ||
          searchParams.get("destination") ||
          searchParams.get("q")) && (
          <button
            onClick={() => {
              setQ("");
              router.push(pathname);
            }}
            className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-2 text-xs font-medium text-slate-500 hover:bg-slate-50"
          >
            <SlidersHorizontal size={13} /> Clear
          </button>
        )}
      </div>
    </div>
  );
}
