import { NextResponse } from "next/server";
import { fulfillStripeCheckoutSession } from "@/lib/stripe-fulfillment";
import { getStripeClient } from "@/lib/stripe";
import type Stripe from "stripe";

export async function POST(request: Request) {
  const stripe = getStripeClient();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!stripe || !webhookSecret) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (e) {
    console.error("Stripe webhook signature:", e);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.id) {
      try {
        await fulfillStripeCheckoutSession(session.id);
      } catch (e) {
        console.error("Stripe webhook fulfill:", e);
        return NextResponse.json({ error: "Fulfill failed" }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ received: true });
}
