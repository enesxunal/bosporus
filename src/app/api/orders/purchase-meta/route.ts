import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isPaymentTestCart } from "@/lib/payment-test-product";

/**
 * Lightweight flag for client analytics: whether this order is the internal
 * PAYMENT-TEST-1EUR cart (skip Ads/Meta purchase).
 */
export async function GET(request: Request) {
  const orderNumber = new URL(request.url).searchParams.get("order")?.trim().toUpperCase();
  if (!orderNumber) {
    return NextResponse.json({ error: "Missing order" }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ isPaymentTestOrder: false });
  }

  const { data: order } = await admin
    .from("orders")
    .select("id")
    .eq("order_number", orderNumber)
    .maybeSingle();

  if (!order) {
    return NextResponse.json({ isPaymentTestOrder: false });
  }

  const { data: items } = await admin
    .from("order_items")
    .select("product_sku, quantity")
    .eq("order_id", order.id);

  const isPaymentTestOrder = isPaymentTestCart(
    (items ?? []).map((i) => ({
      sku: String(i.product_sku ?? ""),
      quantity: Number(i.quantity ?? 0),
    }))
  );

  return NextResponse.json({ isPaymentTestOrder });
}
