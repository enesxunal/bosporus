import { COMPANY } from "@/lib/company";
import {
  findZoneInList,
  loadDeliveryZones,
  type DeliveryZoneData,
} from "@/lib/delivery-data";
import {
  getSettingsForSegment,
  loadDeliverySettings,
  quoteDelivery,
} from "@/lib/delivery-pricing";

export type DeliveryCheckStatus = "serviceable" | "out_of_range" | "uncertain";

export type PublicDeliveryCheck = {
  zipCode: string;
  status: DeliveryCheckStatus;
  serviceable: boolean;
  zoneNameDe: string | null;
  zoneNameTr: string | null;
  minOrderAmount: number;
  freeDeliveryThreshold: number | null;
  deliveryFeeEstimate: number | null;
  maxDistanceKm: number | null;
  distanceKm: number | null;
  withinRadius: boolean;
  pickupAvailable: true;
  pickupOpen: string;
  pickupClose: string;
  /** Always b2b_delivery — never expose b2c_delivery 100/250 */
  segment: "b2b_delivery";
};

const PLZ_RE = /^\d{5}$/;

export function normalizeGermanPlz(input: unknown): string {
  if (typeof input !== "string") return "";
  return input.replace(/\s/g, "").trim();
}

export function isValidGermanPlz(input: unknown): input is string {
  const zip = normalizeGermanPlz(input);
  return PLZ_RE.test(zip);
}

export function classifyDeliveryCheck(params: {
  distanceKm: number | null;
  withinRadius: boolean;
}): DeliveryCheckStatus {
  if (params.distanceKm == null) return "uncertain";
  if (!params.withinRadius) return "out_of_range";
  return "serviceable";
}

export function zoneNames(zone: DeliveryZoneData | null): {
  zoneNameDe: string | null;
  zoneNameTr: string | null;
} {
  if (!zone) return { zoneNameDe: null, zoneNameTr: null };
  return { zoneNameDe: zone.name_de, zoneNameTr: zone.name_tr };
}

/** Assert public payload never carries B2C demo thresholds. */
export function assertNoB2cPublicLeak(check: PublicDeliveryCheck): boolean {
  if (check.segment !== "b2b_delivery") return false;
  if (check.minOrderAmount === 100) return false;
  if (check.freeDeliveryThreshold === 250) return false;
  return true;
}

/**
 * Public PLZ check using B2B delivery rules only (source of truth: delivery_settings + quote + zones).
 * Does not use guest quote / b2c_delivery.
 */
export async function checkPublicB2bDelivery(zipRaw: string): Promise<
  | { ok: true; check: PublicDeliveryCheck }
  | { ok: false; error: "INVALID_PLZ" }
> {
  const zipCode = normalizeGermanPlz(zipRaw);
  if (!isValidGermanPlz(zipCode)) {
    return { ok: false, error: "INVALID_PLZ" };
  }

  const [zones, settings] = await Promise.all([
    loadDeliveryZones(),
    loadDeliverySettings(),
  ]);
  const b2b = getSettingsForSegment(settings, "b2b_delivery");
  const zone = findZoneInList(zones, zipCode);
  const names = zoneNames(zone);

  const quote = await quoteDelivery({
    orderType: "delivery",
    isB2b: true,
    subtotalGross: 0,
    zipCode,
    firstOrderFree: false,
  });

  const status = classifyDeliveryCheck({
    distanceKm: quote.distanceKm,
    withinRadius: quote.withinRadius,
  });

  const check: PublicDeliveryCheck = {
    zipCode,
    status,
    serviceable: status === "serviceable",
    zoneNameDe: names.zoneNameDe,
    zoneNameTr: names.zoneNameTr,
    minOrderAmount: b2b.min_order_amount,
    freeDeliveryThreshold: b2b.free_delivery_threshold,
    deliveryFeeEstimate:
      status === "serviceable" ? quote.deliveryFee : null,
    maxDistanceKm: b2b.max_distance_km,
    distanceKm: quote.distanceKm,
    withinRadius: quote.withinRadius,
    pickupAvailable: true,
    pickupOpen: COMPANY.openingHours.open,
    pickupClose: COMPANY.openingHours.close,
    segment: "b2b_delivery",
  };

  return { ok: true, check };
}
