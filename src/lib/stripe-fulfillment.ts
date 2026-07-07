import type Stripe from "stripe";
import { createOrder } from "./orders";
import { createAdminClient } from "./supabase/admin";
import {
  validateAndPriceOrderItems,
  validateDeliveryOrder,
  validatePickupOrder,
} from "./order-validation";
import { getStripeClient, stripePaymentReference } from "./stripe";
import type { CartItem } from "./types";

function lineItemsToCart(lines: Stripe.LineItem[]): CartItem[] {
  const items: CartItem[] = [];
  for (const line of lines) {
    const meta = line.price?.product;
    const productMeta =
      typeof meta === "object" && meta && "metadata" in meta
        ? (meta.metadata as Record<string, string>)
        : {};
    if (productMeta.type === "delivery_fee" || productMeta.sku === "_delivery") continue;
    const sku = productMeta.sku ?? "";
    const productId = productMeta.productId ?? "";
    if (!sku && !productId) continue;
    items.push({
      productId,
      sku,
      name: line.description ?? sku,
      quantity: line.quantity ?? 1,
      unit: "piece",
      priceNet: 0,
      priceGross: (line.price?.unit_amount ?? 0) / 100,
      taxRate: 19,
      imageUrl: null,
    });
  }
  return items;
}

async function orderExistsForSession(sessionId: string): Promise<string | null> {
  const admin = createAdminClient();
  if (!admin) return null;
  const ref = stripePaymentReference(sessionId);
  const { data } = await admin
    .from("orders")
    .select("order_number")
    .eq("stripe_payment_intent_id", ref)
    .maybeSingle();
  return data?.order_number ?? null;
}

export async function fulfillStripeCheckoutSession(
  sessionId: string
): Promise<{ ok: true; orderNumber: string } | { ok: false; error: string }> {
  const existing = await orderExistsForSession(sessionId);
  if (existing) return { ok: true, orderNumber: existing };

  const stripe = getStripeClient();
  if (!stripe) return { ok: false, error: "STRIPE_NOT_CONFIGURED" };

  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["line_items.data.price.product"],
  });

  if (session.payment_status !== "paid") {
    return { ok: false, error: "PAYMENT_NOT_COMPLETED" };
  }

  const meta = session.metadata ?? {};
  const orderType = meta.orderType === "click_collect" ? "click_collect" : "delivery";
  const isB2b = meta.isB2b === "true";
  const locale: "de" | "tr" = meta.locale === "tr" ? "tr" : "de";
  const customerEmail = meta.customerEmail ?? session.customer_email ?? "";
  const customerName = meta.customerName ?? "";
  const customerPhone = meta.customerPhone || undefined;
  const zipCode = meta.zipCode || undefined;
  const address = meta.address || undefined;
  const deliveryDate = meta.deliveryDate || undefined;
  const pickupDate = meta.pickupDate || undefined;
  const pickupSlot = meta.pickupSlot || undefined;
  const userId = meta.userId || null;
  const deliveryFee = Number(meta.deliveryFee ?? 0);
  const distanceKm = meta.distanceKm ? Number(meta.distanceKm) : null;

  const lines = session.line_items?.data ?? [];
  const clientItems = lineItemsToCart(lines);
  if (!clientItems.length) return { ok: false, error: "EMPTY_CART" };

  const priced = await validateAndPriceOrderItems(clientItems, isB2b);
  if (!priced.ok) return { ok: false, error: priced.error };

  let subtotalGross = 0;
  for (const item of priced.items) {
    subtotalGross += item.priceGross * item.quantity;
  }
  subtotalGross = Math.round(subtotalGross * 100) / 100;

  let pickupSlotId: string | null = null;

  if (orderType === "delivery") {
    const deliveryCheck = await validateDeliveryOrder({
      zipCode,
      address,
      deliveryDate,
      totalGross: subtotalGross,
      isB2b,
    });
    if (!deliveryCheck.ok) return { ok: false, error: deliveryCheck.error };
  } else {
    const pickupCheck = await validatePickupOrder({
      pickupDate,
      pickupSlot,
      totalGross: subtotalGross,
      isB2b,
    });
    if (!pickupCheck.ok) return { ok: false, error: pickupCheck.error };
    pickupSlotId = pickupCheck.slotId ?? null;
  }

  const expectedTotal = Math.round((subtotalGross + deliveryFee) * 100);
  if (session.amount_total != null && Math.abs(session.amount_total - expectedTotal) > 2) {
    return { ok: false, error: "AMOUNT_MISMATCH" };
  }

  const result = await createOrder({
    items: priced.items,
    orderType,
    customerEmail,
    customerName,
    customerPhone,
    userId,
    isB2b,
    zipCode,
    address,
    deliveryDate,
    pickupDate,
    pickupSlot,
    pickupSlotId,
    locale,
    paymentReference: stripePaymentReference(sessionId),
    deliveryFee,
    distanceKm,
  });

  if (!result.ok) return { ok: false, error: result.error };
  return { ok: true, orderNumber: result.orderNumber };
}
