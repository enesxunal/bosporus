import { createAdminClient } from "./supabase/admin";
import type { B2bFunnelEventName } from "./b2b-funnel-shared";

const SUMMARY_EVENT_NAMES = [
  "b2b_account_approved",
  "b2b_first_login_after_approval",
  "approved_b2b_add_to_cart",
  "min_order_blocked",
  "approved_b2b_begin_checkout",
  "approved_b2b_purchase",
] as const satisfies readonly B2bFunnelEventName[];

type SummaryEventName = (typeof SUMMARY_EVENT_NAMES)[number];
type FunnelRow = { user_id: string | null; event_name: SummaryEventName };

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
    addToCart: sets.approved_b2b_add_to_cart.size,
    minOrderBlocked: sets.min_order_blocked.size,
    checkout: sets.approved_b2b_begin_checkout.size,
    purchase: sets.approved_b2b_purchase.size,
  };
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
      .select("user_id, event_name")
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
  };
}
