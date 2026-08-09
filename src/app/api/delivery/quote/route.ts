import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isB2cFirstOrderEligible, quoteDelivery } from "@/lib/delivery-pricing";
import { isPaymentTestCart } from "@/lib/payment-test-product";
import { validateAndPriceOrderItems } from "@/lib/order-validation";
import type { CartItem } from "@/lib/types";

export async function POST(request: Request) {
  const body = await request.json();
  const {
    orderType,
    subtotalGross,
    zipCode,
    address,
    items: clientItems,
  } = body as {
    orderType: "delivery" | "click_collect";
    subtotalGross: number;
    zipCode?: string;
    address?: string;
    /** Optional cart lines — when present, server re-prices and may apply payment-test bypass */
    items?: CartItem[];
  };

  if (!orderType || !Number.isFinite(subtotalGross)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
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
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      isB2b = profile?.role === "b2b_approved";
    }
  } catch {
    // guest
  }

  let paymentTestCart = false;
  let quoteSubtotal = subtotalGross;

  // Server-side SKU verification — never trust client isTest / bypass flags
  if (Array.isArray(clientItems) && clientItems.length > 0) {
    const priced = await validateAndPriceOrderItems(clientItems, isB2b);
    if (priced.ok) {
      paymentTestCart = isPaymentTestCart(priced.items);
      if (paymentTestCart) {
        let sum = 0;
        for (const item of priced.items) {
          sum += item.priceGross * item.quantity;
        }
        quoteSubtotal = Math.round(sum * 100) / 100;
      }
    }
  }

  const firstOrderEligible = paymentTestCart
    ? false
    : await isB2cFirstOrderEligible(userId, isB2b);

  const quote = await quoteDelivery({
    orderType,
    isB2b,
    subtotalGross: quoteSubtotal,
    zipCode,
    address,
    firstOrderFree: firstOrderEligible,
    paymentTestCart,
  });

  return NextResponse.json({
    quote,
    isB2b,
    firstOrderEligible,
    paymentTestCart,
  });
}
