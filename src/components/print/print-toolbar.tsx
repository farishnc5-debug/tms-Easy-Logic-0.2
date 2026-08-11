"use client";

import Link from "next/link";
import { Printer, ArrowLeft, Paperclip, Eraser } from "lucide-react";
import { useRouter } from "next/navigation";

export default function PrintToolbar({
  backHref,
  attachmentsHref,
  attachmentsActive = false,
  attachmentsCount = 0,
  secondaryToggleHref,
  secondaryToggleActive = false,
  secondaryToggleLabel,
  secondaryToggleActiveLabel,
}: {
  backHref: string;
  // When set, shows a second button that opens the document WITH all its
  // attachments appended as extra pages (then print once = everything)
  attachmentsHref?: string;
  attachmentsActive?: boolean;
  attachmentsCount?: number;
  // Generic query-param-driven toggle button (e.g. "print with a blank
  // customer section" on quotations) — same on/off link pattern as above.
  secondaryToggleHref?: string;
  secondaryToggleActive?: boolean;
  secondaryToggleLabel?: string;
  secondaryToggleActiveLabel?: string;
}) {
  const router = useRouter();
  return (
    <div className="no-print sticky top-0 z-10 flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white px-6 py-3 shadow-sm">
      <button
        onClick={() => router.push(backHref)}
        className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3.5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
      >
        <ArrowLeft size={15} /> Back
      </button>
      <div className="flex items-center gap-2">
        {attachmentsHref && (
          <Link
            href={attachmentsHref}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium ${
              attachmentsActive
                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                : "border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            }`}
          >
            <Paperclip size={15} />
            {attachmentsActive
              ? "Attachments included ✓"
              : `Print / Download with Attachments (${attachmentsCount})`}
          </Link>
        )}
        {secondaryToggleHref && (
          <Link
            href={secondaryToggleHref}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium ${
              secondaryToggleActive
                ? "bg-amber-600 text-white hover:bg-amber-700"
                : "border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100"
            }`}
          >
            <Eraser size={15} />
            {secondaryToggleActive ? secondaryToggleActiveLabel : secondaryToggleLabel}
          </Link>
        )}
        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          <Printer size={15} /> Print / Save as PDF
        </button>
      </div>
    </div>
  );
}
