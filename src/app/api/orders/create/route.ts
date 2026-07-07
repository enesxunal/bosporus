import { NextResponse } from "next/server";
import { createOrder } from "@/lib/orders";
import { isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  validateAndPriceOrderItems,
  validateDeliveryOrder,
  validatePickupOrder,
} from "@/lib/order-validation";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { checkoutErrorMessage } from "@/lib/checkout-errors";
import type { CartItem } from "@/lib/types";

function errorMessage(code: string, locale: "de" | "tr"): string {
  return checkoutErrorMessage(code, locale);
}

export async function POST(request: Request) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json(
      {
        error:
          "Datenbank nicht verbunden. Bitte Supabase in Vercel verbinden und Migration ausführen.",
        code: "SUPABASE_NOT_CONFIGURED",
      },
      { status: 503 }
    );
  }

  const ip = clientIp(request);
  const limited = rateLimit(`order:${ip}`, 15, 60 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Zu viele Anfragen. Bitte später erneut versuchen." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } }
    );
  }

  const body = await request.json();
  const {
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
    notes,
    locale: bodyLocale,
  } = body as {
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
    notes?: string;
    locale?: "de" | "tr";
  };

  let locale: "de" | "tr" = bodyLocale === "tr" ? "tr" : "de";

  if (!items?.length) {
    return NextResponse.json({ error: "Warenkorb leer" }, { status: 400 });
  }
  if (!customerEmail?.trim() || !customerName?.trim()) {
    return NextResponse.json({ error: "Name und E-Mail erforderlich" }, { status: 400 });
  }

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
      if (profile?.locale === "tr" || profile?.locale === "de") {
        locale = profile.locale;
      }
    }
  } catch {
    // guest checkout
  }

  const priced = await validateAndPriceOrderItems(items, isB2b);
  if (!priced.ok) {
    return NextResponse.json(
      { error: errorMessage(priced.error, locale), code: priced.error },
      { status: 400 }
    );
  }

  let totalGross = 0;
  for (const item of priced.items) {
    totalGross += item.priceGross * item.quantity;
  }
  totalGross = Math.round(totalGross * 100) / 100;

  let pickupSlotId: string | null = null;
  let deliveryFee = 0;
  let distanceKm: number | null = null;
  let orderTotalGross = totalGross;

  if (orderType === "delivery") {
    const deliveryCheck = await validateDeliveryOrder({
      zipCode,
      address,
      deliveryDate,
      totalGross,
      isB2b,
    });
    if (!deliveryCheck.ok) {
      return NextResponse.json(
        { error: errorMessage(deliveryCheck.error, locale), code: deliveryCheck.error },
        { status: 400 }
      );
    }
    deliveryFee = deliveryCheck.deliveryFee;
    distanceKm = deliveryCheck.distanceKm;
    orderTotalGross = deliveryCheck.totalGross;
  } else {
    const pickupCheck = await validatePickupOrder({ pickupDate, pickupSlot, totalGross, isB2b });
    if (!pickupCheck.ok) {
      return NextResponse.json(
        { error: errorMessage(pickupCheck.error, locale), code: pickupCheck.error },
        { status: 400 }
      );
    }
    pickupSlotId = pickupCheck.slotId ?? null;
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
    notes,
    locale,
    deliveryFee,
    distanceKm,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: checkoutErrorMessage(result.error, locale), code: result.error },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    orderNumber: result.orderNumber,
    orderId: result.orderId,
    total: orderTotalGross,
    deliveryFee,
  });
}
