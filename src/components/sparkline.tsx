import { cn } from "cn";

/** Tiny inline SVG sparkline. Values are 0..100 (CPU %). */
export function Sparkline({
  values,
  width = 96,
  height = 28,
  className,
}: {
  values: number[];
  width?: number;
  height?: number;
  className?: string;
}) {
  if (!values.length) {
    return (
      <div
        className={cn("text-muted-foreground/50 text-xs", className)}
        style={{ width }}
      >
        —
      </div>
    );
  }

  const max = Math.max(10, ...values);
  const min = Math.min(0, ...values);
  const span = max - min || 1;
  const n = values.length;
  const stepX = n > 1 ? width / (n - 1) : width;

  const pts = values.map((v, i) => {
    const x = i * stepX;
    const y = height - ((v - min) / span) * (height - 2) - 1;
    return [x, y] as const;
  });

  const line = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${width},${height} L0,${height} Z`;
  const last = values[values.length - 1]!;
  const stroke =
    last >= 90 ? "var(--down)" : last >= 70 ? "var(--warn)" : "var(--chart-1)";
  const id = `spark-${Math.round(pts[0]![1] * 1000) % 100000}`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn("overflow-visible", className)}
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity={0.28} />
          <stop offset="100%" stopColor={stroke} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path
        d={line}
        fill="none"
        stroke={stroke}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx={pts[pts.length - 1]![0]} cy={pts[pts.length - 1]![1]} r={2} fill={stroke} />
    </svg>
  );
}
