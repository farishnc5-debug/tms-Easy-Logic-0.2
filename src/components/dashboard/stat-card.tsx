import TrendLine from "@/components/charts/trend-line";
import type { LucideIcon } from "lucide-react";

export default function StatCard({
  icon: Icon,
  label,
  value,
  trend,
  trendUp,
  color,
  sparkline,
  interactive,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  trend?: string;
  trendUp?: boolean;
  color: string;
  sparkline?: { label: string; value: number }[];
  interactive?: boolean;
}) {
  return (
    <div className={`card p-4 sm:p-5 ${interactive ? "card-interactive h-full" : ""}`}>
      <div className="flex items-center gap-3.5">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset"
          style={{ backgroundColor: `${color}14`, color, boxShadow: `inset 0 0 0 1px ${color}22` }}
        >
          <Icon size={20} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-slate-500">{label}</p>
          <p className="stat-value text-2xl font-bold text-slate-900">{value}</p>
        </div>
      </div>
      {trend && (
        <p
          className={`mt-2 text-xs font-medium ${trendUp ? "text-emerald-600" : "text-red-500"}`}
        >
          {trendUp ? "↑" : "↓"} {trend} vs last week
        </p>
      )}
      {sparkline && (
        <div className="mt-2 -mx-1">
          <TrendLine data={sparkline} color={color} height={40} />
        </div>
      )}
    </div>
  );
}
