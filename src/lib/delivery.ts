import type { Locale } from "@/lib/types";
import { COMPANY } from "@/lib/company";

export const DELIVERY_ZONES = [
  {
    id: "zone-1",
    name_de: "Köln Zentrum",
    name_tr: "Köln Merkez",
    zip_prefixes: ["50667", "50668", "50670", "50672", "50674", "50676", "50677", "50678", "50679", "50733", "50735", "50737", "50739"],
    min_order_amount: 150,
    delivery_days: [0, 1, 2, 3, 4, 5, 6],
  },
  {
    id: "zone-2",
    name_de: "Köln Umland",
    name_tr: "Köln Çevresi",
    zip_prefixes: ["50", "51"],
    min_order_amount: 300,
    delivery_days: [0, 1, 2, 3, 4, 5, 6],
  },
  {
    id: "zone-3",
    name_de: "NRW Weit",
    name_tr: "Geniş NRW",
    zip_prefixes: ["52", "53", "54", "55", "56", "57", "58", "59"],
    min_order_amount: 500,
    delivery_days: [0, 1, 2, 3, 4, 5, 6],
  },
] as const;

export function findDeliveryZone(zip: string) {
  const cleaned = zip.replace(/\s/g, "");
  for (const zone of DELIVERY_ZONES) {
    for (const prefix of zone.zip_prefixes) {
      if (cleaned.startsWith(prefix)) return zone;
    }
  }
  return null;
}

/** 30-minute pickup slots — saat aralığı COMPANY.openingHours tek kaynağından */
export function generatePickupSlots(): { label: string; value: string }[] {
  const openH = Number.parseInt(COMPANY.openingHours.open.slice(0, 2), 10);
  const closeH = Number.parseInt(COMPANY.openingHours.close.slice(0, 2), 10);
  const startHour = Number.isFinite(openH) ? openH : 8;
  const endHour = Number.isFinite(closeH) ? closeH : 18;

  const slots: { label: string; value: string }[] = [];
  for (let h = startHour; h < endHour; h++) {
    for (const m of [0, 30]) {
      const start = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      const endH = m === 30 ? h + 1 : h;
      const endM = m === 30 ? 0 : 30;
      const end = `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
      slots.push({ label: `${start} – ${end}`, value: start });
    }
  }
  return slots;
}

export const PICKUP_SLOTS = generatePickupSlots();

export function zoneName(zone: (typeof DELIVERY_ZONES)[number], locale: Locale) {
  return locale === "tr" ? zone.name_tr : zone.name_de;
}
