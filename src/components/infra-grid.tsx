"use client";

import Link from "next/link";
import { ArrowUpRightIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatusPill } from "@/components/status-pill";
import { Meter } from "@/components/meter";
import { Sparkline } from "@/components/sparkline";
import { useHosts } from "@/lib/use-hosts";
import { fmtAgo, fmtKb, fmtDuration } from "@/lib/metrics";
import type { HostsResponse } from "@/lib/types";

export function InfraGrid({ initial }: { initial: HostsResponse }) {
  const { data } = useHosts(initial);

  if (data.hosts.length === 0) {
    return (
      <p className="rounded-xl bg-card p-10 text-center text-muted-foreground ring-1 ring-foreground/10">
        No hosts yet.
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {data.hosts.map((h) => (
        <Card key={h.hostname} className="gap-3">
          <div className="flex items-start justify-between gap-2 px-4">
            <div className="min-w-0">
              <Link
                href={`/hosts/${encodeURIComponent(h.hostname)}`}
                className="group flex items-center gap-1 font-mono text-sm font-medium hover:underline"
              >
                <span className="truncate">{h.hostname}</span>
                <ArrowUpRightIcon className="size-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-60" />
              </Link>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                {h.provider && <span>{h.provider}</span>}
                {h.city && (
                  <span>
                    · {h.city}
                    {h.country ? `, ${h.country}` : ""}
                  </span>
                )}
              </div>
            </div>
            <StatusPill status={h.status} />
          </div>

          <div className="grid grid-cols-3 gap-3 px-4">
            <Meter value={h.cpuPct} label="cpu" />
            <Meter value={h.memPct} label="mem" />
            <Meter value={h.diskPct} label="disk" />
          </div>

          <div className="px-4">
            <Sparkline values={h.spark} width={280} height={36} className="w-full" />
          </div>

          <dl className="grid grid-cols-2 gap-x-4 gap-y-1 border-t border-foreground/10 px-4 pt-3 text-xs">
            <Row label="Last seen" value={fmtAgo(h.secondsAgo)} />
            <Row label="Uptime" value={fmtDuration(h.uptimeS)} />
            <Row
              label="Load"
              value={
                h.load1 != null
                  ? `${h.load1.toFixed(2)} ${h.load5?.toFixed(2) ?? "—"} ${h.load15?.toFixed(2) ?? "—"}`
                  : "—"
              }
            />
            <Row label="Memory" value={`${fmtKb(h.memUsedKb)} / ${fmtKb(h.memTotalKb)}`} />
            <Row label="Disk free" value={fmtKb(h.diskFreeKb)} />
            <Row label="IP" value={h.ip ?? "—"} mono />
          </dl>
        </Card>
      ))}
    </div>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={mono ? "font-mono tabular-nums" : "tabular-nums"}>{value}</dd>
    </div>
  );
}
