import { createAdminClient } from "./supabase/admin";
import { amountBucket, type SiteFunnelEventName } from "./site-funnel-shared";
import type { SiteEventPayload } from "./site-funnel-request";
import { hashInternalId } from "./b2b-funnel-server";

type AdminClient = NonNullable<ReturnType<typeof createAdminClient>>;

/**
 * Build the PII-free metadata object that is persisted for a client event.
 * Only normalized/bucketed values are ever included.
 */
export function buildSiteEventMetadata(
  payload: SiteEventPayload
): Record<string, string | number> {
  const common: Record<string, string | number> = {};
  if (payload.source) common.source = payload.source;
  if (payload.device) common.device = payload.device;
  if (payload.locale) common.locale = payload.locale;

  switch (payload.eventName) {
    case "product_view":
      return { ...common, product_id: payload.productId, price_bucket: payload.priceBucket };
    case "add_to_cart":
      return {
        ...common,
        product_id: payload.productId,
        quantity: payload.quantity,
        cart_subtotal_bucket: payload.cartSubtotalBucket,
      };
    case "cart_view":
      return {
        ...common,
        item_count_bucket: payload.itemCountBucket,
        subtotal_bucket: payload.subtotalBucket,
      };
    case "min_order_blocked":
      return {
        ...common,
        subtotal_bucket: payload.subtotalBucket,
        min_required: payload.minRequired,
        segment: payload.segment,
        order_type: payload.orderType,
      };
    case "begin_checkout":
      return { ...common, subtotal_bucket: payload.subtotalBucket };
    case "quick_order_used":
      return { ...common, lines_added: payload.linesAdded };
    default:
      return common;
  }
}

/**
 * Session-scoped dedupe key so high-frequency events (site_visit, product_view)
 * collapse to one row per session via the unique index.
 */
function dedupeKeyFor(payload: SiteEventPayload): string | null {
  if (!payload.sessionId) return null;
  if (payload.eventName === "site_visit") return `visit:${payload.sessionId}`;
  if (payload.eventName === "product_view") {
    return `pv:${payload.sessionId}:${payload.productId}`;
  }
  if (payload.eventName === "cart_view") return `cart:${payload.sessionId}`;
  if (payload.eventName === "register_view") return `reg:${payload.sessionId}`;
  if (payload.eventName === "login_view") return `login:${payload.sessionId}`;
  return null;
}

export async function recordSiteFunnelEvent(params: {
  payload: SiteEventPayload;
  userId: string | null;
  admin?: AdminClient;
}): Promise<{ ok: boolean; duplicate?: boolean }> {
  const admin = params.admin ?? createAdminClient();
  if (!admin) return { ok: false };

  try {
    const { error } = await admin.from("site_funnel_events").insert({
      anonymous_id: params.payload.anonymousId,
      session_id: params.payload.sessionId,
      user_id: params.userId,
      event_name: params.payload.eventName,
      metadata: buildSiteEventMetadata(params.payload),
      dedupe_key: dedupeKeyFor(params.payload),
    });

    if (!error) return { ok: true };
    if (error.code === "23505") return { ok: true, duplicate: true };

    console.error("Site funnel event insert failed:", params.payload.eventName, error.code);
    return { ok: false };
  } catch {
    console.error("Site funnel event insert failed:", params.payload.eventName, "UNEXPECTED");
    return { ok: false };
  }
}

/**
 * Persist a non-destructive mapping between a first-party anonymous id and the
 * authenticated user. Duplicate mappings are treated as a successful NO-OP.
 * The caller must resolve `userId` from the server session (never the client).
 */
export async function linkVisitorIdentity(params: {
  anonymousId: string;
  userId: string;
  admin?: AdminClient;
}): Promise<{ ok: boolean; duplicate?: boolean }> {
  const admin = params.admin ?? createAdminClient();
  if (!admin) return { ok: false };

  try {
    const { error } = await admin.from("visitor_identity_links").insert({
      anonymous_id: params.anonymousId,
      user_id: params.userId,
    });

    if (!error) return { ok: true };
    if (error.code === "23505") return { ok: true, duplicate: true };

    console.error("Visitor identity link failed:", error.code);
    return { ok: false };
  } catch {
    console.error("Visitor identity link failed: UNEXPECTED");
    return { ok: false };
  }
}

/**
 * Server-only purchase event for the unified visitor funnel. Mirrors the
 * approved-B2B purchase exclusion (PAYMENT-TEST orders never count).
 */
export async function recordSitePurchase(params: {
  userId: string | null;
  orderId: string;
  value: number;
  isPaymentTestOrder: boolean;
  admin?: AdminClient;
}): Promise<{ ok: boolean; recorded?: boolean; duplicate?: boolean }> {
  if (!params.userId || params.isPaymentTestOrder) {
    return { ok: true, recorded: false };
  }

  const admin = params.admin ?? createAdminClient();
  if (!admin) return { ok: false };

  const eventName: SiteFunnelEventName = "purchase";
  try {
    const { error } = await admin.from("site_funnel_events").insert({
      anonymous_id: null,
      session_id: null,
      user_id: params.userId,
      event_name: eventName,
      metadata: {
        order_id_hash: hashInternalId(params.orderId),
        value_bucket: amountBucket(params.value),
      },
      dedupe_key: `order:${params.orderId}`,
    });

    if (!error) return { ok: true, recorded: true };
    if (error.code === "23505") return { ok: true, recorded: false, duplicate: true };

    console.error("Site purchase insert failed:", error.code);
    return { ok: false };
  } catch {
    console.error("Site purchase insert failed: UNEXPECTED");
    return { ok: false };
  }
}
