import type { Category, Product } from "./types";
import { isPromoActive } from "./pricing";
import productsData from "@/data/products.json";
import categoriesData from "@/data/categories.json";

const products = productsData as Product[];
const categories = categoriesData as Category[];

export function getCategories(): Category[] {
  return categories;
}

export function getCategoryBySlug(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug);
}

export function getProducts(options?: {
  category?: string;
  search?: string;
  limit?: number;
  offset?: number;
  activeOnly?: boolean;
}): Product[] {
  let result = [...products];

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
        p.sku.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.includes(q))
    );
  }

  const offset = options?.offset ?? 0;
  const limit = options?.limit ?? result.length;
  return result.slice(offset, offset + limit);
}

export function getProductBySku(sku: string): Product | undefined {
  return products.find((p) => p.sku === sku);
}

export function getProductCount(category?: string): number {
  return getProducts({ category, limit: 99999 }).length;
}

export function getFeaturedCategories(limit = 8): Category[] {
  return categories.slice(0, limit);
}

export function getPromoProducts(limit = 8): Product[] {
  return getProducts({ limit: 9999 }).filter((p) => isPromoActive(p)).slice(0, limit);
}
