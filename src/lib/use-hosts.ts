"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { HostsResponse } from "./types";

/** Polls /api/hosts on an interval and keeps the latest snapshot. */
export function useHosts(initial: HostsResponse, intervalMs = 10_000) {
  const [data, setData] = useState<HostsResponse>(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refresh = useCallback(async () => {
    setPending(true);
    try {
      const res = await fetch("/api/hosts", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData((await res.json()) as HostsResponse);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "failed to refresh");
    } finally {
      setPending(false);
    }
  }, []);

  useEffect(() => {
    let alive = true;
    const tick = async () => {
      if (!alive) return;
      if (document.visibilityState === "visible") await refresh();
      timer.current = setTimeout(tick, intervalMs);
    };
    timer.current = setTimeout(tick, intervalMs);
    return () => {
      alive = false;
      if (timer.current) clearTimeout(timer.current);
    };
  }, [refresh, intervalMs]);

  return { data, error, pending, refresh };
}
