import type { Product, Locale } from "./types";

export function getProductName(product: Pick<Product, "name_de" | "name_tr">, locale: Locale): string {
  if (locale === "tr" && product.name_tr?.trim()) return product.name_tr.trim();
  return product.name_de;
}

export function getProductDescription(
  product: Pick<Product, "description_de" | "description_tr">,
  locale: Locale
): string | null {
  if (locale === "tr" && product.description_tr?.trim()) return product.description_tr.trim();
  if (product.description_de?.trim()) return product.description_de.trim();
  return product.description_tr?.trim() ?? null;
}

export function productDetailHref(sku: string): string {
  return `/product/${encodeURIComponent(sku)}`;
}
