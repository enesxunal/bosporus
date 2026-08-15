export type FunnelDays = 7 | 30 | 90;

export interface FunnelTrendPoint {
  date: string;
  approved: number;
  firstLoginAfterApproval: number;
  addToCart: number;
  checkout: number;
  purchase: number;
}

export interface B2bFunnelSummary {
  ok: true;
  days: FunnelDays;
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
  trend: FunnelTrendPoint[];
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
