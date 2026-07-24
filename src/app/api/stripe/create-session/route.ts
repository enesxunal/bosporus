import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import {
  validateAndPriceOrderItems,
  validateDeliveryOrder,
  validatePickupOrder,
} from "@/lib/order-validation";
import {
  checkoutCancelUrl,
  checkoutSuccessUrl,
  getStripeClient,
  isStripeConfigured,
} from "@/lib/stripe";
import type { CartItem } from "@/lib/types";
import { cartLineTotalGross } from "@/lib/pfand";
import { B2B_ONLY_MODE } from "@/lib/shop-mode";

interface CheckoutBody {
  items: CartItem[];
  orderType: "delivery" | "click_collect";
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  zipCode?: string;
  address?: string;
  deliveryDate?: string;
  pickupDate?: string;
  pickupSlot?: string;
  locale?: "de" | "tr";
}

export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const stripe = getStripeClient();
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const body = (await request.json()) as CheckoutBody;
  if (!body.items?.length || !body.customerEmail?.trim() || !body.customerName?.trim()) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  let locale: "de" | "tr" = body.locale === "tr" ? "tr" : "de";
  let userId: string | null = null;
  let isB2b = false;

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      userId = user.id;
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, locale, vat_verified")
        .eq("id", user.id)
        .single();
      isB2b = profile?.role === "b2b_approved" && Boolean(profile.vat_verified);
      if (profile?.locale === "tr" || profile?.locale === "de") locale = profile.locale;
    }
  } catch {
    // guest
  }

  if (B2B_ONLY_MODE && !isB2b) {
    return NextResponse.json(
      { error: "Nur freigeschaltete Gewerbekunden können bestellen." },
      { status: 403 }
    );
  }

  const priced = await validateAndPriceOrderItems(body.items, isB2b);
  if (!priced.ok) {
    return NextResponse.json({ error: priced.error }, { status: 400 });
  }

  let subtotalGross = 0;
  for (const item of priced.items) {
    subtotalGross += cartLineTotalGross(item);
  }
  subtotalGross = Math.round(subtotalGross * 100) / 100;

  let deliveryFee = 0;
  let distanceKm: number | null = null;
  let pickupSlotId: string | null = null;

  if (body.orderType === "delivery") {
    const deliveryCheck = await validateDeliveryOrder({
      zipCode: body.zipCode,
      address: body.address,
      deliveryDate: body.deliveryDate,
      totalGross: subtotalGross,
      isB2b,
      userId,
    });
    if (!deliveryCheck.ok) {
      return NextResponse.json({ error: deliveryCheck.error }, { status: 400 });
    }
    deliveryFee = deliveryCheck.deliveryFee;
    distanceKm = deliveryCheck.distanceKm;
  } else {
    const pickupCheck = await validatePickupOrder({
      pickupDate: body.pickupDate,
      pickupSlot: body.pickupSlot,
      totalGross: subtotalGross,
      isB2b,
    });
    if (!pickupCheck.ok) {
      return NextResponse.json({ error: pickupCheck.error }, { status: 400 });
    }
    pickupSlotId = pickupCheck.slotId ?? null;
  }

  const productLineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = priced.items.map((item) => {
    const unitGross = item.priceGross + (item.pfand?.priceGross ?? 0);
    const name = item.pfand
      ? `${item.name.slice(0, 90)} (+ Pfand)`
      : item.name.slice(0, 120);
    return {
      price_data: {
        currency: "eur" as const,
        product_data: {
          name,
          metadata: {
            sku: item.sku,
            productId: item.productId,
          },
        },
        unit_amount: Math.round(unitGross * 100),
      },
      quantity: Math.round(item.quantity),
    };
  });
  const lineItems = [...productLineItems];
  if (deliveryFee > 0) {
    lineItems.push({
      price_data: {
        currency: "eur" as const,
        product_data: {
          name: locale === "de" ? "Liefergebühr" : "Teslimat ücreti",
          metadata: {
            sku: "_delivery",
            productId: "_delivery",
            type: "delivery_fee",
          },
        },
        unit_amount: Math.round(deliveryFee * 100),
      },
      quantity: 1,
    });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card", "klarna"],
      customer_email: body.customerEmail.trim(),
      line_items: lineItems,
      locale: locale === "de" ? "de" : "en",
      metadata: {
        orderType: body.orderType,
        customerName: body.customerName.trim().slice(0, 200),
        customerEmail: body.customerEmail.trim().slice(0, 200),
        customerPhone: (body.customerPhone ?? "").slice(0, 50),
        zipCode: (body.zipCode ?? "").slice(0, 20),
        address: (body.address ?? "").slice(0, 450),
        deliveryDate: body.orderType === "delivery" ? (body.deliveryDate ?? "") : "",
        pickupDate: body.orderType === "click_collect" ? (body.pickupDate ?? "") : "",
        pickupSlot: body.orderType === "click_collect" ? (body.pickupSlot ?? "") : "",
        pickupSlotId: pickupSlotId ?? "",
        locale,
        userId: userId ?? "",
        isB2b: isB2b ? "true" : "false",
        deliveryFee: String(deliveryFee),
        distanceKm: distanceKm != null ? String(distanceKm) : "",
      },
      success_url: checkoutSuccessUrl(locale),
      cancel_url: checkoutCancelUrl(locale),
    });

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (e) {
    console.error("Stripe create-session:", e);
    return NextResponse.json({ error: "STRIPE_ERROR" }, { status: 500 });
  }
}
