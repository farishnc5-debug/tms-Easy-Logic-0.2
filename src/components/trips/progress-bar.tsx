export default function ProgressBar({ pct, delayed }: { pct: number; delayed?: boolean }) {
  return (
    <div className="w-28">
      <div className="mb-0.5 flex items-center justify-between text-[10px] font-medium text-slate-500">
        <span>{pct}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${delayed ? "bg-red-500" : "bg-brand-600"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
