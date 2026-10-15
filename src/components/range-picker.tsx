"use client";

import { cn } from "cn";
import type { MetricRange } from "@/lib/types";

const RANGES: MetricRange[] = ["1h", "6h", "24h", "7d", "30d"];

export function RangePicker({
  value,
  onChange,
}: {
  value: MetricRange;
  onChange: (r: MetricRange) => void;
}) {
  return (
    <div className="inline-flex rounded-lg bg-muted p-0.5 text-sm">
      {RANGES.map((r) => (
        <button
          key={r}
          type="button"
          onClick={() => onChange(r)}
          className={cn(
            "rounded-md px-2.5 py-1 font-medium transition-colors",
            value === r
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {r}
        </button>
      ))}
    </div>
  );
}
