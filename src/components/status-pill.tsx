import { cn } from "cn";
import type { HostStatus } from "@/lib/metrics";

const MAP: Record<
  HostStatus,
  { label: string; dot: string; text: string; ring: string }
> = {
  healthy: {
    label: "online",
    dot: "bg-ok",
    text: "text-ok",
    ring: "ring-ok/25",
  },
  stale: {
    label: "stale",
    dot: "bg-warn",
    text: "text-warn",
    ring: "ring-warn/25",
  },
  down: {
    label: "offline",
    dot: "bg-down",
    text: "text-down",
    ring: "ring-down/25",
  },
};

export function StatusPill({
  status,
  className,
}: {
  status: HostStatus;
  className?: string;
}) {
  const s = MAP[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1",
        s.text,
        s.ring,
        "bg-current/5",
        className,
      )}
    >
      <span className="relative flex size-1.5">
        {status === "healthy" && (
          <span
            className={cn(
              "nosi-ping absolute inline-flex size-full rounded-full",
              s.dot,
            )}
          />
        )}
        <span
          className={cn(
            "relative inline-flex size-1.5 rounded-full",
            s.dot,
          )}
        />
      </span>
      {s.label}
    </span>
  );
}
