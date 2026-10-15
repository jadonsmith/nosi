"use client";

import { useEffect, useMemo, useState } from "react";
import { geoNaturalEarth1, geoPath, geoGraticule10 } from "d3-geo";
import { feature } from "topojson-client";
import { useHosts } from "@/lib/use-hosts";
import { STATUS_LABEL, type HostStatus } from "@/lib/metrics";
import type { HostsResponse } from "@/lib/types";

const W = 960;
const H = 500;

const STATUS_COLOR: Record<HostStatus, string> = {
  healthy: "var(--ok)",
  stale: "var(--warn)",
  down: "var(--down)",
};

export function WorldMap({ initial }: { initial: HostsResponse }) {
  const { data } = useHosts(initial, 15_000);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [land, setLand] = useState<any>(null);
  const [hover, setHover] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/countries-110m.json")
      .then((r) => r.json())
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((topo: any) => {
        if (!alive) return;
        setLand(feature(topo, topo.objects.countries));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const { path, projection } = useMemo(() => {
    const p = geoNaturalEarth1().fitExtent(
      [
        [8, 8],
        [W - 8, H - 8],
      ],
      { type: "Sphere" },
    );
    return { path: geoPath(p), projection: p };
  }, []);

  const located = data.hosts.filter((h) => h.lat != null && h.lon != null);
  const missing = data.hosts.filter((h) => h.lat == null || h.lon == null);

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-auto w-full"
          role="img"
          aria-label="World map of hosts"
        >
          <path
            d={path({ type: "Sphere" }) ?? ""}
            className="fill-foreground/[0.02] stroke-foreground/10"
          />
          <path
            d={path(geoGraticule10()) ?? ""}
            className="fill-none stroke-foreground/[0.06]"
            strokeWidth={0.5}
          />
          {land && (
            <path
              d={path(land) ?? ""}
              className="fill-foreground/10 stroke-background"
              strokeWidth={0.5}
            />
          )}
          {located.map((h) => {
            const pt = projection([h.lon!, h.lat!]);
            if (!pt) return null;
            const color = STATUS_COLOR[h.status];
            const active = hover === h.hostname;
            return (
              <g
                key={h.hostname}
                transform={`translate(${pt[0]},${pt[1]})`}
                onMouseEnter={() => setHover(h.hostname)}
                onMouseLeave={() => setHover(null)}
                className="cursor-pointer"
              >
                {h.status === "healthy" && (
                  <circle r={5} fill={color} className="nosi-ping" />
                )}
                <circle
                  r={active ? 6 : 4}
                  fill={color}
                  stroke="var(--background)"
                  strokeWidth={1.5}
                  className="transition-all"
                />
                {active && (
                  <g transform="translate(10,-10)">
                    <rect
                      x={0}
                      y={-14}
                      width={Math.max(120, h.hostname.length * 7.2)}
                      height={34}
                      rx={6}
                      className="fill-popover stroke-border"
                    />
                    <text
                      x={8}
                      y={-1}
                      className="fill-foreground font-mono text-[10px]"
                    >
                      {h.hostname}
                    </text>
                    <text
                      x={8}
                      y={12}
                      className="fill-muted-foreground text-[9px]"
                    >
                      {STATUS_LABEL[h.status]} · CPU {h.cpuPct.toFixed(0)}% · mem{" "}
                      {h.memPct.toFixed(0)}%
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        {(["healthy", "stale", "down"] as HostStatus[]).map((s) => (
          <span key={s} className="inline-flex items-center gap-1.5">
            <span
              className="size-2 rounded-full"
              style={{ background: STATUS_COLOR[s] }}
            />
            {STATUS_LABEL[s]}
          </span>
        ))}
        <span className="ml-auto">
          {located.length} of {data.hosts.length} hosts located
        </span>
      </div>

      {missing.length > 0 && (
        <div className="rounded-xl bg-card p-4 text-sm ring-1 ring-foreground/10">
          <p className="mb-2 font-medium">No location yet</p>
          <div className="flex flex-wrap gap-2">
            {missing.map((h) => (
              <span
                key={h.hostname}
                className="rounded-full bg-muted px-2 py-0.5 font-mono text-xs"
              >
                {h.hostname}
              </span>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Locations come from best-effort IP geolocation on first contact, or
            set them by hand in the admin panel.
          </p>
        </div>
      )}
    </div>
  );
}
