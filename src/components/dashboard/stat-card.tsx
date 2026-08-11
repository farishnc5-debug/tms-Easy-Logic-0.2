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
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  trend?: string;
  trendUp?: boolean;
  color: string;
  sparkline?: { label: string; value: number }[];
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: `${color}1a`, color }}
        >
          <Icon size={20} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs text-slate-500">{label}</p>
          <p className="text-xl font-bold text-slate-900">{value}</p>
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
