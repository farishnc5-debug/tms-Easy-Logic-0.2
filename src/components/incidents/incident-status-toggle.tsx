"use client";

import { useTransition } from "react";
import { updateIncidentStatus } from "@/lib/actions/incidents";

export default function IncidentStatusToggle({ id, status }: { id: string; status: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex gap-1.5">
      {status !== "IN_PROGRESS" && status !== "RESOLVED" && (
        <button
          disabled={pending}
          onClick={() => startTransition(() => updateIncidentStatus(id, "IN_PROGRESS"))}
          className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100 disabled:opacity-50"
        >
          In Progress
        </button>
      )}
      {status !== "RESOLVED" && (
        <button
          disabled={pending}
          onClick={() => startTransition(() => updateIncidentStatus(id, "RESOLVED"))}
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
        >
          Resolve
        </button>
      )}
      {status === "RESOLVED" && (
        <button
          disabled={pending}
          onClick={() => startTransition(() => updateIncidentStatus(id, "OPEN"))}
          className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
        >
          Reopen
        </button>
      )}
    </div>
  );
}
