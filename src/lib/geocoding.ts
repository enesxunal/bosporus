import { COMPANY } from "./company";

const geoCache = new Map<string, { lat: number; lng: number; at: number }>();
const CACHE_MS = 60 * 60 * 1000;

/** Depo koordinatları — Von-Hünefeld-Str. 2, 50829 Köln */
export const DEPOT_COORDS = {
  lat: 50.9647,
  lng: 6.8792,
};

function cacheKey(zipCode: string, address?: string): string {
  return `${zipCode.trim()}|${(address ?? "").trim().toLowerCase()}`;
}

export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function nominatimSearch(query: string): Promise<{ lat: number; lng: number } | null> {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");
  url.searchParams.set("countrycodes", "de");

  const res = await fetch(url.toString(), {
    headers: { "User-Agent": "Bosporus-Shop/1.0 (info@bosporus-gmbh.com)" },
    next: { revalidate: 3600 },
  });

  if (!res.ok) return null;

  const data = (await res.json()) as { lat: string; lon: string }[];
  const hit = data[0];
  if (!hit) return null;

  return { lat: Number(hit.lat), lng: Number(hit.lon) };
}

export async function resolveCustomerCoords(
  zipCode: string,
  address?: string
): Promise<{ lat: number; lng: number } | null> {
  const zip = zipCode.replace(/\s/g, "").trim();
  if (!zip) return null;

  const key = cacheKey(zip, address);
  const cached = geoCache.get(key);
  if (cached && Date.now() - cached.at < CACHE_MS) {
    return { lat: cached.lat, lng: cached.lng };
  }

  const queries = [
    address?.trim() ? `${address.trim()}, ${zip} ${COMPANY.city}, Germany` : null,
    `${zip} ${COMPANY.city}, Germany`,
    `${zip}, Germany`,
  ].filter(Boolean) as string[];

  for (const query of queries) {
    const coords = await nominatimSearch(query);
    if (coords) {
      geoCache.set(key, { ...coords, at: Date.now() });
      return coords;
    }
  }

  return null;
}

export async function distanceFromDepotKm(
  zipCode: string,
  address?: string,
  depot = DEPOT_COORDS
): Promise<number | null> {
  const coords = await resolveCustomerCoords(zipCode, address);
  if (!coords) return null;
  const km = haversineKm(depot.lat, depot.lng, coords.lat, coords.lng);
  return Math.round(km * 10) / 10;
}
