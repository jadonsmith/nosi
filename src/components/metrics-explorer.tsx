"use client";

import { useEffect, useState } from "react";
import { cn } from "cn";
import { MetricCharts } from "@/components/metric-charts";
import { RangePicker } from "@/components/range-picker";
import { Skeleton } from "@/components/ui/skeleton";
import type { HostDetailResponse, MetricRange } from "@/lib/types";

export function MetricsExplorer({
  hostnames,
  initialHost,
}: {
  hostnames: string[];
  initialHost?: string;
}) {
  const [host, setHost] = useState(initialHost ?? hostnames[0] ?? "");
  const [range, setRange] = useState<MetricRange>("24h");
  const [detail, setDetail] = useState<HostDetailResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!host) return;
    let alive = true;
    const run = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/hosts/${encodeURIComponent(host)}?range=${range}`,
          { cache: "no-store" },
        );
        const json = res.ok ? ((await res.json()) as HostDetailResponse) : null;
        if (alive) setDetail(json);
      } catch {
        if (alive) setDetail(null);
      } finally {
        if (alive) setLoading(false);
      }
    };
    void run();
    return () => {
      alive = false;
    };
  }, [host, range]);

  if (hostnames.length === 0) {
    return (
      <p className="rounded-xl bg-card p-10 text-center text-muted-foreground ring-1 ring-foreground/10">
        No hosts reporting yet.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {hostnames.map((h) => (
            <button
              key={h}
              type="button"
              onClick={() => setHost(h)}
              className={cn(
                "rounded-full px-3 py-1 font-mono text-xs transition-colors ring-1",
                h === host
                  ? "bg-foreground text-background ring-transparent"
                  : "text-muted-foreground ring-foreground/15 hover:text-foreground",
              )}
            >
              {h}
            </button>
          ))}
        </div>
        <RangePicker value={range} onChange={setRange} />
      </div>

      {loading && !detail ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-[200px]" />
          <Skeleton className="h-[200px]" />
          <Skeleton className="h-[200px]" />
        </div>
      ) : detail ? (
        <div className={cn(loading && "opacity-60 transition-opacity")}>
          <MetricCharts series={detail.series} range={detail.range} />
        </div>
      ) : (
        <p className="text-sm text-down">Could not load metrics for {host}.</p>
      )}
    </div>
  );
}
