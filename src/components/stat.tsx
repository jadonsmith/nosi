import { cn } from "cn";

export function Stat({
  label,
  value,
  hint,
  accent,
  className,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  accent?: "ok" | "warn" | "down" | "brand";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex flex-col gap-1 overflow-hidden rounded-xl bg-card px-4 py-3 ring-1 ring-foreground/10",
        className,
      )}
    >
      <span className="text-[0.7rem] font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </span>
      <span
        className={cn(
          "font-mono text-2xl leading-none font-semibold tabular-nums",
          accent === "ok" && "text-ok",
          accent === "warn" && "text-warn",
          accent === "down" && "text-down",
          accent === "brand" && "brand-text",
        )}
      >
        {value}
      </span>
      {hint && (
        <span className="text-xs text-muted-foreground">{hint}</span>
      )}
    </div>
  );
}
