"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

export type DonutDatum = { label: string; value: number; color: string };

export default function DonutChart({
  data,
  centerLabel,
  centerValue,
  size = 160,
}: {
  data: DonutDatum[];
  centerLabel?: string;
  centerValue?: string | number;
  size?: number;
}) {
  return (
    <div className="flex items-center gap-4">
      <div style={{ width: size, height: size }} className="relative shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              innerRadius="68%"
              outerRadius="100%"
              paddingAngle={2}
              strokeWidth={0}
            >
              {data.map((d, i) => (
                <Cell key={i} fill={d.color} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
        {centerValue != null && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-bold text-slate-800">{centerValue}</span>
            {centerLabel && <span className="text-[10px] text-slate-400">{centerLabel}</span>}
          </div>
        )}
      </div>
      <ul className="space-y-1.5">
        {data.map((d) => (
          <li key={d.label} className="flex items-center gap-2 text-sm">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
            <span className="text-slate-600">{d.label}</span>
            <span className="ml-auto font-medium text-slate-800">{d.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
