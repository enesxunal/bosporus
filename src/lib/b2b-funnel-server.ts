import { createHash } from "node:crypto";
import { createAdminClient } from "./supabase/admin";
import {
  amountBucket,
  type AmountBucket,
  type B2bFunnelEventName,
} from "./b2b-funnel-shared";
import { isB2BApproved } from "./types";

type OrderType = "delivery" | "click_collect";
type PaymentMethod = "stripe" | "paypal";

type FunnelMetadata = {
  b2b_account_approved: { approved_at: string };
  b2b_first_login_after_approval: { hours_since_approval: number };
  approved_b2b_view_item: { product_id: string; price_bucket: AmountBucket };
  approved_b2b_add_to_cart: {
    product_id: string;
    quantity: number;
    cart_subtotal_bucket: AmountBucket;
  };
  approved_b2b_begin_checkout: {
    subtotal_bucket: AmountBucket;
    order_type: OrderType;
  };
  approved_b2b_purchase: {
    order_id_hash: string;
    value_bucket: AmountBucket;
    payment_method: PaymentMethod;
    order_type: OrderType;
  };
  min_order_blocked: {
    subtotal_bucket: AmountBucket;
    min_required: number;
    order_type: OrderType;
    segment: "approved" | "guest";
  };
  quick_order_used: { lines_added: number };
  favorite_used: { product_id: string };
};

type AdminClient = NonNullable<ReturnType<typeof createAdminClient>>;

const ALLOWED_METADATA_KEYS: {
  [K in B2bFunnelEventName]: readonly (keyof FunnelMetadata[K])[];
} = {
  b2b_account_approved: ["approved_at"],
  b2b_first_login_after_approval: ["hours_since_approval"],
  approved_b2b_view_item: ["product_id", "price_bucket"],
  approved_b2b_add_to_cart: ["product_id", "quantity", "cart_subtotal_bucket"],
  approved_b2b_begin_checkout: ["subtotal_bucket", "order_type"],
  approved_b2b_purchase: ["order_id_hash", "value_bucket", "payment_method", "order_type"],
  min_order_blocked: ["subtotal_bucket", "min_required", "order_type", "segment"],
  quick_order_used: ["lines_added"],
  favorite_used: ["product_id"],
};

export function sanitizeFunnelMetadata<K extends B2bFunnelEventName>(
  eventName: K,
  metadata: FunnelMetadata[K]
): FunnelMetadata[K] {
  const source = metadata as Record<string, unknown>;
  const clean: Record<string, unknown> = {};
  for (const key of ALLOWED_METADATA_KEYS[eventName] as readonly string[]) {
    const value = source[key];
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      clean[key] = value;
    }
  }
  return clean as FunnelMetadata[K];
}

export function buildApprovalUpdate(approvedAt: string) {
  return {
    role: "b2b_approved" as const,
    vat_verified: true,
    approved_at: approvedAt,
  };
}

export async function recordB2bFunnelEvent<K extends B2bFunnelEventName>(params: {
  userId: string | null;
  eventName: K;
  metadata: FunnelMetadata[K];
  dedupeKey?: string;
  admin?: AdminClient;
}): Promise<{ ok: boolean; duplicate?: boolean }> {
  const admin = params.admin ?? createAdminClient();
  if (!admin) return { ok: false };

  try {
    const { error } = await admin.from("b2b_funnel_events").insert({
      user_id: params.userId,
      event_name: params.eventName,
      metadata: sanitizeFunnelMetadata(params.eventName, params.metadata),
      dedupe_key: params.dedupeKey ?? null,
    });

    if (!error) return { ok: true };
    if (error.code === "23505") return { ok: true, duplicate: true };

    console.error("B2B funnel event insert failed:", params.eventName, error.code);
    return { ok: false };
  } catch {
    console.error("B2B funnel event insert failed:", params.eventName, "UNEXPECTED");
    return { ok: false };
  }
}

export async function recordAccountApproved(params: {
  userId: string;
  approvedAt: string;
  admin?: AdminClient;
}) {
  return recordB2bFunnelEvent({
    userId: params.userId,
    eventName: "b2b_account_approved",
    metadata: { approved_at: params.approvedAt },
    dedupeKey: "account-approved",
    admin: params.admin,
  });
}

export async function recordFirstLoginAfterApproval(
  userId: string,
  adminOverride?: AdminClient
): Promise<{ ok: boolean; recorded?: boolean; duplicate?: boolean }> {
  const admin = adminOverride ?? createAdminClient();
  if (!admin) return { ok: false };

  const { data: profile, error } = await admin
    .from("profiles")
    .select("role, vat_verified, approved_at")
    .eq("id", userId)
    .single();

  if (error || !isB2BApproved(profile) || !profile.approved_at) {
    return { ok: true, recorded: false };
  }

  const approvedAt = new Date(profile.approved_at).getTime();
  if (!Number.isFinite(approvedAt)) return { ok: true, recorded: false };

  const hours = Math.max(0, Math.round(((Date.now() - approvedAt) / 3_600_000) * 10) / 10);
  const result = await recordB2bFunnelEvent({
    userId,
    eventName: "b2b_first_login_after_approval",
    metadata: { hours_since_approval: hours },
    dedupeKey: "first-login",
    admin,
  });

  return { ...result, recorded: result.ok && !result.duplicate };
}

export async function recordBeginCheckout(params: {
  userId: string | null;
  isApprovedB2b: boolean;
  subtotal: number;
  orderType: OrderType;
  admin?: AdminClient;
}) {
  if (!params.userId || !params.isApprovedB2b) return { ok: true, recorded: false };
  const result = await recordB2bFunnelEvent({
    userId: params.userId,
    eventName: "approved_b2b_begin_checkout",
    metadata: {
      subtotal_bucket: amountBucket(params.subtotal),
      order_type: params.orderType,
    },
    admin: params.admin,
  });
  return { ...result, recorded: result.ok };
}

export async function recordMinOrderBlocked(params: {
  userId?: string | null;
  isApprovedB2b: boolean;
  subtotal: number;
  minRequired: number;
  orderType: OrderType;
  admin?: AdminClient;
}) {
  const subtotalBucket = amountBucket(params.subtotal);
  const dateKey = new Date().toISOString().slice(0, 10);
  return recordB2bFunnelEvent({
    userId: params.userId ?? null,
    eventName: "min_order_blocked",
    metadata: {
      subtotal_bucket: subtotalBucket,
      min_required: Math.max(0, Math.round(params.minRequired * 100) / 100),
      order_type: params.orderType,
      segment: params.isApprovedB2b ? "approved" : "guest",
    },
    dedupeKey: params.userId
      ? `min:${params.orderType}:${subtotalBucket}:${dateKey}`
      : undefined,
    admin: params.admin,
  });
}

export function hashInternalId(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export async function recordPurchase(params: {
  userId: string | null;
  isApprovedB2b: boolean;
  orderId: string;
  value: number;
  paymentMethod: PaymentMethod;
  orderType: OrderType;
  isPaymentTestOrder: boolean;
  admin?: AdminClient;
}) {
  if (!params.userId || !params.isApprovedB2b || params.isPaymentTestOrder) {
    return { ok: true, recorded: false };
  }

  const result = await recordB2bFunnelEvent({
    userId: params.userId,
    eventName: "approved_b2b_purchase",
    metadata: {
      order_id_hash: hashInternalId(params.orderId),
      value_bucket: amountBucket(params.value),
      payment_method: params.paymentMethod,
      order_type: params.orderType,
    },
    dedupeKey: `order:${params.orderId}`,
    admin: params.admin,
  });
  return { ...result, recorded: result.ok && !result.duplicate };
}
