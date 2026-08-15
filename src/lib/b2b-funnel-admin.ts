import { createAdminClient } from "./supabase/admin";
import type { B2bFunnelEventName } from "./b2b-funnel-shared";

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

export interface FunnelTrendPoint {
  date: string;
  approved: number;
  firstLoginAfterApproval: number;
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

export function summarizeDailyDistinctUsers(
  rows: FunnelRow[],
  days: 7 | 30 | 90,
  now = new Date()
): FunnelTrendPoint[] {
  const end = new Date(now);
  end.setUTCHours(0, 0, 0, 0);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - days + 1);

  const dailySets = new Map<
    string,
    Record<
      "approved" | "firstLoginAfterApproval" | "addToCart" | "checkout" | "purchase",
      Set<string>
    >
  >();

  for (let index = 0; index < days; index += 1) {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + index);
    dailySets.set(date.toISOString().slice(0, 10), {
      approved: new Set(),
      firstLoginAfterApproval: new Set(),
      addToCart: new Set(),
      checkout: new Set(),
      purchase: new Set(),
    });
  }

  const metricByEvent: Partial<
    Record<
      SummaryEventName,
      "approved" | "firstLoginAfterApproval" | "addToCart" | "checkout" | "purchase"
    >
  > = {
    b2b_account_approved: "approved",
    b2b_first_login_after_approval: "firstLoginAfterApproval",
    approved_b2b_add_to_cart: "addToCart",
    approved_b2b_begin_checkout: "checkout",
    approved_b2b_purchase: "purchase",
  };

  for (const row of rows) {
    if (!row.user_id || !row.created_at) continue;
    const day = dailySets.get(row.created_at.slice(0, 10));
    const metric = metricByEvent[row.event_name];
    if (day && metric) day[metric].add(row.user_id);
  }

  return Array.from(dailySets, ([date, sets]) => ({
    date,
    approved: sets.approved.size,
    firstLoginAfterApproval: sets.firstLoginAfterApproval.size,
    addToCart: sets.addToCart.size,
    checkout: sets.checkout.size,
    purchase: sets.purchase.size,
  }));
}

export async function getB2bFunnelSummary(days: 7 | 30 | 90) {
  const admin = createAdminClient();
  if (!admin) return { ok: false as const, error: "SUPABASE_NOT_CONFIGURED" };

  const since = new Date(Date.now() - days * 86_400_000).toISOString();
  const rows: FunnelRow[] = [];
  const pageSize = 1000;

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await admin
      .from("b2b_funnel_events")
      .select("user_id, event_name, created_at")
      .in("event_name", [...SUMMARY_EVENT_NAMES])
      .gte("created_at", since)
      .range(from, from + pageSize - 1);

    if (error) return { ok: false as const, error: error.message };
    const page = (data ?? []) as FunnelRow[];
    rows.push(...page);
    if (page.length < pageSize) break;
  }

  const { count: currentApproved, error: approvedError } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "b2b_approved")
    .eq("vat_verified", true);

  if (approvedError) return { ok: false as const, error: approvedError.message };

  return {
    ok: true as const,
    days,
    currentApproved: currentApproved ?? 0,
    ...summarizeDistinctUsers(rows),
    trend: summarizeDailyDistinctUsers(rows, days),
  };
}
