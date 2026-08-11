"use client";

import { AreaChart, Area, ResponsiveContainer, YAxis, XAxis, Tooltip } from "recharts";

export default function TrendLine({
  data,
  color = "#2563eb",
  height = 60,
  showAxes = false,
}: {
  data: { label: string; value: number }[];
  color?: string;
  height?: number;
  showAxes?: boolean;
}) {
  const gradientId = `grad-${color.replace("#", "")}`;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        {showAxes && <XAxis dataKey="label" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />}
        {showAxes && <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={30} />}
        <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          fill={`url(#${gradientId})`}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
