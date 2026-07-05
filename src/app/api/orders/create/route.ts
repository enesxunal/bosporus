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
import type { CartItem } from "@/lib/types";

const ERROR_MSG: Record<string, { de: string; tr: string }> = {
  PRICE_MISMATCH: {
    de: "Preise haben sich geändert. Bitte Warenkorb prüfen.",
    tr: "Fiyatlar değişti. Lütfen sepeti kontrol edin.",
  },
  PICKUP_SLOT_FULL: {
    de: "Dieser Abholtermin ist ausgebucht. Bitte andere Zeit wählen.",
    tr: "Bu gel-al saati dolu. Lütfen başka saat seçin.",
  },
  MIN_ORDER_NOT_MET: {
    de: "Mindestbestellwert nicht erreicht.",
    tr: "Minimum sipariş tutarına ulaşılmadı.",
  },
  DELIVERY_ZONE_INVALID: {
    de: "Lieferung in diese PLZ nicht möglich.",
    tr: "Bu posta koduna teslimat yok.",
  },
  DELIVERY_DAY_INVALID: {
    de: "An diesem Tag keine Lieferung möglich.",
    tr: "Bu gün teslimat yapılmıyor.",
  },
};

function errorMessage(code: string, locale: "de" | "tr"): string {
  const entry = ERROR_MSG[code];
  if (entry) return locale === "tr" ? entry.tr : entry.de;
  return locale === "tr" ? "Sipariş oluşturulamadı." : "Bestellung fehlgeschlagen.";
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

  if (orderType === "delivery") {
    const deliveryCheck = await validateDeliveryOrder({ zipCode, deliveryDate, totalGross });
    if (!deliveryCheck.ok) {
      return NextResponse.json(
        { error: errorMessage(deliveryCheck.error, locale), code: deliveryCheck.error },
        { status: 400 }
      );
    }
  } else {
    const pickupCheck = await validatePickupOrder({ pickupDate, pickupSlot });
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
}
