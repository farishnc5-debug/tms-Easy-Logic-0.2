import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  buildHref,
}: {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  buildHref: (page: number) => string;
}) {
  const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);

  const pages: number[] = [];
  const windowSize = 5;
  let from = Math.max(1, page - Math.floor(windowSize / 2));
  const to = Math.min(totalPages, from + windowSize - 1);
  from = Math.max(1, to - windowSize + 1);
  for (let p = from; p <= to; p++) pages.push(p);

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 sm:flex-row">
      <p className="text-xs text-slate-500">
        Showing {start} to {end} of {totalItems} entries
      </p>
      <div className="flex items-center gap-1">
        <Link
          href={buildHref(Math.max(1, page - 1))}
          className={`flex h-8 w-8 items-center justify-center rounded-lg border text-slate-500 ${
            page <= 1 ? "pointer-events-none opacity-40" : "border-slate-200 hover:bg-slate-50"
          }`}
        >
          <ChevronLeft size={15} />
        </Link>
        {from > 1 && <span className="px-1 text-xs text-slate-400">…</span>}
        {pages.map((p) => (
          <Link
            key={p}
            href={buildHref(p)}
            className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium ${
              p === page
                ? "bg-brand-600 text-white"
                : "border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {p}
          </Link>
        ))}
        {to < totalPages && <span className="px-1 text-xs text-slate-400">…</span>}
        <Link
          href={buildHref(Math.min(totalPages, page + 1))}
          className={`flex h-8 w-8 items-center justify-center rounded-lg border text-slate-500 ${
            page >= totalPages
              ? "pointer-events-none opacity-40"
              : "border-slate-200 hover:bg-slate-50"
          }`}
        >
          <ChevronRight size={15} />
        </Link>
      </div>
    </div>
  );
}
