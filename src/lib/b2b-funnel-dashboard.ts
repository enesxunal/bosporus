import type { AcquisitionSource } from "./acquisition";
import {
  independentShare,
  periodDelta,
  type FunnelDays,
} from "./funnel-period";

export type { FunnelDays } from "./funnel-period";
export { independentShare, periodDelta } from "./funnel-period";

export interface FunnelTrendPoint {
  /** Calendar day `YYYY-MM-DD` or hour bucket `YYYY-MM-DDTHH:00:00.000Z`. */
  date: string;
  approved: number;
  firstLoginAfterApproval: number;
  addToCart: number;
  checkout: number;
  purchase: number;
}

export interface FunnelSourceBreakdown {
  source: AcquisitionSource;
  approved: number;
  firstLogin: number;
  viewItem: number;
  addToCart: number;
  checkout: number;
  purchase: number;
}

export interface PeriodTotals {
  approved: number;
  firstLoginAfterApproval: number;
  viewItem: number;
  addToCart: number;
  minOrderBlocked: number;
  checkout: number;
  purchase: number;
  quickOrder: number;
  favorite: number;
}

export interface B2bFunnelSummary {
  ok: true;
  days: FunnelDays;
  granularity: "hour" | "day";
  currentApproved: number;
  approved: number;
  firstLoginAfterApproval: number;
  viewItem: number;
  addToCart: number;
  minOrderBlocked: number;
  checkout: number;
  purchase: number;
  quickOrder: number;
  favorite: number;
  previous: PeriodTotals;
  trend: FunnelTrendPoint[];
  sources: FunnelSourceBreakdown[];
}

export interface B2bFunnelResponse {
  generatedAt: string;
  windows: Partial<Record<`${FunnelDays}`, B2bFunnelSummary>>;
}

export type FunnelInsight =
  | "lowReturnAfterApproval"
  | "cartCheckoutDropoff"
  | "checkoutWithoutPurchase"
  | "minOrderFriction"
  | "waitingForData";

export function percentage(value: number, base: number): number | null {
  if (base <= 0) return null;
  return (value / base) * 100;
}

/**
 * Prefer independentShare for stage-to-stage UI so independent distinct counts
 * never display as impossible sequential conversions above 100%.
 */
export function stageShare(value: number, base: number): number | null {
  return independentShare(value, base);
}

export function dropOff(from: number, to: number) {
  const count = Math.max(0, from - to);
  return {
    count,
    percentage: percentage(count, from),
  };
}

export function getFunnelInsights(summary: B2bFunnelSummary): FunnelInsight[] {
  const insights: FunnelInsight[] = [];
  const firstLoginRate = percentage(summary.firstLoginAfterApproval, summary.approved);
  const checkoutRate = percentage(summary.checkout, summary.addToCart);
  const minOrderRate = percentage(summary.minOrderBlocked, summary.approved);

  if (firstLoginRate !== null && firstLoginRate < 50) {
    insights.push("lowReturnAfterApproval");
  }
  if (checkoutRate !== null && checkoutRate < 25) {
    insights.push("cartCheckoutDropoff");
  }
  if (summary.checkout > 0 && summary.purchase === 0) {
    insights.push("checkoutWithoutPurchase");
  }
  if (minOrderRate !== null && summary.minOrderBlocked > 0 && minOrderRate >= 25) {
    insights.push("minOrderFriction");
  }

  if (insights.length === 0) {
    const hasData =
      summary.approved +
        summary.firstLoginAfterApproval +
        summary.viewItem +
        summary.addToCart +
        summary.checkout +
        summary.purchase >
      0;
    if (!hasData) insights.push("waitingForData");
  }

  return insights.slice(0, 3);
}

export function kpiPeriodDelta(
  current: number,
  previous: number
): ReturnType<typeof periodDelta> {
  return periodDelta(current, previous);
}
