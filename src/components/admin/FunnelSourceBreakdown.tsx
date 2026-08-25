"use client";

import { useMemo, useState } from "react";
import { RadioTower } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import { stageShare, type FunnelSourceBreakdown as SourceRow } from "@/lib/b2b-funnel-dashboard";
import type { AcquisitionSource } from "@/lib/acquisition";

type SourceMetric = "approved" | "addToCart" | "checkout" | "purchase";

interface FunnelSourceBreakdownProps {
  data: SourceRow[];
  labels: Record<AcquisitionSource, string>;
  metricLabels: Record<SourceMetric, string>;
  title: string;
  subtitle: string;
  sourceLabel: string;
  viewLabel: string;
  cartLabel: string;
  checkoutLabel: string;
  purchaseLabel: string;
  conversionLabel: string;
  noDataLabel: string;
  metaLabel: string;
  firstTouchNote: string;
}

const METRICS: SourceMetric[] = ["approved", "addToCart", "checkout", "purchase"];

export function FunnelSourceBreakdown({
  data,
  labels,
  metricLabels,
  title,
  subtitle,
  sourceLabel,
  viewLabel,
  cartLabel,
  checkoutLabel,
  purchaseLabel,
  conversionLabel,
  noDataLabel,
  metaLabel,
  firstTouchNote,
}: FunnelSourceBreakdownProps) {
  const [metric, setMetric] = useState<SourceMetric>("approved");
  const numberFormatter = useMemo(() => new Intl.NumberFormat(), []);
  const visibleRows = data.filter((row) =>
    [row.approved, row.firstLogin, row.viewItem, row.addToCart, row.checkout, row.purchase].some(
      (value) => value > 0
    )
  );
  const maximum = Math.max(1, ...data.map((row) => row[metric]));
  const metaApproved =
    (data.find((row) => row.source === "facebook")?.approved ?? 0) +
    (data.find((row) => row.source === "instagram")?.approved ?? 0);
  const percentFormatter = useMemo(
    () => new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }),
    []
  );

  return (
    <Card className="!rounded-3xl overflow-hidden md:col-span-2 xl:col-span-3" padding="none">
      <div className="flex flex-col gap-4 border-b border-bosporus-gray-100 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50">
            <RadioTower className="h-5 w-5 text-blue-700" />
          </div>
          <div>
            <h2 className="font-extrabold text-metro-navy">{title}</h2>
            <p className="mt-1 text-xs text-bosporus-muted">{subtitle}</p>
          </div>
        </div>
        <div className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-800">
          {metaLabel}: {numberFormatter.format(metaApproved)}
        </div>
      </div>

      <div className="p-5 sm:p-6">
        <div className="mb-5 flex max-w-full gap-1 overflow-x-auto pb-1" role="tablist">
          {METRICS.map((item) => (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={metric === item}
              onClick={() => setMetric(item)}
              className={cn(
                "shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition-colors",
                metric === item
                  ? "bg-metro-navy text-white"
                  : "bg-bosporus-gray-100 text-bosporus-muted hover:text-metro-navy"
              )}
            >
              {metricLabels[item]}
            </button>
          ))}
        </div>

        {visibleRows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-bosporus-gray-200 py-10 text-center text-sm font-semibold text-bosporus-muted">
            {noDataLabel}
          </div>
        ) : (
          <div className="space-y-3">
            {visibleRows.map((row) => (
              <div key={row.source} className="grid grid-cols-[7rem_1fr_2.5rem] items-center gap-3">
                <span className="truncate text-xs font-bold text-metro-navy">
                  {labels[row.source]}
                </span>
                <div className="h-2.5 overflow-hidden rounded-full bg-bosporus-gray-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-bosporus to-blue-400"
                    style={{ width: `${(row[metric] / maximum) * 100}%` }}
                  />
                </div>
                <span className="text-right text-sm font-black text-metro-navy">
                  {numberFormatter.format(row[metric])}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 overflow-x-auto rounded-2xl border border-bosporus-gray-100">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-bosporus-gray-50 text-xs uppercase tracking-wide text-bosporus-muted">
              <tr>
                <th className="px-4 py-3">{sourceLabel}</th>
                <th className="px-3 py-3 text-right">{metricLabels.approved}</th>
                <th className="px-3 py-3 text-right">{viewLabel}</th>
                <th className="px-3 py-3 text-right">{cartLabel}</th>
                <th className="px-3 py-3 text-right">{checkoutLabel}</th>
                <th className="px-3 py-3 text-right">{purchaseLabel}</th>
                <th className="px-4 py-3 text-right">{conversionLabel}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-bosporus-gray-100">
              {data.map((row) => {
                const conversion = stageShare(row.purchase, row.approved);
                return (
                  <tr key={row.source} className="bg-white">
                    <td className="px-4 py-3 font-bold text-metro-navy">{labels[row.source]}</td>
                    <td className="px-3 py-3 text-right">{row.approved}</td>
                    <td className="px-3 py-3 text-right">{row.viewItem}</td>
                    <td className="px-3 py-3 text-right">{row.addToCart}</td>
                    <td className="px-3 py-3 text-right">{row.checkout}</td>
                    <td className="px-3 py-3 text-right">{row.purchase}</td>
                    <td className="px-4 py-3 text-right font-bold text-bosporus">
                      {conversion === null ? "—" : `%${percentFormatter.format(conversion)}`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-xs leading-5 text-bosporus-muted">{firstTouchNote}</p>
      </div>
    </Card>
  );
}
