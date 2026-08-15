"use client";

import { ACQUISITION_STORAGE_KEY, parseFirstTouch, type AcquisitionSource } from "./acquisition";
import {
  amountBucket,
  itemCountBucket,
  isAcquisitionSource,
  type FunnelSegment,
  type SiteLocale,
  type SiteOrderType,
} from "./site-funnel-shared";
import { getDeviceCategory, getSessionId, getVisitorId } from "./visitor-id";

const SOURCE_KEY = "bosporus_source";

/**
 * Normalized first-party source, persisted independently so it survives the
 * acquisition claim (which clears the first-touch key after login).
 */
function getStoredSource(): AcquisitionSource | null {
  if (typeof window === "undefined") return null;
  try {
    const cached = window.localStorage.getItem(SOURCE_KEY);
    if (isAcquisitionSource(cached)) return cached;

    const firstTouch = parseFirstTouch(
      window.localStorage.getItem(ACQUISITION_STORAGE_KEY)
    );
    if (firstTouch) {
      window.localStorage.setItem(SOURCE_KEY, firstTouch.source);
      return firstTouch.source;
    }
    return null;
  } catch {
    return null;
  }
}

type EventBody = Record<string, unknown>;

function buildContext(locale: SiteLocale | null): EventBody | null {
  const anonymousId = getVisitorId();
  if (!anonymousId) return null;
  return {
    anonymousId,
    sessionId: getSessionId(),
    source: getStoredSource(),
    device: getDeviceCategory(),
    locale,
  };
}

function post(body: EventBody): void {
  try {
    void fetch("/api/funnel/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    // Analytics must never block shopping behavior.
  }
}

/** Fire once per condition key within the current tab. */
function onceGuard(key: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (window.sessionStorage.getItem(key)) return false;
    window.sessionStorage.setItem(key, "1");
    return true;
  } catch {
    return true;
  }
}

function send(eventName: string, locale: SiteLocale | null, extra: EventBody = {}): void {
  const context = buildContext(locale);
  if (!context) return;
  post({ ...context, eventName, ...extra });
}

export function trackSiteVisit(locale: SiteLocale | null): void {
  const sessionId = getSessionId();
  if (sessionId && !onceGuard(`sf_visit_${sessionId}`)) return;
  send("site_visit", locale);
}

export function trackProductView(params: {
  productId: string;
  price: number;
  locale: SiteLocale | null;
}): void {
  if (!onceGuard(`sf_pv_${params.productId}`)) return;
  send("product_view", params.locale, {
    productId: params.productId,
    priceBucket: amountBucket(params.price),
  });
}

export function trackAddToCartSite(params: {
  productId: string;
  quantity: number;
  cartSubtotal: number;
  locale: SiteLocale | null;
}): void {
  send("add_to_cart", params.locale, {
    productId: params.productId,
    quantity: params.quantity,
    cartSubtotalBucket: amountBucket(params.cartSubtotal),
  });
}

export function trackCartView(params: {
  itemCount: number;
  subtotal: number;
  locale: SiteLocale | null;
}): void {
  send("cart_view", params.locale, {
    itemCountBucket: itemCountBucket(params.itemCount),
    subtotalBucket: amountBucket(params.subtotal),
  });
}

export function trackMinOrderBlockedSite(params: {
  subtotal: number;
  minRequired: number;
  segment: FunnelSegment;
  orderType: SiteOrderType;
  locale: SiteLocale | null;
}): void {
  const sessionId = getSessionId();
  if (sessionId && !onceGuard(`sf_minorder_${sessionId}_${params.segment}`)) return;
  send("min_order_blocked", params.locale, {
    subtotalBucket: amountBucket(params.subtotal),
    minRequired: params.minRequired,
    segment: params.segment,
    orderType: params.orderType,
  });
}

export function trackRegisterView(locale: SiteLocale | null): void {
  send("register_view", locale);
}

export function trackLoginView(locale: SiteLocale | null): void {
  send("login_view", locale);
}

export function trackRegistrationStarted(locale: SiteLocale | null): void {
  send("registration_started", locale);
}

export function trackRegistrationCompleted(locale: SiteLocale | null): void {
  send("registration_completed", locale);
}

export function trackB2bApplicationSubmitted(locale: SiteLocale | null): void {
  send("b2b_application_submitted", locale);
}

export function trackBeginCheckoutSite(params: {
  subtotal: number;
  locale: SiteLocale | null;
}): void {
  send("begin_checkout", params.locale, {
    subtotalBucket: amountBucket(params.subtotal),
  });
}

export function trackQuickOrderView(locale: SiteLocale | null): void {
  send("quick_order_view", locale);
}

export function getVisitorIdForClaim(): string | null {
  return getVisitorId();
}

let identityClaimInFlight: Promise<void> | null = null;

/**
 * Link the current anonymous journey to the signed-in user. Runs at most once
 * per tab and never rejects; the server derives user_id from the session.
 */
export function claimVisitorIdentity(): Promise<void> {
  if (identityClaimInFlight) return identityClaimInFlight;

  const anonymousId = getVisitorId();
  if (!anonymousId) return Promise.resolve();
  if (!onceGuard(`sf_identity_${anonymousId}`)) return Promise.resolve();

  identityClaimInFlight = fetch("/api/funnel/identity", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ anonymousId }),
  })
    .then(() => undefined)
    .catch(() => undefined)
    .finally(() => {
      identityClaimInFlight = null;
    });

  return identityClaimInFlight;
}
