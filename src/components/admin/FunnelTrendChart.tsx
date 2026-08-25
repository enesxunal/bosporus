"use client";

import { useId, useMemo, useState } from "react";
import { Activity } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

export interface TrendMetricOption<T extends string = string> {
  key: T;
  color: string;
  label: string;
}

interface FunnelTrendChartProps<T extends string> {
  data: Array<Record<T, number> & { date: string }>;
  locale: string;
  title: string;
  emptyLabel: string;
  metrics: Array<TrendMetricOption<T>>;
  granularity?: "hour" | "day";
  defaultMetric?: T;
}

const CHART_WIDTH = 800;
const CHART_HEIGHT = 260;
const PADDING = { top: 24, right: 20, bottom: 38, left: 44 };

export function FunnelTrendChart<T extends string>({
  data,
  locale,
  title,
  emptyLabel,
  metrics,
  granularity = "day",
  defaultMetric,
}: FunnelTrendChartProps<T>) {
  const initial = defaultMetric ?? metrics[0]?.key;
  const [metric, setMetric] = useState<T>(initial);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const gradientId = useId().replace(/:/g, "");
  const activeMetric = metrics.find((item) => item.key === metric) ?? metrics[0];
  const plotWidth = CHART_WIDTH - PADDING.left - PADDING.right;
  const plotHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom;
  const maximum = Math.max(1, ...data.map((point) => Number(point[metric] ?? 0)));

  const coordinates = useMemo(
    () =>
      data.map((point, index) => ({
        x:
          PADDING.left +
          (data.length <= 1 ? plotWidth / 2 : (index / (data.length - 1)) * plotWidth),
        y: PADDING.top + plotHeight - (Number(point[metric] ?? 0) / maximum) * plotHeight,
        point,
      })),
    [data, maximum, metric, plotHeight, plotWidth]
  );

  const linePath = coordinates
    .map(({ x, y }, index) => `${index === 0 ? "M" : "L"} ${x} ${y}`)
    .join(" ");
  const areaPath =
    coordinates.length === 0
      ? ""
      : `${linePath} L ${coordinates.at(-1)?.x ?? 0} ${PADDING.top + plotHeight} L ${
          coordinates[0]?.x ?? 0
        } ${PADDING.top + plotHeight} Z`;
  const hasData = data.some((point) => Number(point[metric] ?? 0) > 0);
  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale === "tr" ? "tr-TR" : "de-DE", {
        day: "2-digit",
        month: "short",
        ...(granularity === "hour" ? { hour: "2-digit", minute: "2-digit" } : {}),
      }),
    [granularity, locale]
  );

  const formatBucket = (raw: string) => {
    const iso = raw.includes("T") ? raw : `${raw}T00:00:00Z`;
    return dateFormatter.format(new Date(iso));
  };

  const hovered = hoveredIndex === null ? null : coordinates[hoveredIndex];
  const xLabelIndexes = Array.from(
    new Set([0, Math.floor((data.length - 1) / 2), data.length - 1])
  ).filter((index) => index >= 0);

  if (!activeMetric) return null;

  return (
    <Card className="!rounded-3xl overflow-hidden" padding="none">
      <div className="space-y-4 border-b border-bosporus-gray-100 p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-bosporus/10">
            <Activity className="h-5 w-5 text-bosporus" />
          </div>
          <div className="min-w-0">
            <h2 className="font-extrabold text-metro-navy">{title}</h2>
            <p className="text-xs text-bosporus-muted">{activeMetric.label}</p>
          </div>
        </div>
        <div
          className="flex flex-wrap gap-1.5"
          role="tablist"
          aria-label={title}
        >
          {metrics.map((item) => (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={metric === item.key}
              onClick={() => {
                setMetric(item.key);
                setHoveredIndex(null);
              }}
              className={cn(
                "inline-flex max-w-full items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-colors",
                metric === item.key
                  ? "bg-metro-navy text-white"
                  : "bg-bosporus-gray-100 text-bosporus-muted hover:text-metro-navy"
              )}
            >
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: item.color }}
                aria-hidden="true"
              />
              <span className="whitespace-normal text-left leading-snug">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="relative p-3 sm:p-6">
        <svg
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          className="h-auto w-full min-w-0"
          role="img"
          aria-label={`${title}: ${activeMetric.label}`}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={activeMetric.color} stopOpacity="0.28" />
              <stop offset="100%" stopColor={activeMetric.color} stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {[0, 0.5, 1].map((ratio) => {
            const y = PADDING.top + plotHeight * ratio;
            const value = Math.round(maximum * (1 - ratio));
            return (
              <g key={ratio}>
                <line
                  x1={PADDING.left}
                  x2={CHART_WIDTH - PADDING.right}
                  y1={y}
                  y2={y}
                  stroke="#e5e7eb"
                  strokeDasharray="4 5"
                />
                <text
                  x={PADDING.left - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-bosporus-muted text-[11px]"
                >
                  {value}
                </text>
              </g>
            );
          })}

          {hasData && (
            <>
              <path d={areaPath} fill={`url(#${gradientId})`} />
              <path
                d={linePath}
                fill="none"
                stroke={activeMetric.color}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </>
          )}

          {coordinates.map(({ x, y, point }, index) => {
            const hitWidth = plotWidth / Math.max(1, data.length);
            const value = Number(point[metric] ?? 0);
            return (
              <g key={point.date}>
                <rect
                  x={x - hitWidth / 2}
                  y={PADDING.top}
                  width={hitWidth}
                  height={plotHeight}
                  fill="transparent"
                  onMouseEnter={() => setHoveredIndex(index)}
                />
                {(hoveredIndex === index || (data.length <= 14 && value > 0)) && (
                  <circle
                    cx={x}
                    cy={y}
                    r={hoveredIndex === index ? 5 : 3}
                    fill="white"
                    stroke={activeMetric.color}
                    strokeWidth="3"
                    pointerEvents="none"
                  />
                )}
              </g>
            );
          })}

          {xLabelIndexes.map((index) => {
            const coordinate = coordinates[index];
            if (!coordinate) return null;
            return (
              <text
                key={coordinate.point.date}
                x={coordinate.x}
                y={CHART_HEIGHT - 8}
                textAnchor={
                  index === 0 ? "start" : index === data.length - 1 ? "end" : "middle"
                }
                className="fill-bosporus-muted text-[11px]"
              >
                {formatBucket(coordinate.point.date)}
              </text>
            );
          })}

          {hovered && (() => {
            const value = Number(hovered.point[metric] ?? 0);
            const dateLabel = formatBucket(hovered.point.date);
            const valueLabel = `${activeMetric.label}: ${value}`;
            // SVG <rect> has no auto-size — estimate from the longest line so digits are never clipped.
            const tooltipWidth = Math.min(
              340,
              Math.max(148, 28 + Math.ceil(Math.max(dateLabel.length, valueLabel.length) * 7.4))
            );
            const tooltipX = Math.min(
              CHART_WIDTH - tooltipWidth - 8,
              Math.max(PADDING.left, hovered.x - tooltipWidth / 2)
            );
            return (
              <>
                <line
                  x1={hovered.x}
                  x2={hovered.x}
                  y1={PADDING.top}
                  y2={PADDING.top + plotHeight}
                  stroke={activeMetric.color}
                  strokeDasharray="3 4"
                  opacity="0.45"
                  pointerEvents="none"
                />
                <g transform={`translate(${tooltipX}, 8)`} pointerEvents="none">
                  <rect width={tooltipWidth} height="50" rx="10" fill="#172554" />
                  <text x="12" y="19" className="fill-white/70 text-[10px]">
                    {dateLabel}
                  </text>
                  <text x="12" y="38" className="fill-white text-[13px] font-bold">
                    {valueLabel}
                  </text>
                </g>
              </>
            );
          })()}
        </svg>

        {!hasData && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center pt-16">
            <p className="rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-bosporus-muted shadow-sm">
              {emptyLabel}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
