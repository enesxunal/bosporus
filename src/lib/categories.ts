import type { Category } from "./types";
import categoriesData from "@/data/categories.json";

const categories = categoriesData as Category[];

/** İstemci-güvenli: yalnızca categories.json (products.json / admin client yok) */
export function getCategories(): Category[] {
  return categories;
}

export function getCategoryBySlug(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug);
}
