import type Stripe from "stripe";
import { createOrder } from "./orders";
import { createAdminClient } from "./supabase/admin";
import {
  validateAndPriceOrderItems,
  validateDeliveryOrder,
  validatePickupOrder,
} from "./order-validation";
import { getStripeClient, stripePaymentReference } from "./stripe";
import { alertPaymentFulfillmentIssue } from "./payment-recovery";
import type { CartItem } from "./types";
import { cartLineTotalGross } from "./pfand";

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

async function refundStripeSession(
  stripe: Stripe,
  session: Stripe.Checkout.Session
): Promise<boolean> {
  const pi = session.payment_intent;
  const paymentIntentId = typeof pi === "string" ? pi : pi?.id;
  if (!paymentIntentId) return false;
  try {
    await stripe.refunds.create({
      payment_intent: paymentIntentId,
      reason: "requested_by_customer",
    });
    return true;
  } catch (e) {
    console.error("Stripe refund failed:", e);
    return false;
  }
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
  const paidAmount = (session.amount_total ?? 0) / 100;

  const fail = async (error: string) => {
    const refunded = await refundStripeSession(stripe, session);
    await alertPaymentFulfillmentIssue({
      provider: "stripe",
      reference: sessionId,
      customerEmail,
      customerName,
      amountEur: paidAmount,
      error,
      refunded,
    });
    return { ok: false as const, error };
  };

  const lines = session.line_items?.data ?? [];
  const clientItems = lineItemsToCart(lines);
  if (!clientItems.length) return fail("EMPTY_CART");

  const priced = await validateAndPriceOrderItems(clientItems, isB2b);
  if (!priced.ok) return fail(priced.error);

  let subtotalGross = 0;
  for (const item of priced.items) {
    subtotalGross += cartLineTotalGross(item);
  }
  subtotalGross = Math.round(subtotalGross * 100) / 100;

  let pickupSlotId: string | null = meta.pickupSlotId || null;

  // Ödeme zaten alındı: teslimat/slot yeniden sıkı kontrol edilmez; metadata ücreti kullanılır.
  // Slot ID yoksa soft dene.
  if (orderType === "delivery") {
    const deliveryCheck = await validateDeliveryOrder({
      zipCode,
      address,
      deliveryDate,
      totalGross: subtotalGross,
      isB2b,
      userId,
    });
    if (!deliveryCheck.ok) {
      console.warn("Stripe fulfill delivery soft-fail:", deliveryCheck.error, sessionId);
    } else if (Math.abs(deliveryCheck.deliveryFee - deliveryFee) > 0.02) {
      console.warn(
        "Stripe fulfill fee drift (using paid metadata):",
        deliveryCheck.deliveryFee,
        "vs",
        deliveryFee,
        sessionId
      );
    }
  } else if (!pickupSlotId) {
    const pickupCheck = await validatePickupOrder({
      pickupDate,
      pickupSlot,
      totalGross: subtotalGross,
      isB2b,
    });
    if (pickupCheck.ok) {
      pickupSlotId = pickupCheck.slotId ?? null;
    } else {
      console.warn("Stripe fulfill pickup soft-fail:", pickupCheck.error, sessionId);
    }
  }

  const expectedTotal = Math.round((subtotalGross + deliveryFee) * 100);
  if (session.amount_total != null && Math.abs(session.amount_total - expectedTotal) > 2) {
    return fail("AMOUNT_MISMATCH");
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

  if (!result.ok) return fail(result.error);
  return { ok: true, orderNumber: result.orderNumber };
}
