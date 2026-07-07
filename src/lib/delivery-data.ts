import type { Locale } from "./types";
import { createAdminClient } from "./supabase/admin";
import { DELIVERY_ZONES as FALLBACK_ZONES, generatePickupSlots } from "./delivery";

export interface DeliveryZoneData {
  id: string;
  name_de: string;
  name_tr: string;
  zip_prefixes: string[];
  min_order_amount: number;
  delivery_days: number[];
}

export interface PickupSlotData {
  id: string;
  weekday: number;
  label: string;
  value: string;
  start_time: string;
}

let zonesCache: DeliveryZoneData[] | null = null;
let slotsCache: PickupSlotData[] | null = null;
let cacheTime = 0;
const CACHE_MS = 300_000;

function formatSlotLabel(start: string, end: string): string {
  return `${start.slice(0, 5)} – ${end.slice(0, 5)}`;
}

export async function loadDeliveryZones(): Promise<DeliveryZoneData[]> {
  const now = Date.now();
  if (zonesCache && now - cacheTime < CACHE_MS) return zonesCache;

  const admin = createAdminClient();
  if (admin) {
    const { data } = await admin.from("delivery_zones").select("*").order("sort_order");
    if (data && data.length > 0) {
      zonesCache = data.map((z) => ({
        id: z.id as string,
        name_de: z.name_de as string,
        name_tr: (z.name_tr as string) ?? z.name_de,
        zip_prefixes: z.zip_prefixes as string[],
        min_order_amount: Number(z.min_order_amount),
        delivery_days: (z.delivery_days as number[]) ?? [1, 2, 3, 4, 5, 6],
      }));
      cacheTime = now;
      return zonesCache;
    }
  }

  zonesCache = FALLBACK_ZONES.map((z) => ({
    id: z.id,
    name_de: z.name_de,
    name_tr: z.name_tr,
    zip_prefixes: [...z.zip_prefixes],
    min_order_amount: z.min_order_amount,
    delivery_days: [...z.delivery_days],
  }));
  return zonesCache;
}

export async function loadPickupSlots(): Promise<PickupSlotData[]> {
  const now = Date.now();
  if (slotsCache && now - cacheTime < CACHE_MS) return slotsCache;

  const admin = createAdminClient();
  if (admin) {
    const { data } = await admin
      .from("pickup_slots")
      .select("id, weekday, start_time, end_time")
      .eq("is_active", true)
      .order("weekday")
      .order("start_time");

    if (data && data.length > 0) {
      slotsCache = data.map((s) => {
        const start = String(s.start_time);
        const end = String(s.end_time);
        const label = formatSlotLabel(start, end);
        return {
          id: s.id as string,
          weekday: s.weekday as number,
          label,
          value: label,
          start_time: start,
        };
      });
      cacheTime = now;
      return slotsCache;
    }
  }

  const generated = generatePickupSlots();
  slotsCache = generated.flatMap((s, i) =>
    [1, 2, 3, 4, 5, 6].map((weekday) => ({
      id: `fallback-${weekday}-${i}`,
      weekday,
      label: s.label,
      value: s.label,
      start_time: s.value,
    }))
  );
  return slotsCache;
}

export function findZoneInList(zones: DeliveryZoneData[], zip: string): DeliveryZoneData | null {
  const cleaned = zip.replace(/\s/g, "");
  for (const zone of zones) {
    for (const prefix of zone.zip_prefixes) {
      if (cleaned.startsWith(prefix)) return zone;
    }
  }
  return null;
}

export function zoneDisplayName(zone: DeliveryZoneData, locale: Locale): string {
  return locale === "tr" ? zone.name_tr : zone.name_de;
}

export function getWeekdayFromDate(dateStr: string): number {
  return new Date(dateStr + "T12:00:00").getDay();
}

export function isPickupDateAllowed(dateStr: string): boolean {
  const wd = getWeekdayFromDate(dateStr);
  return wd >= 1 && wd <= 6;
}

export function isDeliveryDayAllowed(zone: DeliveryZoneData, dateStr: string): boolean {
  const wd = getWeekdayFromDate(dateStr);
  if (wd === 0) return false;
  return zone.delivery_days.includes(wd);
}

export function getPickupSlotsForDate(slots: PickupSlotData[], dateStr: string): PickupSlotData[] {
  const wd = getWeekdayFromDate(dateStr);
  if (wd < 1 || wd > 6) return [];
  return slots.filter((s) => s.weekday === wd);
}

export function formatDeliveryDays(zone: DeliveryZoneData, locale: Locale): string {
  const names =
    locale === "tr"
      ? ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"]
      : ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
  return zone.delivery_days.map((d) => names[d] ?? String(d)).join(", ");
}

import { clearDeliveryPricingCache } from "./delivery-pricing";

export function clearDeliveryCache() {
  zonesCache = null;
  slotsCache = null;
  clearDeliveryPricingCache();
}
