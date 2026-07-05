import type { Category, Product } from "./types";
import { isPromoActive } from "./pricing";
import productsData from "@/data/products.json";
import categoriesData from "@/data/categories.json";
import { getProductsAsync as getProductsFromDb } from "./products-db";

const jsonProducts = productsData as Product[];
const categories = categoriesData as Category[];

export function getCategories(): Category[] {
  return categories;
}

export function getCategoryBySlug(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug);
}

/** Sunucu tarafı — önce Supabase, yoksa JSON */
export async function getProducts(options?: {
  category?: string;
  search?: string;
  limit?: number;
  offset?: number;
  activeOnly?: boolean;
}): Promise<Product[]> {
  return getProductsFromDb(options);
}

/** İstemci tarafı — senkron JSON (eski uyumluluk) */
export function getProductsSync(options?: {
  category?: string;
  search?: string;
  limit?: number;
  offset?: number;
  activeOnly?: boolean;
}): Product[] {
  let result = [...jsonProducts];
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

export async function getProductBySku(sku: string): Promise<Product | undefined> {
  const list = await getProducts({ search: sku, limit: 1, activeOnly: false });
  return list.find((p) => p.sku === sku) ?? jsonProducts.find((p) => p.sku === sku);
}

export async function getProductCount(category?: string): Promise<number> {
  const list = await getProducts({ category, limit: 99999 });
  return list.length;
}

export function getFeaturedCategories(limit = 8): Category[] {
  return categories.slice(0, limit);
}

export async function getPromoProducts(limit = 8): Promise<Product[]> {
  const all = await getProducts({ limit: 9999 });
  return all.filter((p) => isPromoActive(p)).slice(0, limit);
}
