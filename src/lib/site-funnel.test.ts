import { afterEach, describe, expect, it, vi } from "vitest";
import {
  isClientWritableEvent,
  isDeviceCategory,
  isFirstPartyId,
  itemCountBucket,
} from "./site-funnel-shared";
import { parseSiteEvent } from "./site-funnel-request";
import {
  buildSiteEventMetadata,
  linkVisitorIdentity,
  recordSiteFunnelEvent,
  recordSitePurchase,
} from "./site-funnel-server";
import { summarizeSiteFunnel, summarizeSiteFunnelTrend } from "./site-funnel-admin";
import { getSiteFunnelInsights, type SiteFunnelSummary } from "./site-funnel-dashboard";
import { isVerifiedBotUserAgent } from "./bot-detection";
import { periodDelta } from "./funnel-period";

const ANON_A = "aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa";
const ANON_B = "bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb";
const USER_X = "cccccccc-3333-4333-8333-cccccccccccc";
const PRODUCT_ID = "22222222-2222-4222-8222-222222222222";

function createFakeAdmin() {
  const inserts: Record<string, unknown>[] = [];
  const unique = new Set<string>();
  const admin = {
    from() {
      return {
        async insert(row: Record<string, unknown>) {
          const key = `${row.event_name}:${row.dedupe_key ?? row.anonymous_id ?? ""}:${row.user_id ?? ""}`;
          if (row.dedupe_key && unique.has(`${row.event_name}:${row.dedupe_key}`)) {
            return { error: { code: "23505" } };
          }
          if (row.dedupe_key) unique.add(`${row.event_name}:${row.dedupe_key}`);
          void key;
          inserts.push(row);
          return { error: null };
        },
      };
    },
  };
  return { admin: admin as never, inserts };
}

describe("site-funnel-shared", () => {
  it("kaba sepet ve id doğrulaması PII içermez", () => {
    expect(itemCountBucket(1)).toBe("1");
    expect(itemCountBucket(3)).toBe("2-3");
    expect(itemCountBucket(50)).toBe("13+");
    expect(isFirstPartyId(ANON_A)).toBe(true);
    expect(isFirstPartyId("mailto:test@example.com")).toBe(false);
    expect(isDeviceCategory("mobile")).toBe(true);
    expect(isDeviceCategory("iphone-14-pro")).toBe(false);
    expect(isClientWritableEvent("product_view")).toBe(true);
    // Purchase is server-only and must never be client-writable.
    expect(isClientWritableEvent("purchase")).toBe(false);
  });
});

describe("parseSiteEvent", () => {
  it("geçerli product_view kabul edilir, anonymous id zorunludur", () => {
    const parsed = parseSiteEvent({
      eventName: "product_view",
      anonymousId: ANON_A,
      sessionId: ANON_B,
      source: "google_ads",
      device: "mobile",
      locale: "de",
      productId: PRODUCT_ID,
      priceBucket: "100-249",
    });
    expect(parsed).not.toBeNull();
    expect(parsed?.eventName).toBe("product_view");
  });

  it("client user_id ve PII alanları taşınmaz", () => {
    const parsed = parseSiteEvent({
      eventName: "site_visit",
      anonymousId: ANON_A,
      userId: "spoofed-user",
      email: "leak@example.com",
      phone: "+491700000000",
      companyName: "ACME GmbH",
      source: "facebook",
      device: "desktop",
      locale: "tr",
    });
    expect(parsed).not.toBeNull();
    // No user_id / PII keys survive parsing.
    expect(Object.keys(parsed ?? {})).not.toContain("userId");
    expect(Object.keys(parsed ?? {})).not.toContain("email");
    expect(Object.keys(parsed ?? {})).not.toContain("phone");
    expect(Object.keys(parsed ?? {})).not.toContain("companyName");
  });

  it("purchase gibi kritik event ve bozuk id reddedilir", () => {
    expect(parseSiteEvent({ eventName: "purchase", anonymousId: ANON_A })).toBeNull();
    expect(parseSiteEvent({ eventName: "site_visit", anonymousId: "nope" })).toBeNull();
    expect(
      parseSiteEvent({
        eventName: "min_order_blocked",
        anonymousId: ANON_A,
        subtotalBucket: "250-499",
        minRequired: 500,
        segment: "hacker",
        orderType: "click_collect",
      })
    ).toBeNull();
  });
});

describe("buildSiteEventMetadata", () => {
  it("yalnız allowlisted + bucketlı alanları saklar", () => {
    const meta = buildSiteEventMetadata({
      eventName: "add_to_cart",
      anonymousId: ANON_A,
      sessionId: null,
      source: "google_ads",
      device: "mobile",
      locale: "de",
      productId: PRODUCT_ID,
      quantity: 2,
      cartSubtotalBucket: "250-499",
    });
    expect(meta).toEqual({
      source: "google_ads",
      device: "mobile",
      locale: "de",
      product_id: PRODUCT_ID,
      quantity: 2,
      cart_subtotal_bucket: "250-499",
    });
  });
});

describe("recordSiteFunnelEvent", () => {
  it("session bazlı site_visit dedupe edilir", async () => {
    const { admin, inserts } = createFakeAdmin();
    const payload = {
      eventName: "site_visit" as const,
      anonymousId: ANON_A,
      sessionId: ANON_B,
      source: null,
      device: null,
      locale: null,
    };
    const first = await recordSiteFunnelEvent({ payload, userId: null, admin });
    const second = await recordSiteFunnelEvent({ payload, userId: null, admin });
    expect(first.ok).toBe(true);
    expect(second.duplicate).toBe(true);
    expect(inserts).toHaveLength(1);
  });

  it("identity link duplicate NO-OP olur", async () => {
    const { admin } = createFakeAdmin();
    const ok = await linkVisitorIdentity({ anonymousId: ANON_A, userId: USER_X, admin });
    expect(ok.ok).toBe(true);
  });

  it("purchase test SKU ve user_id yoksa yazılmaz", async () => {
    const { admin, inserts } = createFakeAdmin();
    const test = await recordSitePurchase({
      userId: USER_X,
      orderId: "o1",
      value: 1,
      isPaymentTestOrder: true,
      admin,
    });
    const guest = await recordSitePurchase({
      userId: null,
      orderId: "o2",
      value: 500,
      isPaymentTestOrder: false,
      admin,
    });
    const real = await recordSitePurchase({
      userId: USER_X,
      orderId: "o3",
      value: 500,
      isPaymentTestOrder: false,
      admin,
    });
    expect(test.recorded).toBe(false);
    expect(guest.recorded).toBe(false);
    expect(real.recorded).toBe(true);
    expect(inserts).toHaveLength(1);
  });
});

describe("summarizeSiteFunnel", () => {
  it("anon → auth kimliği birleştirir, distinct ziyaretçi ve source/device breakdown üretir", () => {
    const summary = summarizeSiteFunnel({
      days: 30,
      siteRows: [
        { anonymous_id: ANON_A, session_id: "s-a", user_id: null, event_name: "site_visit", metadata: { source: "google_ads", device: "mobile" } },
        { anonymous_id: ANON_A, session_id: "s-a", user_id: null, event_name: "product_view", metadata: { source: "google_ads", device: "mobile" } },
        { anonymous_id: ANON_A, session_id: "s-a", user_id: null, event_name: "add_to_cart", metadata: { source: "google_ads", device: "mobile" } },
        { anonymous_id: ANON_A, session_id: "s-a", user_id: null, event_name: "register_view", metadata: { source: "google_ads", device: "mobile" } },
        { anonymous_id: ANON_B, session_id: "s-b", user_id: null, event_name: "site_visit", metadata: { source: "facebook", device: "desktop" } },
        { anonymous_id: ANON_B, session_id: "s-b", user_id: null, event_name: "product_view", metadata: { source: "facebook", device: "desktop" } },
      ],
      b2bRows: [
        { user_id: USER_X, event_name: "b2b_account_approved" },
        { user_id: USER_X, event_name: "approved_b2b_begin_checkout" },
        { user_id: USER_X, event_name: "approved_b2b_purchase" },
      ],
      identityLinks: [{ anonymous_id: ANON_B, user_id: USER_X }],
      acquisitions: [],
    });

    // ANON_B is merged into USER_X, so there are 2 distinct journeys.
    expect(summary.visitors).toBe(2);
    expect(summary.visit).toBe(2);
    expect(summary.productView).toBe(2);
    expect(summary.addToCart).toBe(1);
    expect(summary.registerLogin).toBe(1);
    expect(summary.approved).toBe(1);
    expect(summary.checkout).toBe(1);
    expect(summary.purchase).toBe(1);
    expect(summary.sessions).toBe(2);

    const google = summary.sources.find((s) => s.source === "google_ads")!;
    expect(google.visitor).toBe(1);
    expect(google.cart).toBe(1);
    // USER_X journey inherits the source from its linked anonymous events (facebook).
    const facebook = summary.sources.find((s) => s.source === "facebook")!;
    expect(facebook.approved).toBe(1);
    expect(facebook.purchase).toBe(1);

    const desktop = summary.devices.find((d) => d.device === "desktop")!;
    expect(desktop.purchase).toBe(1);
    const mobile = summary.devices.find((d) => d.device === "mobile")!;
    expect(mobile.view).toBe(1);
  });

  it("boş veri 0/0 üretir, NaN/Infinity çıkmaz", () => {
    const summary = summarizeSiteFunnel({
      days: 7,
      siteRows: [],
      b2bRows: [],
      identityLinks: [],
      acquisitions: [],
    });
    expect(summary.visitors).toBe(0);
    expect(summary.purchase).toBe(0);
    expect(getSiteFunnelInsights(summary)).toEqual(["waitingForData"]);
  });

  it("checkout var purchase yoksa deterministik insight verir", () => {
    const base: SiteFunnelSummary = {
      ok: true,
      days: 30,
      granularity: "day",
      visitors: 10,
      sessions: 12,
      visit: 10,
      productView: 8,
      addToCart: 4,
      cartView: 3,
      registerLogin: 2,
      application: 1,
      approved: 1,
      checkout: 1,
      purchase: 0,
      minOrderBlocked: 0,
      quickOrder: 0,
      previous: {
        visitors: 8,
        sessions: 9,
        visit: 8,
        productView: 6,
        addToCart: 3,
        cartView: 2,
        registerLogin: 1,
        application: 1,
        approved: 0,
        checkout: 0,
        purchase: 0,
        minOrderBlocked: 0,
        quickOrder: 0,
      },
      trend: [],
      sources: [],
      devices: [],
    };
    expect(getSiteFunnelInsights(base)).toContain("checkoutWithoutPurchase");
  });

  it("24s ziyaretçi trendinde saatlik bucket üretir", () => {
    const now = new Date("2026-08-15T12:30:00.000Z");
    const trend = summarizeSiteFunnelTrend({
      days: 1,
      now,
      identityLinks: [],
      siteRows: [
        {
          anonymous_id: ANON_A,
          session_id: "s1",
          user_id: null,
          event_name: "site_visit",
          metadata: null,
          created_at: "2026-08-15T10:20:00.000Z",
        },
        {
          anonymous_id: ANON_A,
          session_id: "s1",
          user_id: null,
          event_name: "product_view",
          metadata: null,
          created_at: "2026-08-15T10:25:00.000Z",
        },
        {
          anonymous_id: ANON_B,
          session_id: "s2",
          user_id: null,
          event_name: "add_to_cart",
          metadata: null,
          created_at: "2026-08-15T11:05:00.000Z",
        },
      ],
      b2bRows: [
        {
          user_id: USER_X,
          event_name: "approved_b2b_purchase",
          created_at: "2026-08-15T11:40:00.000Z",
        },
      ],
    });
    expect(trend).toHaveLength(24);
    const ten = trend.find((point) => point.date === "2026-08-15T10:00:00.000Z");
    const eleven = trend.find((point) => point.date === "2026-08-15T11:00:00.000Z");
    expect(ten?.visitors).toBe(1);
    expect(ten?.productView).toBe(1);
    expect(eleven?.addToCart).toBe(1);
    expect(eleven?.purchase).toBe(1);
  });
});

describe("bot exclusion", () => {
  it("bilinen crawler UA'larını doğrular, insan tarayıcıyı dışlamaz", () => {
    expect(isVerifiedBotUserAgent("Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)")).toBe(true);
    expect(isVerifiedBotUserAgent("Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)")).toBe(true);
    expect(isVerifiedBotUserAgent("facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)")).toBe(true);
    expect(isVerifiedBotUserAgent("meta-externalagent/1.1 (+https://developers.facebook.com/docs/sharing/webmasters/crawler)")).toBe(true);
    expect(
      isVerifiedBotUserAgent(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
      )
    ).toBe(false);
    expect(isVerifiedBotUserAgent("")).toBe(false);
    expect(isVerifiedBotUserAgent(null)).toBe(false);
  });

  it("önceki dönem 0 iken yüzde Infinity olmaz", () => {
    expect(periodDelta(3, 0).percent).toBeNull();
    expect(periodDelta(0, 0).percent).toBeNull();
  });
});

describe("visitor-id (no fingerprint)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function stubBrowser() {
    const store = new Map<string, string>();
    const storage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
    };
    vi.stubGlobal("window", {
      localStorage: storage,
      innerWidth: 1280,
      matchMedia: () => ({ matches: false }),
    });
    let counter = 0;
    vi.stubGlobal("crypto", {
      randomUUID: () => {
        counter += 1;
        return `dddddddd-4444-4444-8444-${String(counter).padStart(12, "0")}`;
      },
    });
    return store;
  }

  it("stabil visitor id ve rotasyonlu session id üretir", async () => {
    stubBrowser();
    const { getVisitorId, getSessionId, getDeviceCategory, SESSION_INACTIVITY_MS } = await import(
      "./visitor-id"
    );

    const id1 = getVisitorId();
    const id2 = getVisitorId();
    expect(id1).toBe(id2);
    expect(isFirstPartyId(id1!)).toBe(true);

    const now = 1_000_000_000_000;
    const s1 = getSessionId(now);
    const s2 = getSessionId(now + 60_000);
    expect(s1).toBe(s2);
    const s3 = getSessionId(now + 60_000 + SESSION_INACTIVITY_MS + 60_000);
    expect(s3).not.toBe(s2);

    expect(getDeviceCategory()).toBe("desktop");
  });
});
