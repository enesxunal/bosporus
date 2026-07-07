import Stripe from "stripe";

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}

export function getStripePublishableKey(): string | null {
  return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() ?? null;
}

export function getStripeClient(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return null;
  return new Stripe(key);
}

export function stripePaymentReference(sessionId: string): string {
  return `stripe:${sessionId}`;
}

export function siteBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

export function checkoutSuccessUrl(locale: "de" | "tr"): string {
  const base = siteBaseUrl();
  const prefix = locale === "tr" ? "/tr" : "";
  return `${base}${prefix}/checkout/success?session_id={CHECKOUT_SESSION_ID}`;
}

export function checkoutCancelUrl(locale: "de" | "tr"): string {
  const base = siteBaseUrl();
  const prefix = locale === "tr" ? "/tr" : "";
  return `${base}${prefix}/checkout`;
}
