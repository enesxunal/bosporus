import { NextResponse } from "next/server";
import { checkoutErrorMessage } from "@/lib/checkout-errors";
import { fulfillStripeCheckoutSession } from "@/lib/stripe-fulfillment";
import { isStripeConfigured } from "@/lib/stripe";

export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const { sessionId, locale: bodyLocale } = (await request.json()) as {
    sessionId?: string;
    locale?: "de" | "tr";
  };
  const locale: "de" | "tr" = bodyLocale === "tr" ? "tr" : "de";

  if (!sessionId?.trim()) {
    return NextResponse.json({ error: "Missing session" }, { status: 400 });
  }

  try {
    const result = await fulfillStripeCheckoutSession(sessionId.trim());
    if (!result.ok) {
      return NextResponse.json(
        { error: checkoutErrorMessage(result.error, locale), code: result.error },
        { status: 400 }
      );
    }
    return NextResponse.json({ success: true, orderNumber: result.orderNumber });
  } catch (e) {
    console.error("Stripe complete-session:", e);
    return NextResponse.json(
      { error: checkoutErrorMessage("STRIPE_ERROR", locale) },
      { status: 500 }
    );
  }
}
