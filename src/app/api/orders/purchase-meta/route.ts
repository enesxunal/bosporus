import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isPaymentTestCart } from "@/lib/payment-test-product";

/**
 * Verify a successfully paid order before allowing analytics conversion.
 * Never treat an arbitrary /checkout/success?order= URL as a purchase.
 * Do not expose personal/financial order details to unauthenticated callers.
 */
export async function GET(request: Request) {
  const orderNumber = new URL(request.url).searchParams.get("order")?.trim().toUpperCase();
  if (!orderNumber) {
    return NextResponse.json({ error: "Missing order" }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ verified: false, isPaymentTestOrder: false }, { status: 503 });
  }

  const { data: order, error: orderError } = await admin
    .from("orders")
    .select("id, status")
    .eq("order_number", orderNumber)
    .maybeSingle();

  if (orderError || !order || !isPurchaseEligibleOrderStatus(String(order.status))) {
    return NextResponse.json({ verified: false, isPaymentTestOrder: false });
  }

  const { data: items, error: itemsError } = await admin
    .from("order_items")
    .select("product_sku, quantity")
    .eq("order_id", order.id);

  if (itemsError || !items?.length) {
    return NextResponse.json({ verified: false, isPaymentTestOrder: false });
  }

  const isPaymentTestOrder = isPaymentTestCart(
    (items ?? []).map((i) => ({
      sku: String(i.product_sku ?? ""),
      quantity: Number(i.quantity ?? 0),
    }))
  );

  return NextResponse.json({ verified: true, isPaymentTestOrder });
}

/** Closed set: paid and its fulfillment stages, never pending or cancelled. */
export function isPurchaseEligibleOrderStatus(status: string): boolean {
  return ["paid", "preparing", "ready", "out_for_delivery", "delivered"].includes(status);
}
