import { NextResponse } from "next/server";
import { createOrder } from "@/lib/orders";
import { isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  validateAndPriceOrderItems,
  validateDeliveryOrder,
  validatePickupOrder,
} from "@/lib/order-validation";
import { capturePayPalOrder, isPayPalConfigured } from "@/lib/paypal";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import type { CartItem } from "@/lib/types";

export async function POST(request: Request) {
  if (!isSupabaseAdminConfigured() || !isPayPalConfigured()) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const ip = clientIp(request);
  const limited = rateLimit(`paypal:${ip}`, 20, 60 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await request.json();
  const {
    paypalOrderId,
    items,
    orderType,
    customerEmail,
    customerName,
    customerPhone,
    zipCode,
    address,
    deliveryDate,
    pickupDate,
    pickupSlot,
    locale: bodyLocale,
  } = body as {
    paypalOrderId: string;
    items: CartItem[];
    orderType: "delivery" | "click_collect";
    customerEmail: string;
    customerName: string;
    customerPhone?: string;
    zipCode?: string;
    address?: string;
    deliveryDate?: string;
    pickupDate?: string;
    pickupSlot?: string;
    locale?: "de" | "tr";
  };

  if (!paypalOrderId || !items?.length || !customerEmail?.trim() || !customerName?.trim()) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  let locale: "de" | "tr" = bodyLocale === "tr" ? "tr" : "de";
  let userId: string | null = null;
  let isB2b = false;

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      userId = user.id;
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, locale")
        .eq("id", user.id)
        .single();
      isB2b = profile?.role === "b2b_approved";
      if (profile?.locale === "tr" || profile?.locale === "de") locale = profile.locale;
    }
  } catch {
    // guest
  }

  const priced = await validateAndPriceOrderItems(items, isB2b);
  if (!priced.ok) {
    return NextResponse.json({ error: priced.error }, { status: 400 });
  }

  let totalGross = 0;
  for (const item of priced.items) {
    totalGross += item.priceGross * item.quantity;
  }
  totalGross = Math.round(totalGross * 100) / 100;

  let pickupSlotId: string | null = null;

  if (orderType === "delivery") {
    const deliveryCheck = await validateDeliveryOrder({ zipCode, deliveryDate, totalGross });
    if (!deliveryCheck.ok) {
      return NextResponse.json({ error: deliveryCheck.error }, { status: 400 });
    }
  } else {
    const pickupCheck = await validatePickupOrder({ pickupDate, pickupSlot });
    if (!pickupCheck.ok) {
      return NextResponse.json({ error: pickupCheck.error }, { status: 400 });
    }
    pickupSlotId = pickupCheck.slotId ?? null;
  }

  try {
    const capture = await capturePayPalOrder(paypalOrderId);
    if (Math.abs(capture.amount - totalGross) > 0.02) {
      return NextResponse.json({ error: "Amount mismatch" }, { status: 400 });
    }

    const result = await createOrder({
      items: priced.items,
      orderType,
      customerEmail: customerEmail.trim(),
      customerName: customerName.trim(),
      customerPhone: customerPhone?.trim() || undefined,
      userId,
      isB2b,
      zipCode,
      address,
      deliveryDate,
      pickupDate,
      pickupSlot,
      pickupSlotId,
      locale,
      paymentReference: `paypal:${capture.captureId}`,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      orderNumber: result.orderNumber,
      orderId: result.orderId,
      total: result.totalGross,
    });
  } catch (e) {
    console.error("PayPal capture-order:", e);
    return NextResponse.json({ error: "PayPal capture failed" }, { status: 500 });
  }
}
