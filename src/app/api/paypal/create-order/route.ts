import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  validateAndPriceOrderItems,
  validateDeliveryOrder,
  validatePickupOrder,
} from "@/lib/order-validation";
import {
  createPayPalOrder,
  getPayPalClientId,
  getPayPalMode,
  isPayPalConfigured,
  verifyPayPalConnection,
} from "@/lib/paypal";
import { isB2BApproved, type CartItem } from "@/lib/types";
import { cartLineTotalGross } from "@/lib/pfand";
import { recordBeginCheckout } from "@/lib/b2b-funnel-server";

export async function GET() {
  if (!isPayPalConfigured()) {
    return NextResponse.json({ enabled: false });
  }
  const connection = await verifyPayPalConnection();
  return NextResponse.json({
    enabled: true,
    ready: connection.ok,
    issue: connection.ok ? undefined : connection.code,
    clientId: getPayPalClientId(),
    mode: getPayPalMode(),
  });
}

interface CheckoutBody {
  items: CartItem[];
  orderType: "delivery" | "click_collect";
  zipCode?: string;
  address?: string;
  deliveryDate?: string;
  pickupDate?: string;
  pickupSlot?: string;
}

async function resolveTotal(body: CheckoutBody, isB2b: boolean, userId: string | null) {
  const priced = await validateAndPriceOrderItems(body.items, isB2b);
  if (!priced.ok) return { ok: false as const, error: priced.error };

  let subtotalGross = 0;
  for (const item of priced.items) {
    subtotalGross += cartLineTotalGross(item);
  }
  subtotalGross = Math.round(subtotalGross * 100) / 100;

  let deliveryFee = 0;
  let distanceKm: number | null = null;
  let totalGross = subtotalGross;

  if (body.orderType === "delivery") {
    const deliveryCheck = await validateDeliveryOrder({
      zipCode: body.zipCode,
      address: body.address,
      deliveryDate: body.deliveryDate,
      totalGross: subtotalGross,
      isB2b,
      userId,
      items: priced.items,
    });
    if (!deliveryCheck.ok) return { ok: false as const, error: deliveryCheck.error };
    deliveryFee = deliveryCheck.deliveryFee;
    distanceKm = deliveryCheck.distanceKm;
    totalGross = deliveryCheck.totalGross;
  } else {
    const pickupCheck = await validatePickupOrder({
      pickupDate: body.pickupDate,
      pickupSlot: body.pickupSlot,
      totalGross: subtotalGross,
      isB2b,
      userId,
      items: priced.items,
    });
    if (!pickupCheck.ok) return { ok: false as const, error: pickupCheck.error };
  }

  return { ok: true as const, totalGross, subtotalGross, deliveryFee, distanceKm, items: priced.items };
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
  let userId: string | null = null;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      userId = user.id;
      const { data: profile } = await supabase.from("profiles").select("role, vat_verified").eq("id", user.id).single();
      isB2b = isB2BApproved(profile);
    }
  } catch {
    // guest
  }

  const { B2B_ONLY_MODE } = await import("@/lib/shop-mode");
  if (B2B_ONLY_MODE && !isB2b) {
    return NextResponse.json(
      { error: "Nur freigeschaltete Gewerbekunden können bestellen." },
      { status: 403 }
    );
  }

  const resolved = await resolveTotal(body, isB2b, userId);
  if (!resolved.ok) {
    return NextResponse.json({ error: resolved.error }, { status: 400 });
  }

  await recordBeginCheckout({
    userId,
    isApprovedB2b: isB2b,
    subtotal: resolved.subtotalGross,
    orderType: body.orderType,
  });

  try {
    const paypalOrderId = await createPayPalOrder(resolved.totalGross);
    return NextResponse.json({ paypalOrderId, total: resolved.totalGross });
  } catch (e) {
    const code = e instanceof Error ? e.message : "PAYPAL_ERROR";
    console.error("PayPal create-order:", e);
    return NextResponse.json({ error: code }, { status: 500 });
  }
}
