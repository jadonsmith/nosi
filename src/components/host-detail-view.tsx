"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2Icon, SaveIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusPill } from "@/components/status-pill";
import { Meter } from "@/components/meter";
import { MetricCharts } from "@/components/metric-charts";
import { RangePicker } from "@/components/range-picker";
import { fmtAgo, fmtKb, fmtDuration } from "@/lib/metrics";
import type { HostDetailResponse, MetricRange } from "@/lib/types";

export function HostDetailView({
  initial,
  canAdmin,
}: {
  initial: HostDetailResponse;
  canAdmin: boolean;
}) {
  const router = useRouter();
  const [detail, setDetail] = useState(initial);
  const [range, setRange] = useState<MetricRange>(initial.range);
  const [busy, setBusy] = useState(false);
  const hostname = initial.host.hostname;

  useEffect(() => {
    let alive = true;
    const run = async () => {
      try {
        const res = await fetch(
          `/api/hosts/${encodeURIComponent(hostname)}?range=${range}`,
          { cache: "no-store" },
        );
        if (alive && res.ok) {
          setDetail((await res.json()) as HostDetailResponse);
        }
      } catch {
        /* keep last good snapshot */
      }
    };
    void run();
    const id = setInterval(() => {
      if (document.visibilityState === "visible") void run();
    }, 15_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [hostname, range]);

  const { host } = detail;
  const l = host.latest;

  const [label, setLabel] = useState(host.label ?? "");
  const [lat, setLat] = useState(host.lat?.toString() ?? "");
  const [lon, setLon] = useState(host.lon?.toString() ?? "");

  async function save() {
    setBusy(true);
    try {
      const res = await fetch(`/api/hosts/${encodeURIComponent(hostname)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          label: label.trim() || null,
          lat: lat.trim() === "" ? null : Number(lat),
          lon: lon.trim() === "" ? null : Number(lon),
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const nextLabel = label.trim() || null;
      const nextLat = lat.trim() === "" ? null : Number(lat);
      const nextLon = lon.trim() === "" ? null : Number(lon);
      setDetail((d) => ({
        ...d,
        host: { ...d.host, label: nextLabel, lat: nextLat, lon: nextLon },
      }));
      toast.success("Host updated");
    } catch {
      toast.error("Update failed");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm(`Delete ${hostname} and all its heartbeats?`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/hosts/${encodeURIComponent(hostname)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      toast.success("Host deleted");
      router.push("/");
      router.refresh();
    } catch {
      toast.error("Delete failed");
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-mono text-xl font-semibold">{hostname}</h1>
            <StatusPill status={host.status} />
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            {host.label && <span>{host.label}</span>}
            {host.provider && <span>{host.provider}</span>}
            {(host.city || host.country) && (
              <span>
                {[host.city, host.country].filter(Boolean).join(", ")}
              </span>
            )}
            {host.ip && <span className="font-mono">{host.ip}</span>}
            <span>seen {fmtAgo(host.secondsAgo)}</span>
            {l?.uptimeS != null && <span>up {fmtDuration(l.uptimeS)}</span>}
          </div>
        </div>
        <RangePicker value={range} onChange={setRange} />
      </div>

      {l && (
        <div className="grid grid-cols-2 gap-4 rounded-xl bg-card p-4 ring-1 ring-foreground/10 sm:grid-cols-4">
          <Meter value={l.cpuPct} label="CPU" />
          <Meter
            value={l.memPct}
            label="Memory"
            sub={`${fmtKb(l.memUsedKb)} / ${fmtKb(l.memTotalKb)}`}
          />
          <Meter
            value={l.diskPct}
            label="Disk"
            sub={`${fmtKb(l.diskFreeKb)} free`}
          />
          <div className="flex flex-col gap-1">
            <span className="font-mono text-sm tabular-nums">
              {l.load1 != null ? l.load1.toFixed(2) : "—"}
            </span>
            <span className="font-mono text-xs text-muted-foreground tabular-nums">
              {l.load5?.toFixed(2) ?? "—"} / {l.load15?.toFixed(2) ?? "—"}
            </span>
            <span className="text-[0.7rem] tracking-wide text-muted-foreground uppercase">
              load 1 / 5 / 15
            </span>
          </div>
        </div>
      )}

      <MetricCharts series={detail.series} range={detail.range} />

      {canAdmin && (
        <div className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
          <h2 className="mb-3 text-sm font-medium">Admin</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="label">Label</Label>
              <Input
                id="label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. primary db"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="lat">Latitude</Label>
              <Input
                id="lat"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                inputMode="decimal"
                placeholder="40.71"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="lon">Longitude</Label>
              <Input
                id="lon"
                value={lon}
                onChange={(e) => setLon(e.target.value)}
                inputMode="decimal"
                placeholder="-74.0"
              />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <Button onClick={save} disabled={busy} size="sm">
              <SaveIcon />
              Save
            </Button>
            <Button
              onClick={remove}
              disabled={busy}
              variant="destructive"
              size="sm"
            >
              <Trash2Icon />
              Delete host
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
