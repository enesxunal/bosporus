import { NextResponse } from "next/server";
import Stripe from "stripe";
import type { CartItem } from "@/lib/types";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key);
}

export async function POST(request: Request) {
  const body = await request.json();
  const {
    items,
    orderType,
    zipCode,
    address,
    pickupDate,
    pickupSlot,
    locale,
  } = body as {
    items: CartItem[];
    orderType: "delivery" | "click_collect";
    zipCode?: string;
    address?: string;
    pickupDate?: string;
    pickupSlot?: string;
    locale?: string;
  };

  if (!items?.length) {
    return NextResponse.json({ error: "Warenkorb leer" }, { status: 400 });
  }

  const totalCents = Math.round(
    items.reduce((s, i) => s + i.priceGross * i.quantity, 0) * 100
  );

  const stripe = getStripe();
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  if (!stripe) {
    // Demo mode without Stripe keys
    return NextResponse.json({
      demo: true,
      orderNumber: `BOS-${Date.now()}`,
      total: totalCents / 100,
    });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: items.map((item) => ({
        price_data: {
          currency: "eur",
          product_data: {
            name: item.name,
            metadata: { sku: item.sku },
          },
          unit_amount: Math.round(item.priceGross * 100),
        },
        quantity: item.quantity,
      })),
      metadata: {
        orderType,
        zipCode: zipCode ?? "",
        pickupDate: pickupDate ?? "",
        pickupSlot: pickupSlot ?? "",
      },
      success_url: `${baseUrl}/${locale === "tr" ? "tr" : ""}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/${locale === "tr" ? "tr" : ""}/cart`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Stripe Fehler" }, { status: 500 });
  }
}
