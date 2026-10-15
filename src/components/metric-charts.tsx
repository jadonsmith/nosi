"use client";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SeriesPoint, MetricRange } from "@/lib/types";

const METRICS = [
  { key: "cpu", label: "CPU", color: "var(--chart-1)", unit: "%" },
  { key: "mem", label: "Memory", color: "var(--chart-2)", unit: "%" },
  { key: "disk", label: "Disk", color: "var(--chart-3)", unit: "%" },
] as const;

function tickFormatter(range: MetricRange) {
  return (v: string) => {
    const d = new Date(v);
    if (range === "1h" || range === "6h" || range === "24h") {
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  };
}

export function MetricCharts({
  series,
  range,
}: {
  series: SeriesPoint[];
  range: MetricRange;
}) {
  const fmt = useMemo(() => tickFormatter(range), [range]);

  if (series.length === 0) {
    return (
      <div className="grid h-40 place-items-center rounded-xl bg-card text-sm text-muted-foreground ring-1 ring-foreground/10">
        No samples in this window.
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {METRICS.map((m) => (
        <div
          key={m.key}
          className="rounded-xl bg-card p-3 ring-1 ring-foreground/10"
        >
          <div className="mb-1 flex items-baseline justify-between">
            <span className="text-sm font-medium">{m.label}</span>
            <span className="font-mono text-xs text-muted-foreground tabular-nums">
              {formatLast(series, m.key)}
            </span>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={series} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id={`fill-${m.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={m.color} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={m.color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--border)"
                vertical={false}
              />
              <XAxis
                dataKey="t"
                tickFormatter={fmt}
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                minTickGap={28}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                ticks={[0, 25, 50, 75, 100]}
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
                width={34}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                labelFormatter={(v) => new Date(v as string).toLocaleString()}
                formatter={(value) => {
                  const n =
                    typeof value === "number" ? value : Number(value);
                  return [
                    `${Number.isFinite(n) ? n.toFixed(1) : "—"}${m.unit}`,
                    m.label,
                  ];
                }}
              />
              <Area
                type="monotone"
                dataKey={m.key}
                stroke={m.color}
                strokeWidth={1.75}
                fill={`url(#fill-${m.key})`}
                isAnimationActive={false}
                connectNulls
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ))}
    </div>
  );
}

function formatLast(series: SeriesPoint[], key: "cpu" | "mem" | "disk") {
  for (let i = series.length - 1; i >= 0; i--) {
    const v = series[i]![key];
    if (v != null) return `${v.toFixed(1)}%`;
  }
  return "—";
}
