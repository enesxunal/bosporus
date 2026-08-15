import { AMOUNT_BUCKETS, amountBucket, type AmountBucket } from "./b2b-funnel-shared";
import { ACQUISITION_SOURCES, type AcquisitionSource } from "./acquisition";

export { amountBucket, type AmountBucket };

/**
 * Every site-funnel event name that may exist in the database.
 * `purchase` is written server-side only and is intentionally excluded from
 * the client-writable allowlist below.
 */
export const SITE_FUNNEL_EVENT_NAMES = [
  "site_visit",
  "product_view",
  "add_to_cart",
  "cart_view",
  "min_order_blocked",
  "register_view",
  "login_view",
  "registration_started",
  "registration_completed",
  "b2b_application_submitted",
  "begin_checkout",
  "quick_order_view",
  "quick_order_used",
  "purchase",
] as const;

export type SiteFunnelEventName = (typeof SITE_FUNNEL_EVENT_NAMES)[number];

/**
 * Events the public client endpoint is allowed to write. Critical events
 * (purchase) are server-only and must never be accepted from the client.
 */
export const CLIENT_WRITABLE_EVENTS = [
  "site_visit",
  "product_view",
  "add_to_cart",
  "cart_view",
  "min_order_blocked",
  "register_view",
  "login_view",
  "registration_started",
  "registration_completed",
  "b2b_application_submitted",
  "begin_checkout",
  "quick_order_view",
  "quick_order_used",
] as const;

export type ClientWritableEvent = (typeof CLIENT_WRITABLE_EVENTS)[number];

export function isClientWritableEvent(value: unknown): value is ClientWritableEvent {
  return (
    typeof value === "string" &&
    (CLIENT_WRITABLE_EVENTS as readonly string[]).includes(value)
  );
}

export const DEVICE_CATEGORIES = ["mobile", "tablet", "desktop"] as const;
export type DeviceCategory = (typeof DEVICE_CATEGORIES)[number];

export function isDeviceCategory(value: unknown): value is DeviceCategory {
  return (
    typeof value === "string" &&
    (DEVICE_CATEGORIES as readonly string[]).includes(value)
  );
}

export const FUNNEL_SEGMENTS = [
  "guest",
  "authenticated_unapproved",
  "b2b_pending",
  "b2b_approved",
] as const;
export type FunnelSegment = (typeof FUNNEL_SEGMENTS)[number];

export function isFunnelSegment(value: unknown): value is FunnelSegment {
  return (
    typeof value === "string" &&
    (FUNNEL_SEGMENTS as readonly string[]).includes(value)
  );
}

export const ORDER_TYPES = ["delivery", "click_collect"] as const;
export type SiteOrderType = (typeof ORDER_TYPES)[number];

export function isOrderType(value: unknown): value is SiteOrderType {
  return typeof value === "string" && (ORDER_TYPES as readonly string[]).includes(value);
}

export const SITE_LOCALES = ["de", "tr"] as const;
export type SiteLocale = (typeof SITE_LOCALES)[number];

export function isSiteLocale(value: unknown): value is SiteLocale {
  return typeof value === "string" && (SITE_LOCALES as readonly string[]).includes(value);
}

/** Coarse basket-size buckets — never store the raw item count. */
export const ITEM_COUNT_BUCKETS = ["1", "2-3", "4-6", "7-12", "13+"] as const;
export type ItemCountBucket = (typeof ITEM_COUNT_BUCKETS)[number];

export function itemCountBucket(count: number): ItemCountBucket {
  const value = Math.max(0, Math.floor(count));
  if (value <= 1) return "1";
  if (value <= 3) return "2-3";
  if (value <= 6) return "4-6";
  if (value <= 12) return "7-12";
  return "13+";
}

export function isItemCountBucket(value: unknown): value is ItemCountBucket {
  return (
    typeof value === "string" &&
    (ITEM_COUNT_BUCKETS as readonly string[]).includes(value)
  );
}

export function isAmountBucketValue(value: unknown): value is AmountBucket {
  return typeof value === "string" && (AMOUNT_BUCKETS as readonly string[]).includes(value);
}

export function isAcquisitionSource(value: unknown): value is AcquisitionSource {
  return (
    typeof value === "string" &&
    (ACQUISITION_SOURCES as readonly string[]).includes(value)
  );
}

/** First-party anonymous / session ids are opaque hex+dash tokens (no PII). */
export const FIRST_PARTY_ID_PATTERN = /^[0-9a-fA-F-]{16,64}$/;

export function isFirstPartyId(value: unknown): value is string {
  return typeof value === "string" && FIRST_PARTY_ID_PATTERN.test(value);
}
