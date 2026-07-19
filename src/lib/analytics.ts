/** Google Analytics 4 (gtag) + Tag Manager dataLayer + Meta / TikTok pikselleri */

export type AnalyticsParams = Record<string, string | number | boolean | undefined | null>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
    ttq?: {
      track: (event: string, params?: Record<string, unknown>) => void;
      page?: () => void;
    };
  }
}

const CONSENT_KEY = "bosporus-cookie-consent";
const PENDING_KEY = "bosporus_analytics_pending";
const SENT_PURCHASE_PREFIX = "ga_purchase_";

type QueuedEvent = {
  name: string;
  params: Record<string, unknown>;
  /** purchase tekilleştirme */
  dedupeKey?: string;
};

function cleanParams(params: AnalyticsParams): Record<string, string | number | boolean> {
  const clean: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") clean[k] = v;
  }
  return clean;
}

function hasMarketingConsent(): boolean {
  try {
    return localStorage.getItem(CONSENT_KEY) === "accepted";
  } catch {
    return false;
  }
}

function analyticsReady(): boolean {
  return typeof window !== "undefined" && typeof window.gtag === "function";
}

function readQueue(): QueuedEvent[] {
  try {
    const raw = sessionStorage.getItem(PENDING_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as QueuedEvent[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeQueue(list: QueuedEvent[]): void {
  try {
    sessionStorage.setItem(PENDING_KEY, JSON.stringify(list.slice(-40)));
  } catch {
    /* private mode */
  }
}

function enqueue(ev: QueuedEvent): void {
  const list = readQueue();
  if (ev.dedupeKey && list.some((x) => x.dedupeKey === ev.dedupeKey)) return;
  list.push(ev);
  writeQueue(list);
}

function fireGtag(name: string, params: Record<string, unknown>): void {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: name, ...params });
  if (typeof window.gtag === "function") {
    window.gtag("event", name, params);
  }
}

/**
 * Çerez + gtag hazır değilse kuyruğa alır; hazır olunca GA4’e gönderir.
 * Böylece sepete ekleme GTM gecikmesinde kaybolmaz.
 */
export function trackEvent(event: string, params: AnalyticsParams = {}): void {
  if (typeof window === "undefined") return;
  const clean = cleanParams(params);

  if (!hasMarketingConsent() || !analyticsReady()) {
    enqueue({ name: event, params: clean });
    return;
  }

  fireGtag(event, clean);
}

/** Kuyruktaki olayları gönder (AnalyticsLoader çağırır) */
export function flushPendingAnalytics(): void {
  if (typeof window === "undefined") return;
  if (!hasMarketingConsent() || !analyticsReady()) return;

  const list = readQueue();
  if (list.length === 0) return;

  const remaining: QueuedEvent[] = [];
  for (const ev of list) {
    if (ev.dedupeKey) {
      try {
        if (sessionStorage.getItem(ev.dedupeKey)) continue;
      } catch {
        /* ignore */
      }
    }
    fireGtag(ev.name, ev.params);
    if (ev.dedupeKey) {
      try {
        sessionStorage.setItem(ev.dedupeKey, "1");
      } catch {
        /* ignore */
      }
    }
  }
  writeQueue(remaining);
}

/** @deprecated alias — eski isim */
export function flushPendingPurchases(): void {
  flushPendingAnalytics();
}

function ecommerceItem(item: {
  item_id: string;
  item_name: string;
  price?: number;
  quantity?: number;
}) {
  return {
    item_id: item.item_id,
    item_name: item.item_name,
    price: item.price,
    quantity: item.quantity ?? 1,
  };
}

/** Ürün detay görüntüleme — GA4 satın alma yolculuğu için şart */
export function trackViewItem(item: {
  item_id: string;
  item_name: string;
  price?: number;
}): void {
  const value = item.price != null ? Math.round(item.price * 100) / 100 : undefined;
  const params = {
    currency: "EUR",
    value,
    items: [ecommerceItem({ ...item, quantity: 1 })],
  };

  if (typeof window === "undefined") return;
  if (!hasMarketingConsent() || !analyticsReady()) {
    enqueue({ name: "view_item", params });
    return;
  }
  fireGtag("view_item", params);
}

/** WhatsApp yüzen buton / iletişim */
export function trackWhatsAppClick(source = "float"): void {
  trackEvent("whatsapp_click", { source });
  try {
    window.fbq?.("trackCustom", "WhatsAppClick", { source });
    window.ttq?.track("Contact", { content_name: "whatsapp" });
  } catch {
    /* pixel yok */
  }
}

/** Kayıt: privat veya gewerbe */
export function trackSignUp(method: "b2c" | "b2b"): void {
  trackEvent("sign_up", { method });
  try {
    window.fbq?.("track", "CompleteRegistration", { status: true, content_name: method });
    window.ttq?.track("CompleteRegistration", { content_name: method });
  } catch {
    /* pixel yok */
  }
}

/** Sepete ekleme */
export function trackAddToCart(item: {
  item_id: string;
  item_name: string;
  price?: number;
  quantity?: number;
}): void {
  const qty = item.quantity ?? 1;
  const value = item.price != null ? Math.round(item.price * qty * 100) / 100 : undefined;
  const params = {
    currency: "EUR",
    value,
    items: [ecommerceItem({ ...item, quantity: qty })],
  };

  if (typeof window === "undefined") return;
  if (!hasMarketingConsent() || !analyticsReady()) {
    enqueue({ name: "add_to_cart", params });
  } else {
    fireGtag("add_to_cart", params);
  }

  try {
    window.fbq?.("track", "AddToCart", {
      content_ids: [item.item_id],
      content_name: item.item_name,
      content_type: "product",
      value,
      currency: "EUR",
    });
    window.ttq?.track("AddToCart", {
      content_id: item.item_id,
      content_name: item.item_name,
      value,
      currency: "EUR",
      quantity: qty,
    });
  } catch {
    /* pixel yok */
  }
}

/** Ödeme sayfası açıldı */
export function trackBeginCheckout(value?: number): void {
  const v = value != null ? Math.round(value * 100) / 100 : undefined;
  const params = { currency: "EUR", value: v };

  if (typeof window === "undefined") return;
  if (!hasMarketingConsent() || !analyticsReady()) {
    enqueue({ name: "begin_checkout", params });
  } else {
    fireGtag("begin_checkout", params);
  }

  try {
    window.fbq?.("track", "InitiateCheckout", { value: v, currency: "EUR" });
    window.ttq?.track("InitiateCheckout", { value: v, currency: "EUR" });
  } catch {
    /* pixel yok */
  }
}

/** Sipariş tamamlandı */
export function trackPurchase(orderNumber: string, value?: number): void {
  if (typeof window === "undefined" || !orderNumber) return;

  const dedupeKey = `${SENT_PURCHASE_PREFIX}${orderNumber}`;
  try {
    if (sessionStorage.getItem(dedupeKey)) return;
  } catch {
    /* ignore */
  }

  const v = value != null ? Math.round(value * 100) / 100 : undefined;
  const params = {
    transaction_id: orderNumber,
    currency: "EUR",
    value: v,
  };

  // Google Ads dönüşüm event’i (Ads’te conversion_event_purchase olarak tanımlı)
  const adsParams = {
    transaction_id: orderNumber,
    currency: "EUR",
    value: v ?? 0,
  };

  if (!hasMarketingConsent() || !analyticsReady()) {
    enqueue({ name: "purchase", params, dedupeKey });
    enqueue({
      name: "conversion_event_purchase",
      params: adsParams,
      dedupeKey: `${dedupeKey}_ads`,
    });
    return;
  }

  fireGtag("purchase", params);
  fireGtag("conversion_event_purchase", adsParams);
  try {
    sessionStorage.setItem(dedupeKey, "1");
    sessionStorage.setItem(`${dedupeKey}_ads`, "1");
  } catch {
    /* ignore */
  }

  try {
    window.fbq?.("track", "Purchase", {
      value: v ?? 0,
      currency: "EUR",
      content_type: "product",
      contents: [{ id: orderNumber, quantity: 1 }],
    });
    window.ttq?.track("CompletePayment", {
      value: v ?? 0,
      currency: "EUR",
      content_id: orderNumber,
    });
  } catch {
    /* pixel yok */
  }
}
