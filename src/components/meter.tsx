import { cn } from "cn";
import { loadBucket } from "@/lib/metrics";

const BAR: Record<ReturnType<typeof loadBucket>, string> = {
  ok: "bg-ok",
  warn: "bg-warn",
  down: "bg-down",
};

export function Meter({
  value,
  label,
  sub,
  className,
}: {
  value: number;
  label?: string;
  sub?: string;
  className?: string;
}) {
  const pct = Math.min(100, Math.max(0, value));
  const bucket = loadBucket(pct);
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-mono text-sm tabular-nums">
          {pct.toFixed(pct < 10 ? 1 : 0)}%
        </span>
        {sub && (
          <span className="font-mono text-xs text-muted-foreground tabular-nums">
            {sub}
          </span>
        )}
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-foreground/10">
        <div
          className={cn("h-full rounded-full transition-[width] duration-500", BAR[bucket])}
          style={{ width: `${pct}%` }}
        />
      </div>
      {label && (
        <span className="text-[0.7rem] tracking-wide text-muted-foreground uppercase">
          {label}
        </span>
      )}
    </div>
  );
}
