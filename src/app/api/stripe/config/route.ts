import { NextResponse } from "next/server";
import { getStripePublishableKey, isStripeConfigured } from "@/lib/stripe";

export async function GET() {
  if (!isStripeConfigured()) {
    return NextResponse.json({ enabled: false });
  }
  return NextResponse.json({
    enabled: true,
    publishableKey: getStripePublishableKey(),
  });
}
