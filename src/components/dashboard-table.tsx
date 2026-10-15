"use client";

import { useMemo } from "react";
import Link from "next/link";
import { RefreshCwIcon } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/status-pill";
import { Meter } from "@/components/meter";
import { Sparkline } from "@/components/sparkline";
import { Stat } from "@/components/stat";
import { useHosts } from "@/lib/use-hosts";
import { fmtAgo, fmtKb, fmtDuration } from "@/lib/metrics";
import type { HostsResponse } from "@/lib/types";

export function DashboardTable({ initial }: { initial: HostsResponse }) {
  const { data, pending, refresh, error } = useHosts(initial);
  const hosts = data.hosts;

  const summary = useMemo(() => {
    const online = hosts.filter((h) => h.status === "healthy").length;
    const stale = hosts.filter((h) => h.status === "stale").length;
    const down = hosts.filter((h) => h.status === "down").length;
    const live = hosts.filter((h) => h.status !== "down");
    const avg = (sel: (h: (typeof hosts)[number]) => number) =>
      live.length ? live.reduce((a, h) => a + sel(h), 0) / live.length : 0;
    return {
      total: hosts.length,
      online,
      stale,
      down,
      avgCpu: avg((h) => h.cpuPct),
      avgMem: avg((h) => h.memPct),
    };
  }, [hosts]);

  const updated = new Date(data.now).toLocaleTimeString();

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="Hosts" value={summary.total} accent="brand" />
        <Stat label="Online" value={summary.online} accent="ok" />
        <Stat label="Stale" value={summary.stale} accent={summary.stale ? "warn" : undefined} />
        <Stat label="Offline" value={summary.down} accent={summary.down ? "down" : undefined} />
        <Stat label="Avg CPU" value={`${summary.avgCpu.toFixed(1)}%`} />
        <Stat label="Avg Memory" value={`${summary.avgMem.toFixed(0)}%`} />
      </div>

      <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
        <div className="flex items-center justify-between gap-3 border-b border-foreground/10 px-4 py-2.5">
          <h2 className="text-sm font-medium">Fleet</h2>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>
              {error ? (
                <span className="text-down">{error}</span>
              ) : (
                <>updated {updated}</>
              )}
            </span>
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label="Refresh now"
              onClick={refresh}
            >
              <RefreshCwIcon className={pending ? "animate-spin" : undefined} />
            </Button>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Status</TableHead>
              <TableHead>Host</TableHead>
              <TableHead className="w-[130px]">CPU</TableHead>
              <TableHead className="w-[150px]">Memory</TableHead>
              <TableHead className="w-[150px]">Disk</TableHead>
              <TableHead className="w-[110px] text-right">Trend</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {hosts.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  No heartbeats yet. Point an agent at{" "}
                  <code className="font-mono">/api/report</code>.
                </TableCell>
              </TableRow>
            )}
            {hosts.map((h) => (
              <TableRow key={h.hostname}>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <StatusPill status={h.status} />
                    <span className="text-xs text-muted-foreground">
                      {fmtAgo(h.secondsAgo)}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Link
                    href={`/hosts/${encodeURIComponent(h.hostname)}`}
                    className="font-mono text-sm font-medium hover:underline"
                  >
                    {h.hostname}
                  </Link>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {h.provider && <span>{h.provider}</span>}
                    {h.uptimeS != null && <span>· up {fmtDuration(h.uptimeS)}</span>}
                  </div>
                </TableCell>
                <TableCell>
                  <Meter value={h.cpuPct} />
                </TableCell>
                <TableCell>
                  <Meter
                    value={h.memPct}
                    sub={`${fmtKb(h.memUsedKb)} / ${fmtKb(h.memTotalKb)}`}
                  />
                </TableCell>
                <TableCell>
                  <Meter
                    value={h.diskPct}
                    sub={`${fmtKb(h.diskFreeKb)} free`}
                  />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end">
                    <Sparkline values={h.spark} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
