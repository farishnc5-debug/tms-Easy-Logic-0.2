"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto mt-16 max-w-md rounded-xl border border-red-200 bg-white p-8 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
        <AlertTriangle size={24} />
      </div>
      <h2 className="text-lg font-semibold text-slate-900">Something went wrong</h2>
      <p className="mt-1 text-sm text-slate-500">
        This page hit an unexpected problem. Your data is safe — try again, and if it keeps happening
        let your administrator know.
      </p>
      <button
        onClick={reset}
        className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
      >
        <RotateCcw size={14} /> Try again
      </button>
    </div>
  );
}
