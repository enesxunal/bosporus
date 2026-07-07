import { createAdminClient } from "./supabase/admin";
import { DEPOT_COORDS, distanceFromDepotKm } from "./geocoding";

export type DeliverySegment =
  | "b2c_delivery"
  | "b2b_delivery"
  | "b2c_pickup"
  | "b2b_pickup";

export interface DeliverySettingsRow {
  segment: DeliverySegment;
  min_order_amount: number;
  free_delivery_threshold: number | null;
  max_distance_km: number | null;
  depot_lat: number;
  depot_lng: number;
}

export interface FeeBandRow {
  max_km: number;
  fee_amount: number;
  sort_order: number;
}

const DEFAULT_SETTINGS: DeliverySettingsRow[] = [
  { segment: "b2c_delivery", min_order_amount: 100, free_delivery_threshold: 250, max_distance_km: 40, depot_lat: DEPOT_COORDS.lat, depot_lng: DEPOT_COORDS.lng },
  { segment: "b2b_delivery", min_order_amount: 1000, free_delivery_threshold: 2500, max_distance_km: 50, depot_lat: DEPOT_COORDS.lat, depot_lng: DEPOT_COORDS.lng },
  { segment: "b2c_pickup", min_order_amount: 50, free_delivery_threshold: null, max_distance_km: null, depot_lat: DEPOT_COORDS.lat, depot_lng: DEPOT_COORDS.lng },
  { segment: "b2b_pickup", min_order_amount: 500, free_delivery_threshold: null, max_distance_km: null, depot_lat: DEPOT_COORDS.lat, depot_lng: DEPOT_COORDS.lng },
];

const DEFAULT_BANDS: Record<string, FeeBandRow[]> = {
  b2c_delivery: [
    { max_km: 10, fee_amount: 20, sort_order: 1 },
    { max_km: 20, fee_amount: 30, sort_order: 2 },
    { max_km: 30, fee_amount: 40, sort_order: 3 },
    { max_km: 40, fee_amount: 50, sort_order: 4 },
  ],
  b2b_delivery: [
    { max_km: 10, fee_amount: 20, sort_order: 1 },
    { max_km: 20, fee_amount: 30, sort_order: 2 },
    { max_km: 30, fee_amount: 40, sort_order: 3 },
    { max_km: 40, fee_amount: 50, sort_order: 4 },
    { max_km: 50, fee_amount: 60, sort_order: 5 },
  ],
};

let settingsCache: DeliverySettingsRow[] | null = null;
let bandsCache: Record<string, FeeBandRow[]> | null = null;
let cacheAt = 0;
const CACHE_MS = 300_000;

export function deliverySegment(isB2b: boolean, orderType: "delivery" | "click_collect"): DeliverySegment {
  if (orderType === "click_collect") return isB2b ? "b2b_pickup" : "b2c_pickup";
  return isB2b ? "b2b_delivery" : "b2c_delivery";
}

export async function loadDeliverySettings(): Promise<DeliverySettingsRow[]> {
  const now = Date.now();
  if (settingsCache && now - cacheAt < CACHE_MS) return settingsCache;

  const admin = createAdminClient();
  if (admin) {
    const { data } = await admin.from("delivery_settings").select("*");
    if (data?.length) {
      settingsCache = data.map((r) => ({
        segment: r.segment as DeliverySegment,
        min_order_amount: Number(r.min_order_amount),
        free_delivery_threshold: r.free_delivery_threshold != null ? Number(r.free_delivery_threshold) : null,
        max_distance_km: r.max_distance_km != null ? Number(r.max_distance_km) : null,
        depot_lat: Number(r.depot_lat ?? DEPOT_COORDS.lat),
        depot_lng: Number(r.depot_lng ?? DEPOT_COORDS.lng),
      }));
      cacheAt = now;
      return settingsCache;
    }
  }

  settingsCache = DEFAULT_SETTINGS;
  cacheAt = now;
  return settingsCache;
}

export async function loadFeeBands(segment: DeliverySegment): Promise<FeeBandRow[]> {
  const now = Date.now();
  if (bandsCache && now - cacheAt < CACHE_MS && bandsCache[segment]) {
    return bandsCache[segment];
  }

  const admin = createAdminClient();
  if (admin) {
    const { data } = await admin
      .from("delivery_fee_bands")
      .select("max_km, fee_amount, sort_order")
      .eq("segment", segment)
      .order("sort_order");

    if (data?.length) {
      if (!bandsCache) bandsCache = {};
      bandsCache[segment] = data.map((b) => ({
        max_km: Number(b.max_km),
        fee_amount: Number(b.fee_amount),
        sort_order: Number(b.sort_order),
      }));
      cacheAt = now;
      return bandsCache[segment];
    }
  }

  if (!bandsCache) bandsCache = {};
  bandsCache[segment] = DEFAULT_BANDS[segment] ?? [];
  return bandsCache[segment];
}

export function getSettingsForSegment(
  settings: DeliverySettingsRow[],
  segment: DeliverySegment
): DeliverySettingsRow {
  return settings.find((s) => s.segment === segment) ?? DEFAULT_SETTINGS.find((s) => s.segment === segment)!;
}

export function feeForDistanceKm(distanceKm: number, bands: FeeBandRow[]): number | null {
  const sorted = [...bands].sort((a, b) => a.max_km - b.max_km);
  for (const band of sorted) {
    if (distanceKm <= band.max_km) return band.fee_amount;
  }
  return null;
}

export interface DeliveryQuote {
  segment: DeliverySegment;
  subtotalGross: number;
  minOrderAmount: number;
  freeDeliveryThreshold: number | null;
  maxDistanceKm: number | null;
  distanceKm: number | null;
  deliveryFee: number;
  totalGross: number;
  minOrderMet: boolean;
  withinRadius: boolean;
  freeDelivery: boolean;
}

export async function quoteDelivery(params: {
  orderType: "delivery" | "click_collect";
  isB2b: boolean;
  subtotalGross: number;
  zipCode?: string;
  address?: string;
}): Promise<DeliveryQuote> {
  const segment = deliverySegment(params.isB2b, params.orderType);
  const settings = await loadDeliverySettings();
  const cfg = getSettingsForSegment(settings, segment);

  const minOrderMet = params.subtotalGross >= cfg.min_order_amount;
  let distanceKm: number | null = null;
  let deliveryFee = 0;
  let withinRadius = true;
  let freeDelivery = false;

  if (params.orderType === "delivery") {
    distanceKm = await distanceFromDepotKm(
      params.zipCode ?? "",
      params.address,
      { lat: cfg.depot_lat, lng: cfg.depot_lng }
    );

    if (distanceKm == null) {
      withinRadius = false;
    } else if (cfg.max_distance_km != null && distanceKm > cfg.max_distance_km) {
      withinRadius = false;
    } else {
      freeDelivery =
        cfg.free_delivery_threshold != null && params.subtotalGross >= cfg.free_delivery_threshold;

      if (!freeDelivery && distanceKm != null) {
        const bands = await loadFeeBands(segment);
        const fee = feeForDistanceKm(distanceKm, bands);
        if (fee == null) withinRadius = false;
        else deliveryFee = fee;
      }
    }
  }

  const totalGross = Math.round((params.subtotalGross + deliveryFee) * 100) / 100;

  return {
    segment,
    subtotalGross: params.subtotalGross,
    minOrderAmount: cfg.min_order_amount,
    freeDeliveryThreshold: cfg.free_delivery_threshold,
    maxDistanceKm: cfg.max_distance_km,
    distanceKm,
    deliveryFee,
    totalGross,
    minOrderMet,
    withinRadius,
    freeDelivery,
  };
}

export function clearDeliveryPricingCache() {
  settingsCache = null;
  bandsCache = null;
  cacheAt = 0;
}
