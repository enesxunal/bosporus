const STORAGE_KEY = "bosporus_recent_products";
const MAX = 10;

export function trackRecentProduct(sku: string): void {
  if (typeof window === "undefined") return;
  try {
    const list = getRecentProductSkus();
    const next = [sku, ...list.filter((s) => s !== sku)].slice(0, MAX);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

export function getRecentProductSkus(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}
