const STAGE_COLOR = [
  "bg-slate-200",
  "bg-emerald-500",
  "bg-emerald-500",
  "bg-brand-500",
  "bg-purple-500",
  "bg-orange-500",
  "bg-slate-500",
  "bg-cyan-500",
  "bg-violet-500",
  "bg-emerald-600",
];

export default function CycleDots({
  stage,
  delayed,
  total = 6,
}: {
  stage: number;
  delayed?: boolean;
  total?: number;
}) {
  const dots = Array.from({ length: total }, (_, i) => i + 1);
  return (
    <div className="flex items-center gap-1">
      {dots.map((n) => {
        const active = n <= stage;
        const isCurrent = n === stage;
        const color = delayed && isCurrent ? "bg-red-500" : active ? STAGE_COLOR[n] : "bg-slate-200";
        return (
          <span
            key={n}
            className={`flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold text-white ${color} ${
              !active ? "!text-slate-400" : ""
            }`}
            style={!active ? { color: "#94a3b8", backgroundColor: "#e2e8f0" } : undefined}
          >
            {n}
          </span>
        );
      })}
    </div>
  );
}
