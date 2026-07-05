import type { Product, Category } from "./types";
import productsData from "@/data/products.json";
import categoriesData from "@/data/categories.json";
import { createAdminClient } from "./supabase/admin";
import { parseImageUrls } from "./product-images";

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
  };
}

let dbCache: Product[] | null = null;
let dbCacheTime = 0;
const CACHE_MS = 60_000;

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
    const { data } = await admin.from("products").select("*").range(from, from + pageSize - 1);
    if (data) all.push(...data.map((r) => mapDbRow(r)));
  }

  dbCache = all;
  dbCacheTime = now;
  return all;
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

  return [...map.values()];
}

export function clearProductsCache() {
  dbCache = null;
}

export async function getProductsAsync(options?: {
  category?: string;
  search?: string;
  limit?: number;
  offset?: number;
  activeOnly?: boolean;
}): Promise<Product[]> {
  const db = await loadProductsFromDb();
  if (db) {
    let result = [...db];
    if (options?.activeOnly !== false) {
      result = result.filter((p) => p.is_active && p.price_b2c > 0);
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
    const offset = options?.offset ?? 0;
    const limit = options?.limit ?? result.length;
    return result.slice(offset, offset + limit);
  }

  let result = [...jsonProducts];

  if (options?.activeOnly !== false) {
    result = result.filter((p) => p.is_active && p.price_b2c > 0);
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
  const offset = options?.offset ?? 0;
  const limit = options?.limit ?? result.length;
  return result.slice(offset, offset + limit);
}

export function getCategoriesSync(): Category[] {
  return jsonCategories;
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

