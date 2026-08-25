/**
 * Shared funnel window / period-over-period helpers.
 * FunnelDays `1` means a rolling 24-hour window (hourly trend buckets).
 */

export type FunnelDays = 1 | 7 | 30 | 90;

export const FUNNEL_WINDOWS = [1, 7, 30, 90] as const;

export function isFunnelDays(value: number): value is FunnelDays {
  return (FUNNEL_WINDOWS as readonly number[]).includes(value);
}

export function windowMs(days: FunnelDays): number {
  return days * 86_400_000;
}

export function periodBounds(days: FunnelDays, now = new Date()) {
  const endMs = now.getTime();
  const span = windowMs(days);
  const currentStart = new Date(endMs - span);
  const previousStart = new Date(endMs - 2 * span);
  const previousEnd = currentStart;
  return {
    currentStart,
    currentEnd: now,
    previousStart,
    previousEnd,
  };
}

export type TrendGranularity = "hour" | "day";

export function trendGranularity(days: FunnelDays): TrendGranularity {
  return days === 1 ? "hour" : "day";
}

/**
 * Period-over-period delta. Never returns Infinity / NaN percentages.
 * When previous is 0: percent is null (show absolute delta only).
 */
export function periodDelta(current: number, previous: number): {
  absolute: number;
  percent: number | null;
} {
  const absolute = current - previous;
  if (previous <= 0) {
    return { absolute, percent: null };
  }
  return { absolute, percent: (absolute / previous) * 100 };
}

/**
 * Share of one independent distinct count vs another.
 * Returns null when the base is 0 OR when the ratio would exceed 100%
 * (independent stages are not sequential cohorts — avoid implying conversion >100%).
 */
export function independentShare(value: number, base: number): number | null {
  if (base <= 0) return null;
  const pct = (value / base) * 100;
  if (pct > 100) return null;
  return pct;
}
