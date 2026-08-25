"use client";

import { cn } from "@/lib/cn";
import type { periodDelta } from "@/lib/funnel-period";

type Delta = ReturnType<typeof periodDelta>;

export function KpiSparkline({
  values,
  positive,
}: {
  values: number[];
  positive: boolean | null;
}) {
  if (values.length < 2 || values.every((v) => v === 0)) return null;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const span = Math.max(1, max - min);
  const width = 56;
  const height = 18;
  const points = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width;
      const y = height - ((value - min) / span) * (height - 2) - 1;
      return `${x},${y}`;
    })
    .join(" ");
  const stroke =
    positive === null ? "#94a3b8" : positive ? "#059669" : positive === false ? "#e11d48" : "#94a3b8";

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="mt-2 opacity-80"
      aria-hidden="true"
    >
      <polyline
        fill="none"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

export function PeriodDeltaBadge({
  delta,
  formatAbsolute,
  formatPercent,
  vsLabel,
}: {
  delta: Delta;
  formatAbsolute: (n: number) => string;
  formatPercent: (n: number) => string;
  vsLabel: string;
}) {
  const positive = delta.absolute === 0 ? null : delta.absolute > 0;
  return (
    <div className="mt-2 space-y-0.5">
      <p
        className={cn(
          "text-[11px] font-bold leading-4",
          positive === null && "text-bosporus-muted",
          positive === true && "text-emerald-700",
          positive === false && "text-rose-700"
        )}
      >
        {delta.absolute > 0 ? "+" : ""}
        {formatAbsolute(delta.absolute)}
        {delta.percent !== null ? ` (${delta.percent > 0 ? "+" : ""}${formatPercent(delta.percent)}%)` : ""}
      </p>
      <p className="text-[10px] font-medium text-bosporus-muted">{vsLabel}</p>
    </div>
  );
}
