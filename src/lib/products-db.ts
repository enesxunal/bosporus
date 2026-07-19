import type { Product, Category } from "./types";
import productsData from "@/data/products.json";
import categoriesData from "@/data/categories.json";
import { createAdminClient } from "./supabase/admin";
import { parseImageUrls } from "./product-images";
import { enrichProductsWithPfand } from "./pfand";

const jsonProducts = productsData as Product[];
const jsonCategories = categoriesData as Category[];

export function mapDbRow(row: Record<string, unknown>): Product {
  const imageUrls = parseImageUrls(row.image_urls);
  return {
    id: row.id as string,
    sku: row.sku as string,
    barcode: (row.barcode as string) ?? null,
    name_de: row.name_de as string,
    name_tr: (row.name_tr as string) ?? null,
    category_slug: (row.category_slug as string) ?? null,
    image_url: (row.image_url as string) ?? imageUrls[0] ?? null,
    image_urls: imageUrls,
    description_de: (row.description_de as string) ?? null,
    description_tr: (row.description_tr as string) ?? null,
    base_unit: row.base_unit as Product["base_unit"],
    tax_rate: Number(row.tax_rate),
    price_b2c: Number(row.price_b2c),
    price_b2b: Number(row.price_b2b),
    promo_price: row.promo_price != null ? Number(row.promo_price) : null,
    promo_from: (row.promo_from as string) ?? null,
    promo_to: (row.promo_to as string) ?? null,
    is_active: Boolean(row.is_active),
    stock_status: (row.stock_status as string) ?? "in_stock",
    pfand_sku: (row.pfand_sku as string) ?? null,
    pfand: null,
  };
}

let dbCache: Product[] | null = null;
let dbCacheTime = 0;
const CACHE_MS = 5 * 60_000;
const NAV_CACHE_MS = 120_000;
let shopNavCache: { categories: Category[]; hasPromos: boolean; at: number } | null = null;

const LIST_COLS = "*";

export async function loadProductsFromDb(): Promise<Product[] | null> {
  const now = Date.now();
  if (dbCache && now - dbCacheTime < CACHE_MS) return dbCache;

  const admin = createAdminClient();
  if (!admin) return null;

  const { count } = await admin.from("products").select("id", { count: "exact", head: true });
  if (!count || count === 0) return null;

  const all: Product[] = [];
  const pageSize = 1000;
  for (let from = 0; from < count; from += pageSize) {
    const { data } = await admin
      .from("products")
      .select(LIST_COLS)
      .range(from, from + pageSize - 1);
    if (data) all.push(...data.map((r) => mapDbRow(r)));
  }

  dbCache = enrichProductsWithPfand(all);
  dbCacheTime = now;
  return dbCache;
}

/** Ana sayfa / liste için sınırlı sorgu — tüm kataloğu çekmez */
export async function fetchProductsPage(options?: {
  category?: string;
  limit?: number;
  offset?: number;
}): Promise<Product[] | null> {
  const admin = createAdminClient();
  if (!admin) return null;

  const limit = options?.limit ?? 24;
  const offset = options?.offset ?? 0;

  let query = admin
    .from("products")
    .select(LIST_COLS)
    .eq("is_active", true)
    .gt("price_b2c", 0)
    .neq("name_de", "#")
    .neq("category_slug", "pfand")
    .order("name_de", { ascending: true });

  if (options?.category) query = query.eq("category_slug", options.category);

  const { data, error } = await query.range(offset, offset + limit - 1);
  if (error || !data) return null;

  // Pfand fiyatları için bağlı satırları da çek
  const page = data.map((r) => mapDbRow(r));
  const pfandSkus = [...new Set(page.map((p) => p.pfand_sku).filter(Boolean))] as string[];
  if (pfandSkus.length === 0) return enrichProductsWithPfand(page);

  const { data: pfandRows } = await admin.from("products").select("*").in("sku", pfandSkus);
  const pfandProducts = (pfandRows ?? []).map((r) => mapDbRow(r));
  return enrichProductsWithPfand([...page, ...pfandProducts]).filter((p) => p.category_slug !== "pfand");
}

/** Aktif kampanyalı ürünler — sınırlı DB sorgusu */
export async function fetchPromoProductsPage(limit = 8): Promise<Product[] | null> {
  const admin = createAdminClient();
  if (!admin) return null;

  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await admin
    .from("products")
    .select(LIST_COLS)
    .eq("is_active", true)
    .gt("price_b2c", 0)
    .neq("name_de", "#")
    .neq("category_slug", "pfand")
    .not("promo_price", "is", null)
    .gt("promo_price", 0)
    .lte("promo_from", today)
    .gte("promo_to", today)
    .order("promo_price", { ascending: true })
    .limit(Math.max(limit * 3, 24));

  if (error || !data) return null;
  const page = data.map((r) => mapDbRow(r));
  const pfandSkus = [...new Set(page.map((p) => p.pfand_sku).filter(Boolean))] as string[];
  if (pfandSkus.length === 0) return enrichProductsWithPfand(page);
  const { data: pfandRows } = await admin.from("products").select("*").in("sku", pfandSkus);
  return enrichProductsWithPfand([...page, ...(pfandRows ?? []).map((r) => mapDbRow(r))]).filter(
    (p) => p.category_slug !== "pfand"
  );
}

export async function fetchProductsForOrder(ids: string[], skus: string[]): Promise<Product[]> {
  const admin = createAdminClient();
  if (!admin) return [];

  const map = new Map<string, Product>();

  if (ids.length > 0) {
    const { data } = await admin.from("products").select("*").in("id", ids);
    for (const row of data ?? []) map.set(row.id as string, mapDbRow(row));
  }

  const missingSkus = skus.filter((s) => ![...map.values()].some((p) => p.sku === s));
  if (missingSkus.length > 0) {
    const { data } = await admin.from("products").select("*").in("sku", missingSkus);
    for (const row of data ?? []) map.set(row.id as string, mapDbRow(row));
  }

  // Bağlı pfand ürünlerini de yükle
  const pfandSkus = [...map.values()]
    .map((p) => p.pfand_sku)
    .filter((s): s is string => Boolean(s) && ![...map.values()].some((p) => p.sku === s));
  if (pfandSkus.length > 0) {
    const { data } = await admin.from("products").select("*").in("sku", pfandSkus);
    for (const row of data ?? []) map.set(row.id as string, mapDbRow(row));
  }

  return enrichProductsWithPfand([...map.values()]);
}

export function clearProductsCache() {
  dbCache = null;
  shopNavCache = null;
}

export async function getProductsAsync(options?: {
  category?: string;
  search?: string;
  limit?: number;
  offset?: number;
  activeOnly?: boolean;
}): Promise<Product[]> {
  const limit = options?.limit;
  const offset = options?.offset ?? 0;
  const wantsSearch = Boolean(options?.search);
  const activeOnly = options?.activeOnly !== false;

  // Hızlı yol: sınırlı liste, arama yok → tüm kataloğu indirme
  if (!wantsSearch && activeOnly && limit != null && limit <= 48) {
    const page = await fetchProductsPage({
      category: options?.category,
      limit,
      offset,
    });
    if (page) return page;
  }

  const db = await loadProductsFromDb();
  if (db) {
    let result = [...db];
    if (activeOnly) {
      result = result.filter(
        (p) => p.is_active && p.price_b2c > 0 && p.name_de !== "#" && p.category_slug !== "pfand"
      );
    }
    if (options?.category) result = result.filter((p) => p.category_slug === options.category);
    if (options?.search) {
      const q = options.search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name_de.toLowerCase().includes(q) ||
          (p.name_tr && p.name_tr.toLowerCase().includes(q)) ||
          p.sku.toLowerCase().includes(q) ||
          (p.barcode && p.barcode.includes(q))
      );
    }
    const lim = limit ?? result.length;
    return result.slice(offset, offset + lim);
  }

  let result = enrichProductsWithPfand(jsonProducts as Product[]);

  if (activeOnly) {
    result = result.filter(
      (p) => p.is_active && p.price_b2c > 0 && p.name_de !== "#" && p.category_slug !== "pfand"
    );
  }
  if (options?.category) {
    result = result.filter((p) => p.category_slug === options.category);
  }
  if (options?.search) {
    const q = options.search.toLowerCase();
    result = result.filter(
      (p) =>
        p.name_de.toLowerCase().includes(q) ||
        (p.name_tr && p.name_tr.toLowerCase().includes(q)) ||
        p.sku.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.includes(q))
    );
  }
  const lim = limit ?? result.length;
  return result.slice(offset, offset + lim);
}

export function getCategoriesSync(): Category[] {
  return jsonCategories;
}

/** Nav / vitrin: gerçekten satılan ürünü olan kategoriler + kampanya var mı */
export async function getShopNavData(): Promise<{
  categories: Category[];
  hasPromos: boolean;
}> {
  const now = Date.now();
  if (shopNavCache && now - shopNavCache.at < NAV_CACHE_MS) {
    return { categories: shopNavCache.categories, hasPromos: shopNavCache.hasPromos };
  }

  const { isPromoActive } = await import("./pricing");
  const admin = createAdminClient();
  let categories: Category[] = [];
  let hasPromos = false;

  if (admin) {
    const promoPage = await fetchPromoProductsPage(24);
    if (promoPage) {
      hasPromos = promoPage.some((p) => isPromoActive(p));
    }

    const counts = new Map<string, number>();
    const pageSize = 1000;
    let from = 0;
    for (;;) {
      const { data, error } = await admin
        .from("products")
        .select("category_slug")
        .eq("is_active", true)
        .gt("price_b2c", 0)
        .neq("name_de", "#")
        .range(from, from + pageSize - 1);
      if (error || !data?.length) break;
      for (const row of data) {
        const slug = row.category_slug as string | null;
        if (!slug) continue;
        counts.set(slug, (counts.get(slug) ?? 0) + 1);
      }
      if (data.length < pageSize) break;
      from += pageSize;
    }

    if (counts.size > 0) {
      categories = jsonCategories
        .map((c) => ({ ...c, product_count: counts.get(c.slug) ?? 0 }))
        .filter((c) => c.slug !== "pfand" && (c.product_count ?? 0) > 0)
        .sort((a, b) => (b.product_count ?? 0) - (a.product_count ?? 0));
    }
  }

  if (categories.length === 0) {
    categories = jsonCategories
      .filter((c) => c.slug !== "pfand" && (c.product_count ?? 0) > 0)
      .map((c) => ({ ...c }));
    if (!hasPromos) {
      hasPromos = jsonProducts.some(
        (p) => p.is_active && p.price_b2c > 0 && p.name_de.trim() !== "#" && isPromoActive(p)
      );
    }
  }

  shopNavCache = { categories, hasPromos, at: now };
  return { categories, hasPromos };
}

export async function countProductsAsync(options?: {
  category?: string;
  search?: string;
  activeOnly?: boolean;
}): Promise<number> {
  const admin = createAdminClient();
  if (admin) {
    const { count } = await admin.from("products").select("id", { count: "exact", head: true });
    if (count && count > 0) {
      let query = admin.from("products").select("id", { count: "exact", head: true });
      if (options?.activeOnly !== false) {
        query = query.eq("is_active", true).gt("price_b2c", 0);
      }
      if (options?.category) query = query.eq("category_slug", options.category);
      if (options?.search) {
        const q = options.search;
        query = query.or(`name_de.ilike.%${q}%,name_tr.ilike.%${q}%,sku.ilike.%${q}%,barcode.ilike.%${q}%`);
      }
      const { count: filtered } = await query;
      return filtered ?? 0;
    }
  }

  let result = [...jsonProducts];
  if (options?.activeOnly !== false) result = result.filter((p) => p.is_active && p.price_b2c > 0);
  if (options?.category) result = result.filter((p) => p.category_slug === options.category);
  if (options?.search) {
    const q = options.search.toLowerCase();
    result = result.filter(
      (p) =>
        p.name_de.toLowerCase().includes(q) ||
        (p.name_tr && p.name_tr.toLowerCase().includes(q)) ||
        p.sku.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.includes(q))
    );
  }
  return result.length;
}

