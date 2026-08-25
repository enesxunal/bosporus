import { createAdminClient } from "./supabase/admin";
import type { B2bFunnelEventName } from "./b2b-funnel-shared";
import {
  ACQUISITION_SOURCES,
  type AcquisitionSource,
} from "./acquisition";
import {
  periodBounds,
  trendGranularity,
  type FunnelDays,
  type TrendGranularity,
} from "./funnel-period";

const SUMMARY_EVENT_NAMES = [
  "b2b_account_approved",
  "b2b_first_login_after_approval",
  "approved_b2b_view_item",
  "approved_b2b_add_to_cart",
  "min_order_blocked",
  "approved_b2b_begin_checkout",
  "approved_b2b_purchase",
  "quick_order_used",
  "favorite_used",
] as const satisfies readonly B2bFunnelEventName[];

type SummaryEventName = (typeof SUMMARY_EVENT_NAMES)[number];
type FunnelRow = {
  user_id: string | null;
  event_name: SummaryEventName;
  created_at?: string;
};
type AcquisitionRow = { user_id: string; source: AcquisitionSource };
type SourceMetric =
  | "approved"
  | "firstLogin"
  | "viewItem"
  | "addToCart"
  | "checkout"
  | "purchase";

type TrendMetric =
  | "approved"
  | "firstLoginAfterApproval"
  | "addToCart"
  | "checkout"
  | "purchase";

export interface FunnelTrendPoint {
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

export function summarizeDistinctUsers(rows: FunnelRow[]) {
  const sets = Object.fromEntries(
    SUMMARY_EVENT_NAMES.map((name) => [name, new Set<string>()])
  ) as Record<SummaryEventName, Set<string>>;

  for (const row of rows) {
    if (row.user_id && sets[row.event_name]) sets[row.event_name].add(row.user_id);
  }

  return {
    approved: sets.b2b_account_approved.size,
    firstLoginAfterApproval: sets.b2b_first_login_after_approval.size,
    viewItem: sets.approved_b2b_view_item.size,
    addToCart: sets.approved_b2b_add_to_cart.size,
    minOrderBlocked: sets.min_order_blocked.size,
    checkout: sets.approved_b2b_begin_checkout.size,
    purchase: sets.approved_b2b_purchase.size,
    quickOrder: sets.quick_order_used.size,
    favorite: sets.favorite_used.size,
  };
}

function emptyTrendSets(): Record<TrendMetric, Set<string>> {
  return {
    approved: new Set(),
    firstLoginAfterApproval: new Set(),
    addToCart: new Set(),
    checkout: new Set(),
    purchase: new Set(),
  };
}

function bucketKey(createdAt: string, granularity: TrendGranularity): string | null {
  const time = Date.parse(createdAt);
  if (!Number.isFinite(time)) return null;
  const d = new Date(time);
  if (granularity === "hour") {
    d.setUTCMinutes(0, 0, 0);
    return d.toISOString();
  }
  return d.toISOString().slice(0, 10);
}

function buildBucketKeys(
  days: FunnelDays,
  granularity: TrendGranularity,
  now: Date
): string[] {
  if (granularity === "hour") {
    const end = new Date(now);
    end.setUTCMinutes(0, 0, 0);
    const keys: string[] = [];
    for (let i = 23; i >= 0; i -= 1) {
      const bucket = new Date(end.getTime() - i * 3_600_000);
      keys.push(bucket.toISOString());
    }
    return keys;
  }

  const end = new Date(now);
  end.setUTCHours(0, 0, 0, 0);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - days + 1);
  const keys: string[] = [];
  for (let index = 0; index < days; index += 1) {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + index);
    keys.push(date.toISOString().slice(0, 10));
  }
  return keys;
}

/**
 * Distinct-user trend series. 24h windows use hourly buckets; longer windows use UTC days.
 */
export function summarizeBucketedDistinctUsers(
  rows: FunnelRow[],
  days: FunnelDays,
  now = new Date()
): FunnelTrendPoint[] {
  const granularity = trendGranularity(days);
  const keys = buildBucketKeys(days, granularity, now);
  const bucketSets = new Map(keys.map((key) => [key, emptyTrendSets()]));

  const metricByEvent: Partial<Record<SummaryEventName, TrendMetric>> = {
    b2b_account_approved: "approved",
    b2b_first_login_after_approval: "firstLoginAfterApproval",
    approved_b2b_add_to_cart: "addToCart",
    approved_b2b_begin_checkout: "checkout",
    approved_b2b_purchase: "purchase",
  };

  for (const row of rows) {
    if (!row.user_id || !row.created_at) continue;
    const key = bucketKey(row.created_at, granularity);
    if (!key) continue;
    const day = bucketSets.get(key);
    const metric = metricByEvent[row.event_name];
    if (day && metric) day[metric].add(row.user_id);
  }

  return keys.map((date) => {
    const sets = bucketSets.get(date)!;
    return {
      date,
      approved: sets.approved.size,
      firstLoginAfterApproval: sets.firstLoginAfterApproval.size,
      addToCart: sets.addToCart.size,
      checkout: sets.checkout.size,
      purchase: sets.purchase.size,
    };
  });
}

/** @deprecated Prefer summarizeBucketedDistinctUsers — kept for existing call sites/tests. */
export function summarizeDailyDistinctUsers(
  rows: FunnelRow[],
  days: 7 | 30 | 90,
  now = new Date()
): FunnelTrendPoint[] {
  return summarizeBucketedDistinctUsers(rows, days, now);
}

export function summarizeSourceDistinctUsers(
  rows: FunnelRow[],
  acquisitions: AcquisitionRow[]
): FunnelSourceBreakdown[] {
  const sourceByUser = new Map(acquisitions.map((row) => [row.user_id, row.source]));
  const sets = Object.fromEntries(
    ACQUISITION_SOURCES.map((source) => [
      source,
      {
        approved: new Set<string>(),
        firstLogin: new Set<string>(),
        viewItem: new Set<string>(),
        addToCart: new Set<string>(),
        checkout: new Set<string>(),
        purchase: new Set<string>(),
      },
    ])
  ) as Record<AcquisitionSource, Record<SourceMetric, Set<string>>>;
  const metricByEvent: Partial<Record<SummaryEventName, SourceMetric>> = {
    b2b_account_approved: "approved",
    b2b_first_login_after_approval: "firstLogin",
    approved_b2b_view_item: "viewItem",
    approved_b2b_add_to_cart: "addToCart",
    approved_b2b_begin_checkout: "checkout",
    approved_b2b_purchase: "purchase",
  };

  for (const row of rows) {
    if (!row.user_id) continue;
    const metric = metricByEvent[row.event_name];
    if (!metric) continue;
    const source = sourceByUser.get(row.user_id) ?? "unknown";
    sets[source][metric].add(row.user_id);
  }

  return ACQUISITION_SOURCES.map((source) => ({
    source,
    approved: sets[source].approved.size,
    firstLogin: sets[source].firstLogin.size,
    viewItem: sets[source].viewItem.size,
    addToCart: sets[source].addToCart.size,
    checkout: sets[source].checkout.size,
    purchase: sets[source].purchase.size,
  }));
}

function filterRowsInRange(
  rows: FunnelRow[],
  start: Date,
  end: Date
): FunnelRow[] {
  const startMs = start.getTime();
  const endMs = end.getTime();
  return rows.filter((row) => {
    if (!row.created_at) return false;
    const t = Date.parse(row.created_at);
    return Number.isFinite(t) && t >= startMs && t < endMs;
  });
}

export async function getB2bFunnelSummary(days: FunnelDays) {
  const admin = createAdminClient();
  if (!admin) return { ok: false as const, error: "SUPABASE_NOT_CONFIGURED" };

  const now = new Date();
  const { currentStart, previousStart } = periodBounds(days, now);
  const rows: FunnelRow[] = [];
  const pageSize = 1000;

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await admin
      .from("b2b_funnel_events")
      .select("user_id, event_name, created_at")
      .in("event_name", [...SUMMARY_EVENT_NAMES])
      .gte("created_at", previousStart.toISOString())
      .range(from, from + pageSize - 1);

    if (error) return { ok: false as const, error: error.message };
    const page = (data ?? []) as FunnelRow[];
    rows.push(...page);
    if (page.length < pageSize) break;
  }

  const currentRows = filterRowsInRange(rows, currentStart, now);
  const previousRows = filterRowsInRange(rows, previousStart, currentStart);

  const acquisitions: AcquisitionRow[] = [];
  const funnelUserIds = Array.from(
    new Set(currentRows.flatMap((row) => (row.user_id ? [row.user_id] : [])))
  );
  const acquisitionBatchSize = 200;
  for (let index = 0; index < funnelUserIds.length; index += acquisitionBatchSize) {
    const userIds = funnelUserIds.slice(index, index + acquisitionBatchSize);
    const { data, error } = await admin
      .from("user_acquisition")
      .select("user_id, source")
      .in("user_id", userIds);

    if (error) {
      if (error.code === "42P01" || error.code === "PGRST205") {
        acquisitions.length = 0;
        break;
      }
      return { ok: false as const, error: error.message };
    }
    acquisitions.push(...((data ?? []) as AcquisitionRow[]));
  }

  const { count: currentApproved, error: approvedError } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "b2b_approved")
    .eq("vat_verified", true);

  if (approvedError) return { ok: false as const, error: approvedError.message };

  const current = summarizeDistinctUsers(currentRows);
  const previous = summarizeDistinctUsers(previousRows);

  return {
    ok: true as const,
    days,
    granularity: trendGranularity(days),
    currentApproved: currentApproved ?? 0,
    ...current,
    previous,
    trend: summarizeBucketedDistinctUsers(currentRows, days, now),
    sources: summarizeSourceDistinctUsers(currentRows, acquisitions),
  };
}
