import type { AcquisitionSource } from "./acquisition";
import type { DeviceCategory } from "./site-funnel-shared";
import type { FunnelDays } from "./funnel-period";

export { percentage, dropOff, stageShare, periodDelta } from "./b2b-funnel-dashboard";
export type { FunnelDays } from "./funnel-period";

export type DeviceBucket = DeviceCategory | "unknown";

export interface SiteFunnelSourceRow {
  source: AcquisitionSource;
  visitor: number;
  view: number;
  cart: number;
  register: number;
  application: number;
  approved: number;
  checkout: number;
  purchase: number;
}

export interface SiteFunnelDeviceRow {
  device: DeviceBucket;
  view: number;
  cart: number;
  register: number;
  checkout: number;
  purchase: number;
}

export interface SiteFunnelTrendPoint {
  date: string;
  visitors: number;
  productView: number;
  addToCart: number;
  registerLogin: number;
  application: number;
  approved: number;
  checkout: number;
  purchase: number;
}

export interface SitePeriodTotals {
  visitors: number;
  sessions: number;
  visit: number;
  productView: number;
  addToCart: number;
  cartView: number;
  registerLogin: number;
  application: number;
  approved: number;
  checkout: number;
  purchase: number;
  minOrderBlocked: number;
  quickOrder: number;
}

export interface SiteFunnelSummary {
  ok: true;
  days: FunnelDays;
  granularity: "hour" | "day";
  visitors: number;
  sessions: number;
  visit: number;
  productView: number;
  addToCart: number;
  cartView: number;
  registerLogin: number;
  application: number;
  approved: number;
  checkout: number;
  purchase: number;
  minOrderBlocked: number;
  quickOrder: number;
  previous: SitePeriodTotals;
  trend: SiteFunnelTrendPoint[];
  sources: SiteFunnelSourceRow[];
  devices: SiteFunnelDeviceRow[];
}

export interface SiteFunnelResponse {
  generatedAt: string;
  windows: Partial<Record<`${FunnelDays}`, SiteFunnelSummary>>;
}

export type SiteFunnelInsight =
  | "viewToCartLow"
  | "cartToRegisterDrop"
  | "checkoutWithoutPurchase"
  | "minOrderFriction"
  | "waitingForData";

/**
 * Deterministic, data-driven observations for the visitor funnel.
 * No causal claims — only thresholds on the actual distinct-journey counts.
 */
export function getSiteFunnelInsights(
  summary: Pick<
    SiteFunnelSummary,
    | "visit"
    | "productView"
    | "addToCart"
    | "cartView"
    | "registerLogin"
    | "application"
    | "approved"
    | "checkout"
    | "purchase"
    | "minOrderBlocked"
  >
): SiteFunnelInsight[] {
  const insights: SiteFunnelInsight[] = [];

  const totalActivity =
    summary.visit +
    summary.productView +
    summary.addToCart +
    summary.cartView +
    summary.registerLogin +
    summary.application +
    summary.approved +
    summary.checkout +
    summary.purchase;

  if (totalActivity === 0) return ["waitingForData"];

  if (summary.productView > 0) {
    const viewToCart = (summary.addToCart / summary.productView) * 100;
    if (viewToCart < 20) insights.push("viewToCartLow");
  }
  if (summary.addToCart > 0) {
    const cartToRegister = (summary.registerLogin / summary.addToCart) * 100;
    if (cartToRegister < 25) insights.push("cartToRegisterDrop");
  }
  if (summary.checkout > 0 && summary.purchase === 0) {
    insights.push("checkoutWithoutPurchase");
  }
  if (summary.minOrderBlocked > 0 && summary.addToCart > 0) {
    const friction = (summary.minOrderBlocked / summary.addToCart) * 100;
    if (friction >= 25) insights.push("minOrderFriction");
  }

  return insights.slice(0, 3);
}
