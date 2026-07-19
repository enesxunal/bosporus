import type { Category, Product } from "./types";
import { isPromoActive } from "./pricing";
import productsData from "@/data/products.json";
import categoriesData from "@/data/categories.json";
import {
  getProductsAsync as getProductsFromDb,
  fetchPromoProductsPage,
  countProductsAsync,
} from "./products-db";
import { createAdminClient } from "./supabase/admin";
import { mapDbRow } from "./products-db";
import { enrichProductsWithPfand } from "./pfand";

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
    result = result.filter((p) => p.is_active && p.price_b2c > 0 && p.name_de !== "#");
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
  const admin = createAdminClient();
  if (admin) {
    const { data } = await admin.from("products").select("*").eq("sku", sku).maybeSingle();
    if (data) {
      const product = mapDbRow(data);
      if (product.pfand_sku) {
        const { data: pf } = await admin
          .from("products")
          .select("*")
          .eq("sku", product.pfand_sku)
          .maybeSingle();
        if (pf) {
          return enrichProductsWithPfand([product, mapDbRow(pf)])[0];
        }
      }
      return product;
    }
  }
  const fromJson = (jsonProducts as Product[]).find((p) => p.sku === sku);
  if (!fromJson) return undefined;
  return enrichProductsWithPfand(jsonProducts as Product[]).find((p) => p.sku === sku);
}

export async function getProductCount(category?: string): Promise<number> {
  return countProductsAsync({ category });
}

export function getFeaturedCategories(limit = 8): Category[] {
  return categories.filter((c) => (c.product_count ?? 0) > 0).slice(0, limit);
}

export async function getFeaturedCategoriesAsync(limit = 8): Promise<Category[]> {
  const { getShopNavData } = await import("./products-db");
  const { categories: withProducts } = await getShopNavData();
  return withProducts.slice(0, limit);
}

export async function getPromoProducts(limit = 8): Promise<Product[]> {
  const fromDb = await fetchPromoProductsPage(limit);
  if (fromDb) {
    return fromDb.filter((p) => isPromoActive(p)).slice(0, limit);
  }
  return getProductsSync({ activeOnly: true })
    .filter((p) => isPromoActive(p))
    .slice(0, limit);
}

export async function hasActivePromos(): Promise<boolean> {
  const { getShopNavData } = await import("./products-db");
  const { hasPromos } = await getShopNavData();
  return hasPromos;
}
