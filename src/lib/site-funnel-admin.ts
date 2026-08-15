import { createAdminClient } from "./supabase/admin";
import { ACQUISITION_SOURCES, type AcquisitionSource } from "./acquisition";
import {
  DEVICE_CATEGORIES,
  isAcquisitionSource,
  isDeviceCategory,
  type SiteFunnelEventName,
} from "./site-funnel-shared";
import type {
  DeviceBucket,
  SiteFunnelDeviceRow,
  SiteFunnelSourceRow,
  SiteFunnelSummary,
} from "./site-funnel-dashboard";

export interface SiteEventRow {
  anonymous_id: string | null;
  session_id: string | null;
  user_id: string | null;
  event_name: SiteFunnelEventName;
  metadata: Record<string, unknown> | null;
}

export interface B2bTailRow {
  user_id: string | null;
  event_name: "b2b_account_approved" | "approved_b2b_begin_checkout" | "approved_b2b_purchase";
}

export interface IdentityLinkRow {
  anonymous_id: string;
  user_id: string;
}

export interface AcquisitionSourceRow {
  user_id: string;
  source: AcquisitionSource;
}

const DEVICE_BUCKETS: readonly DeviceBucket[] = [...DEVICE_CATEGORIES, "unknown"];

type StageKey =
  | "visit"
  | "productView"
  | "addToCart"
  | "cartView"
  | "registerLogin"
  | "application"
  | "approved"
  | "checkout"
  | "purchase";

const SITE_EVENT_TO_STAGE: Partial<Record<SiteFunnelEventName, StageKey>> = {
  site_visit: "visit",
  product_view: "productView",
  add_to_cart: "addToCart",
  cart_view: "cartView",
  register_view: "registerLogin",
  login_view: "registerLogin",
  registration_started: "registerLogin",
  registration_completed: "registerLogin",
  b2b_application_submitted: "application",
};

/**
 * Unify anonymous journeys with authenticated users and compute distinct-journey
 * counts for every visitor-funnel stage, plus source and device breakdowns.
 * Pure and deterministic so it can be unit-tested without a database.
 */
export function summarizeSiteFunnel(params: {
  siteRows: SiteEventRow[];
  b2bRows: B2bTailRow[];
  identityLinks: IdentityLinkRow[];
  acquisitions: AcquisitionSourceRow[];
  days: 7 | 30 | 90;
}): SiteFunnelSummary {
  const anonToUser = new Map(params.identityLinks.map((l) => [l.anonymous_id, l.user_id]));
  const acquisitionByUser = new Map(params.acquisitions.map((a) => [a.user_id, a.source]));

  const journeyKey = (userId: string | null, anonId: string | null): string | null => {
    if (userId) return userId;
    if (anonId) return anonToUser.get(anonId) ?? anonId;
    return null;
  };

  const stages: Record<StageKey, Set<string>> = {
    visit: new Set(),
    productView: new Set(),
    addToCart: new Set(),
    cartView: new Set(),
    registerLogin: new Set(),
    application: new Set(),
    approved: new Set(),
    checkout: new Set(),
    purchase: new Set(),
  };
  const minOrderBlocked = new Set<string>();
  const quickOrder = new Set<string>();
  const sessions = new Set<string>();
  const allJourneys = new Set<string>();
  const sourceByJourney = new Map<string, AcquisitionSource>();
  const deviceByJourney = new Map<string, DeviceBucket>();

  for (const row of params.siteRows) {
    const key = journeyKey(row.user_id, row.anonymous_id);
    if (!key) continue;
    allJourneys.add(key);
    if (row.session_id) sessions.add(row.session_id);

    const metaSource = row.metadata?.source;
    if (isAcquisitionSource(metaSource) && metaSource !== "unknown" && !sourceByJourney.has(key)) {
      sourceByJourney.set(key, metaSource);
    }
    const metaDevice = row.metadata?.device;
    if (isDeviceCategory(metaDevice) && !deviceByJourney.has(key)) {
      deviceByJourney.set(key, metaDevice);
    }

    const stage = SITE_EVENT_TO_STAGE[row.event_name];
    if (stage) stages[stage].add(key);
    if (row.event_name === "min_order_blocked") minOrderBlocked.add(key);
    if (row.event_name === "quick_order_used") quickOrder.add(key);
  }

  const tailStageByEvent: Record<B2bTailRow["event_name"], StageKey> = {
    b2b_account_approved: "approved",
    approved_b2b_begin_checkout: "checkout",
    approved_b2b_purchase: "purchase",
  };
  for (const row of params.b2bRows) {
    if (!row.user_id) continue;
    allJourneys.add(row.user_id);
    stages[tailStageByEvent[row.event_name]].add(row.user_id);
  }

  const sourceOf = (key: string): AcquisitionSource =>
    sourceByJourney.get(key) ?? acquisitionByUser.get(key) ?? "unknown";
  const deviceOf = (key: string): DeviceBucket => deviceByJourney.get(key) ?? "unknown";

  const sourceCounters = new Map<AcquisitionSource, SiteFunnelSourceRow>(
    ACQUISITION_SOURCES.map((source) => [
      source,
      {
        source,
        visitor: 0,
        view: 0,
        cart: 0,
        register: 0,
        application: 0,
        approved: 0,
        checkout: 0,
        purchase: 0,
      },
    ])
  );
  const deviceCounters = new Map<DeviceBucket, SiteFunnelDeviceRow>(
    DEVICE_BUCKETS.map((device) => [
      device,
      { device, view: 0, cart: 0, register: 0, checkout: 0, purchase: 0 },
    ])
  );

  const bumpSource = (
    stage: Set<string>,
    column: keyof Omit<SiteFunnelSourceRow, "source">
  ) => {
    for (const key of stage) sourceCounters.get(sourceOf(key))![column] += 1;
  };
  bumpSource(stages.visit, "visitor");
  bumpSource(stages.productView, "view");
  bumpSource(stages.addToCart, "cart");
  bumpSource(stages.registerLogin, "register");
  bumpSource(stages.application, "application");
  bumpSource(stages.approved, "approved");
  bumpSource(stages.checkout, "checkout");
  bumpSource(stages.purchase, "purchase");

  const bumpDevice = (
    stage: Set<string>,
    column: keyof Omit<SiteFunnelDeviceRow, "device">
  ) => {
    for (const key of stage) deviceCounters.get(deviceOf(key))![column] += 1;
  };
  bumpDevice(stages.productView, "view");
  bumpDevice(stages.cartView, "cart");
  bumpDevice(stages.registerLogin, "register");
  bumpDevice(stages.checkout, "checkout");
  bumpDevice(stages.purchase, "purchase");

  return {
    ok: true,
    days: params.days,
    visitors: allJourneys.size,
    sessions: sessions.size,
    visit: stages.visit.size,
    productView: stages.productView.size,
    addToCart: stages.addToCart.size,
    cartView: stages.cartView.size,
    registerLogin: stages.registerLogin.size,
    application: stages.application.size,
    approved: stages.approved.size,
    checkout: stages.checkout.size,
    purchase: stages.purchase.size,
    minOrderBlocked: minOrderBlocked.size,
    quickOrder: quickOrder.size,
    sources: ACQUISITION_SOURCES.map((source) => sourceCounters.get(source)!),
    devices: DEVICE_BUCKETS.map((device) => deviceCounters.get(device)!),
  };
}

const SITE_EVENT_NAMES = Object.keys(SITE_EVENT_TO_STAGE).concat([
  "min_order_blocked",
  "quick_order_used",
]);
const B2B_TAIL_EVENTS = [
  "b2b_account_approved",
  "approved_b2b_begin_checkout",
  "approved_b2b_purchase",
] as const;

export async function getSiteFunnelSummary(
  days: 7 | 30 | 90
): Promise<SiteFunnelSummary | { ok: false; error: string }> {
  const admin = createAdminClient();
  if (!admin) return { ok: false, error: "SUPABASE_NOT_CONFIGURED" };

  const since = new Date(Date.now() - days * 86_400_000).toISOString();
  const pageSize = 1000;

  const siteRows: SiteEventRow[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await admin
      .from("site_funnel_events")
      .select("anonymous_id, session_id, user_id, event_name, metadata")
      .in("event_name", SITE_EVENT_NAMES)
      .gte("created_at", since)
      .range(from, from + pageSize - 1);

    if (error) {
      if (error.code === "42P01" || error.code === "PGRST205") break;
      return { ok: false, error: error.message };
    }
    const page = (data ?? []) as SiteEventRow[];
    siteRows.push(...page);
    if (page.length < pageSize) break;
  }

  const b2bRows: B2bTailRow[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await admin
      .from("b2b_funnel_events")
      .select("user_id, event_name")
      .in("event_name", [...B2B_TAIL_EVENTS])
      .gte("created_at", since)
      .range(from, from + pageSize - 1);

    if (error) return { ok: false, error: error.message };
    const page = (data ?? []) as B2bTailRow[];
    b2bRows.push(...page);
    if (page.length < pageSize) break;
  }

  const userIds = Array.from(
    new Set([
      ...siteRows.flatMap((r) => (r.user_id ? [r.user_id] : [])),
      ...b2bRows.flatMap((r) => (r.user_id ? [r.user_id] : [])),
    ])
  );
  const anonIds = Array.from(
    new Set(siteRows.flatMap((r) => (r.anonymous_id ? [r.anonymous_id] : [])))
  );

  const identityLinks: IdentityLinkRow[] = [];
  const batchSize = 200;
  for (let i = 0; i < anonIds.length; i += batchSize) {
    const batch = anonIds.slice(i, i + batchSize);
    const { data, error } = await admin
      .from("visitor_identity_links")
      .select("anonymous_id, user_id")
      .in("anonymous_id", batch);
    if (error) {
      if (error.code === "42P01" || error.code === "PGRST205") break;
      return { ok: false, error: error.message };
    }
    identityLinks.push(...((data ?? []) as IdentityLinkRow[]));
  }

  const acquisitions: AcquisitionSourceRow[] = [];
  for (let i = 0; i < userIds.length; i += batchSize) {
    const batch = userIds.slice(i, i + batchSize);
    const { data, error } = await admin
      .from("user_acquisition")
      .select("user_id, source")
      .in("user_id", batch);
    if (error) {
      if (error.code === "42P01" || error.code === "PGRST205") break;
      return { ok: false, error: error.message };
    }
    acquisitions.push(...((data ?? []) as AcquisitionSourceRow[]));
  }

  return summarizeSiteFunnel({ siteRows, b2bRows, identityLinks, acquisitions, days });
}
