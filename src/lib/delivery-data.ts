import type { Locale } from "./types";
import { createAdminClient } from "./supabase/admin";
import { DELIVERY_ZONES as FALLBACK_ZONES, generatePickupSlots } from "./delivery";
import { clearDeliveryPricingCache } from "./delivery-pricing";

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

/** İlk etap: her gün 17:00–20:00 teslimat penceresi */
export const DELIVERY_WINDOW_LABEL = "17:00 – 20:00";
/** Avrupa/Berlin — bu saatten önce verilen sipariş aynı gün teslim edilebilir */
export const SAME_DAY_ORDER_CUTOFF_HOUR = 12;
/** Gel-al: slot başlangıcına en az bu kadar dakika kala seçilebilir */
export const PICKUP_LEAD_MINUTES = 60;

let zonesCache: DeliveryZoneData[] | null = null;
let slotsCache: PickupSlotData[] | null = null;
let cacheTime = 0;
const CACHE_MS = 300_000;

function formatSlotLabel(start: string, end: string): string {
  return `${start.slice(0, 5)} – ${end.slice(0, 5)}`;
}

export function getBerlinDateParts(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "0";
  const year = get("year");
  const month = get("month");
  const day = get("day");
  return {
    year: Number(year),
    month: Number(month),
    day: Number(day),
    hour: Number(get("hour")),
    minute: Number(get("minute")),
    iso: `${year}-${month}-${day}`,
  };
}

/** En erken teslimat günü (12:00 öncesi → bugün, sonrası → yarın) */
export function getEarliestDeliveryDateISO(now = new Date()): string {
  const b = getBerlinDateParts(now);
  if (b.hour < SAME_DAY_ORDER_CUTOFF_HOUR) return b.iso;
  const d = new Date(Date.UTC(b.year, b.month - 1, b.day));
  d.setUTCDate(d.getUTCDate() + 1);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function formatDeliveryWindowHint(locale: Locale, now = new Date()): string {
  const earliest = getEarliestDeliveryDateISO(now);
  const today = getBerlinDateParts(now).iso;
  if (locale === "tr") {
    if (earliest === today) {
      return `Teslimat her gün ${DELIVERY_WINDOW_LABEL}. Saat 12:00’ye kadar sipariş → aynı gün.`;
    }
    return `Teslimat her gün ${DELIVERY_WINDOW_LABEL}. Aynı gün için sipariş saat 12:00’ye kadar verilmeli (şu an yarın ve sonrası).`;
  }
  if (earliest === today) {
    return `Lieferung täglich ${DELIVERY_WINDOW_LABEL}. Bestellung bis 12:00 → noch heute.`;
  }
  return `Lieferung täglich ${DELIVERY_WINDOW_LABEL}. Same-Day nur bis 12:00 bestellbar (aktuell ab morgen).`;
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
        delivery_days: (z.delivery_days as number[]) ?? [0, 1, 2, 3, 4, 5, 6],
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

/**
 * İlk etap: her gün teslimat (17–20).
 * Aynı gün sadece Köln saati 12:00’den önce seçilebilir.
 */
export function isDeliveryDayAllowed(_zone: DeliveryZoneData, dateStr: string, now = new Date()): boolean {
  return dateStr >= getEarliestDeliveryDateISO(now);
}

/** Sonraki uygun teslimat günlerini ISO (YYYY-MM-DD) listesi olarak döner. */
export function getNextDeliveryDates(
  _zone: DeliveryZoneData,
  count = 4,
  fromDate = new Date()
): string[] {
  const out: string[] = [];
  const earliest = getEarliestDeliveryDateISO(fromDate);
  const [y0, m0, d0] = earliest.split("-").map(Number);
  const d = new Date(y0!, m0! - 1, d0!, 12, 0, 0, 0);
  for (let i = 0; i < 60 && out.length < count; i++) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    out.push(`${y}-${m}-${day}`);
    d.setDate(d.getDate() + 1);
  }
  return out;
}

export function formatDisplayDate(iso: string, locale: Locale): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  const date = new Date(y, m - 1, d, 12);
  return date.toLocaleDateString(locale === "tr" ? "tr-TR" : "de-DE", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  });
}

export function getPickupSlotsForDate(slots: PickupSlotData[], dateStr: string): PickupSlotData[] {
  const wd = getWeekdayFromDate(dateStr);
  if (wd < 1 || wd > 6) return [];
  return slots.filter((s) => s.weekday === wd);
}

/** Slot başlangıcı, şu andan leadMinutes sonra mı? (bugün için filtre) */
export function isPickupSlotAvailable(
  dateStr: string,
  startTime: string,
  now = new Date(),
  leadMinutes = PICKUP_LEAD_MINUTES
): boolean {
  const berlin = getBerlinDateParts(now);
  if (dateStr < berlin.iso) return false;
  if (dateStr > berlin.iso) return true;
  const hhmm = startTime.slice(0, 5);
  const [hh, mm] = hhmm.split(":").map(Number);
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return false;
  const slotMinutes = hh! * 60 + mm!;
  const nowMinutes = berlin.hour * 60 + berlin.minute;
  return slotMinutes >= nowMinutes + leadMinutes;
}

export function getAvailablePickupSlotsForDate(
  slots: PickupSlotData[],
  dateStr: string,
  now = new Date()
): PickupSlotData[] {
  return getPickupSlotsForDate(slots, dateStr).filter((s) =>
    isPickupSlotAvailable(dateStr, s.start_time, now)
  );
}

export function formatDeliveryDays(_zone: DeliveryZoneData, locale: Locale): string {
  return locale === "tr"
    ? `Her gün ${DELIVERY_WINDOW_LABEL}`
    : `Täglich ${DELIVERY_WINDOW_LABEL}`;
}

export function clearDeliveryCache() {
  zonesCache = null;
  slotsCache = null;
  clearDeliveryPricingCache();
}
