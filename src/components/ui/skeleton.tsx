/**
 * Skeleton primitives for route-level loading UI.
 *
 * These mirror the real page shapes (header + stat grid + table panel) so the
 * fallback occupies the same space the content will, instead of a generic block
 * that reflows when data arrives. The `.skeleton` class (globals.css) supplies
 * the shimmer and already respects prefers-reduced-motion.
 *
 * Deliberately neutral slate — a skeleton should read as absent content, not as
 * brand chrome, so these never use brand-* tokens.
 */

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

/** Page title plus the action buttons that sit on the same row. */
export function SkeletonPageHeader({ actions = 2 }: { actions?: number }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <Skeleton className="h-7 w-48" />
      <div className="flex items-center gap-2">
        {Array.from({ length: actions }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-28" />
        ))}
      </div>
    </div>
  );
}

/** Matches the StatCard grid used across the list pages. */
export function SkeletonStatCards({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-24" />
      ))}
    </div>
  );
}

/** The bordered white panel with an optional tab strip and a table inside. */
export function SkeletonTable({
  rows = 8,
  cols = 6,
  tabs = 0,
}: {
  rows?: number;
  cols?: number;
  tabs?: number;
}) {
  return (
    <div className="card">
      {tabs > 0 && (
        <div className="flex gap-2 border-b border-slate-100 px-4 pt-3 pb-2">
          {Array.from({ length: tabs }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-24" />
          ))}
        </div>
      )}
      <div className="border-b border-slate-100 px-4 py-3">
        <div className="flex gap-4">
          {Array.from({ length: cols }).map((_, i) => (
            <Skeleton key={i} className="h-3 flex-1" />
          ))}
        </div>
      </div>
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex items-center gap-4 px-4 py-3.5">
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton key={c} className="h-4 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Standard list page: header, stats, then a table panel. */
export function SkeletonListPage({
  stats = 6,
  rows = 8,
  cols = 6,
  tabs = 0,
  actions = 2,
}: {
  stats?: number;
  rows?: number;
  cols?: number;
  tabs?: number;
  actions?: number;
}) {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading">
      <SkeletonPageHeader actions={actions} />
      {stats > 0 && <SkeletonStatCards count={stats} />}
      <SkeletonTable rows={rows} cols={cols} tabs={tabs} />
    </div>
  );
}

/** Detail pages: summary panel beside a sidebar of meta cards. */
export function SkeletonDetailPage() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading">
      <SkeletonPageHeader actions={2} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Skeleton className="h-56" />
          <Skeleton className="h-64" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-32" />
        </div>
      </div>
    </div>
  );
}

/** Create/edit forms: stacked labelled fields then a submit row. */
export function SkeletonFormPage({ fields = 8 }: { fields?: number }) {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading">
      <SkeletonPageHeader actions={1} />
      <div className="card p-5">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {Array.from({ length: fields }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
        <div className="mt-6 flex gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
    </div>
  );
}
