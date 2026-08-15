import type { AcquisitionSource } from "./acquisition";
import {
  isAcquisitionSource,
  isAmountBucketValue,
  isClientWritableEvent,
  isDeviceCategory,
  isFirstPartyId,
  isFunnelSegment,
  isItemCountBucket,
  isOrderType,
  isSiteLocale,
  type AmountBucket,
  type DeviceCategory,
  type FunnelSegment,
  type ItemCountBucket,
  type SiteLocale,
  type SiteOrderType,
} from "./site-funnel-shared";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface SiteEventContext {
  anonymousId: string;
  sessionId: string | null;
  source: AcquisitionSource | null;
  device: DeviceCategory | null;
  locale: SiteLocale | null;
}

export type SiteEventPayload = SiteEventContext &
  (
    | { eventName: "site_visit" }
    | { eventName: "product_view"; productId: string; priceBucket: AmountBucket }
    | {
        eventName: "add_to_cart";
        productId: string;
        quantity: number;
        cartSubtotalBucket: AmountBucket;
      }
    | { eventName: "cart_view"; itemCountBucket: ItemCountBucket; subtotalBucket: AmountBucket }
    | {
        eventName: "min_order_blocked";
        subtotalBucket: AmountBucket;
        minRequired: number;
        segment: FunnelSegment;
        orderType: SiteOrderType;
      }
    | { eventName: "register_view" }
    | { eventName: "login_view" }
    | { eventName: "registration_started" }
    | { eventName: "registration_completed" }
    | { eventName: "b2b_application_submitted" }
    | { eventName: "begin_checkout"; subtotalBucket: AmountBucket }
    | { eventName: "quick_order_view" }
    | { eventName: "quick_order_used"; linesAdded: number }
  );

function readContext(body: Record<string, unknown>): SiteEventContext | null {
  if (!isFirstPartyId(body.anonymousId)) return null;
  return {
    anonymousId: body.anonymousId,
    sessionId: isFirstPartyId(body.sessionId) ? body.sessionId : null,
    source: isAcquisitionSource(body.source) ? body.source : null,
    device: isDeviceCategory(body.device) ? body.device : null,
    locale: isSiteLocale(body.locale) ? body.locale : null,
  };
}

function readQuantity(value: unknown, max: number): number | null {
  const quantity = Math.floor(Number(value));
  if (!Number.isFinite(quantity) || quantity < 1 || quantity > max) return null;
  return quantity;
}

/**
 * Parse and strictly validate a client-provided site-funnel event.
 * Only allowlisted event names and typed metadata survive. Any user_id in the
 * body is ignored on purpose: the server resolves identity from the session.
 */
export function parseSiteEvent(input: unknown): SiteEventPayload | null {
  if (!input || typeof input !== "object") return null;
  const body = input as Record<string, unknown>;

  const eventName = body.eventName;
  if (!isClientWritableEvent(eventName)) return null;

  const context = readContext(body);
  if (!context) return null;

  switch (eventName) {
    case "site_visit":
    case "register_view":
    case "login_view":
    case "registration_started":
    case "registration_completed":
    case "b2b_application_submitted":
    case "quick_order_view":
      return { ...context, eventName };

    case "product_view": {
      if (typeof body.productId !== "string" || !UUID_PATTERN.test(body.productId)) return null;
      if (!isAmountBucketValue(body.priceBucket)) return null;
      return { ...context, eventName, productId: body.productId, priceBucket: body.priceBucket };
    }

    case "add_to_cart": {
      const quantity = readQuantity(body.quantity, 999);
      if (
        typeof body.productId !== "string" ||
        !UUID_PATTERN.test(body.productId) ||
        quantity === null ||
        !isAmountBucketValue(body.cartSubtotalBucket)
      ) {
        return null;
      }
      return {
        ...context,
        eventName,
        productId: body.productId,
        quantity,
        cartSubtotalBucket: body.cartSubtotalBucket,
      };
    }

    case "cart_view": {
      if (!isItemCountBucket(body.itemCountBucket) || !isAmountBucketValue(body.subtotalBucket)) {
        return null;
      }
      return {
        ...context,
        eventName,
        itemCountBucket: body.itemCountBucket,
        subtotalBucket: body.subtotalBucket,
      };
    }

    case "min_order_blocked": {
      const minRequired = Number(body.minRequired);
      if (
        !isAmountBucketValue(body.subtotalBucket) ||
        !Number.isFinite(minRequired) ||
        minRequired < 0 ||
        minRequired > 100000 ||
        !isFunnelSegment(body.segment) ||
        !isOrderType(body.orderType)
      ) {
        return null;
      }
      return {
        ...context,
        eventName,
        subtotalBucket: body.subtotalBucket,
        minRequired: Math.round(minRequired * 100) / 100,
        segment: body.segment,
        orderType: body.orderType,
      };
    }

    case "begin_checkout": {
      if (!isAmountBucketValue(body.subtotalBucket)) return null;
      return { ...context, eventName, subtotalBucket: body.subtotalBucket };
    }

    case "quick_order_used": {
      const linesAdded = readQuantity(body.linesAdded, 100);
      if (linesAdded === null) return null;
      return { ...context, eventName, linesAdded };
    }

    default:
      return null;
  }
}
