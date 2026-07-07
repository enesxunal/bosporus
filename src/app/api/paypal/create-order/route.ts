import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  validateAndPriceOrderItems,
  validateDeliveryOrder,
  validatePickupOrder,
} from "@/lib/order-validation";
import { createPayPalOrder, getPayPalClientId, isPayPalConfigured } from "@/lib/paypal";
import type { CartItem } from "@/lib/types";

export async function GET() {
  if (!isPayPalConfigured()) {
    return NextResponse.json({ enabled: false });
  }
  return NextResponse.json({
    enabled: true,
    clientId: getPayPalClientId(),
    mode: process.env.PAYPAL_MODE === "sandbox" ? "sandbox" : "live",
  });
}

interface CheckoutBody {
  items: CartItem[];
  orderType: "delivery" | "click_collect";
  zipCode?: string;
  deliveryDate?: string;
  pickupDate?: string;
  pickupSlot?: string;
}

async function resolveTotal(body: CheckoutBody, isB2b: boolean) {
  const priced = await validateAndPriceOrderItems(body.items, isB2b);
  if (!priced.ok) return { ok: false as const, error: priced.error };

  let totalGross = 0;
  for (const item of priced.items) {
    totalGross += item.priceGross * item.quantity;
  }
  totalGross = Math.round(totalGross * 100) / 100;

  if (body.orderType === "delivery") {
    const deliveryCheck = await validateDeliveryOrder({
      zipCode: body.zipCode,
      deliveryDate: body.deliveryDate,
      totalGross,
    });
    if (!deliveryCheck.ok) return { ok: false as const, error: deliveryCheck.error };
  } else {
    const pickupCheck = await validatePickupOrder({
      pickupDate: body.pickupDate,
      pickupSlot: body.pickupSlot,
    });
    if (!pickupCheck.ok) return { ok: false as const, error: pickupCheck.error };
  }

  return { ok: true as const, totalGross, items: priced.items };
}

export async function POST(request: Request) {
  if (!isPayPalConfigured()) {
    return NextResponse.json({ error: "PayPal not configured" }, { status: 503 });
  }

  const body = (await request.json()) as CheckoutBody;
  if (!body.items?.length) {
    return NextResponse.json({ error: "Empty cart" }, { status: 400 });
  }

  let isB2b = false;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      isB2b = profile?.role === "b2b_approved";
    }
  } catch {
    // guest
  }

  const resolved = await resolveTotal(body, isB2b);
  if (!resolved.ok) {
    return NextResponse.json({ error: resolved.error }, { status: 400 });
  }

  try {
    const paypalOrderId = await createPayPalOrder(resolved.totalGross);
    return NextResponse.json({ paypalOrderId, total: resolved.totalGross });
  } catch (e) {
    console.error("PayPal create-order:", e);
    return NextResponse.json({ error: "PayPal error" }, { status: 500 });
  }
}
