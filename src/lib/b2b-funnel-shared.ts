export const B2B_FUNNEL_EVENT_NAMES = [
  "b2b_account_approved",
  "b2b_first_login_after_approval",
  "approved_b2b_view_item",
  "approved_b2b_add_to_cart",
  "approved_b2b_begin_checkout",
  "approved_b2b_purchase",
  "min_order_blocked",
  "quick_order_used",
  "favorite_used",
] as const;

export type B2bFunnelEventName = (typeof B2B_FUNNEL_EVENT_NAMES)[number];

export const AMOUNT_BUCKETS = [
  "0-99",
  "100-249",
  "250-499",
  "500-999",
  "1000-2499",
  "2500+",
] as const;

export type AmountBucket = (typeof AMOUNT_BUCKETS)[number];

export function amountBucket(value: number): AmountBucket {
  if (value < 100) return "0-99";
  if (value < 250) return "100-249";
  if (value < 500) return "250-499";
  if (value < 1000) return "500-999";
  if (value < 2500) return "1000-2499";
  return "2500+";
}

export function isAmountBucket(value: unknown): value is AmountBucket {
  return typeof value === "string" && (AMOUNT_BUCKETS as readonly string[]).includes(value);
}

export function safeLoginNext(value: string | null | undefined): "/quick-order" | "/products" {
  return value === "/quick-order" ? "/quick-order" : "/products";
}
