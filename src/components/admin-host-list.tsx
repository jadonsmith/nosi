"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Trash2Icon } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusPill } from "@/components/status-pill";
import { fmtAgo } from "@/lib/metrics";
import type { HostSummary } from "@/lib/types";

export function AdminHostList({ hosts }: { hosts: HostSummary[] }) {
  const [rows, setRows] = useState(hosts);
  const [busy, setBusy] = useState<string | null>(null);

  async function patch(hostname: string, body: Record<string, unknown>) {
    setBusy(hostname);
    try {
      const res = await fetch(`/api/hosts/${encodeURIComponent(hostname)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      toast.success(`${hostname} updated`);
    } catch {
      toast.error("Update failed");
    } finally {
      setBusy(null);
    }
  }

  async function remove(hostname: string) {
    if (!confirm(`Delete ${hostname} and all its heartbeats?`)) return;
    setBusy(hostname);
    try {
      const res = await fetch(`/api/hosts/${encodeURIComponent(hostname)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      setRows((r) => r.filter((h) => h.hostname !== hostname));
      toast.success(`${hostname} deleted`);
    } catch {
      toast.error("Delete failed");
    } finally {
      setBusy(null);
    }
  }

  if (rows.length === 0) {
    return (
      <p className="rounded-xl bg-card p-8 text-center text-sm text-muted-foreground ring-1 ring-foreground/10">
        No hosts registered.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Host</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[180px]">Label</TableHead>
            <TableHead className="w-[110px]">Lat</TableHead>
            <TableHead className="w-[110px]">Lon</TableHead>
            <TableHead className="w-[1%]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((h) => (
            <AdminRow
              key={h.hostname}
              host={h}
              busy={busy === h.hostname}
              onSave={patch}
              onDelete={remove}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function AdminRow({
  host,
  busy,
  onSave,
  onDelete,
}: {
  host: HostSummary;
  busy: boolean;
  onSave: (hostname: string, body: Record<string, unknown>) => void;
  onDelete: (hostname: string) => void;
}) {
  const [label, setLabel] = useState(host.label ?? "");
  const [lat, setLat] = useState(host.lat?.toString() ?? "");
  const [lon, setLon] = useState(host.lon?.toString() ?? "");

  const dirty =
    label !== (host.label ?? "") ||
    lat !== (host.lat?.toString() ?? "") ||
    lon !== (host.lon?.toString() ?? "");

  return (
    <TableRow>
      <TableCell>
        <Link
          href={`/hosts/${encodeURIComponent(host.hostname)}`}
          className="font-mono text-sm hover:underline"
        >
          {host.hostname}
        </Link>
        <div className="text-xs text-muted-foreground">
          {fmtAgo(host.secondsAgo)}
        </div>
      </TableCell>
      <TableCell>
        <StatusPill status={host.status} />
      </TableCell>
      <TableCell>
        <Input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="—"
        />
      </TableCell>
      <TableCell>
        <Input
          value={lat}
          onChange={(e) => setLat(e.target.value)}
          inputMode="decimal"
          placeholder="—"
        />
      </TableCell>
      <TableCell>
        <Input
          value={lon}
          onChange={(e) => setLon(e.target.value)}
          inputMode="decimal"
          placeholder="—"
        />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1.5">
          <Button
            size="xs"
            variant="outline"
            disabled={!dirty || busy}
            onClick={() =>
              onSave(host.hostname, {
                label: label.trim() || null,
                lat: lat.trim() === "" ? null : Number(lat),
                lon: lon.trim() === "" ? null : Number(lon),
              })
            }
          >
            Save
          </Button>
          <Button
            size="icon-xs"
            variant="destructive"
            aria-label={`Delete ${host.hostname}`}
            disabled={busy}
            onClick={() => onDelete(host.hostname)}
          >
            <Trash2Icon />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
