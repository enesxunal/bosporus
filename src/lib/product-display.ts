import type { Product, Locale } from "./types";

export function getProductName(product: Pick<Product, "name_de" | "name_tr">, locale: Locale): string {
  if (locale === "tr" && product.name_tr?.trim()) return product.name_tr.trim();
  return product.name_de;
}

export function productDetailHref(sku: string): string {
  return `/product/${encodeURIComponent(sku)}`;
}
