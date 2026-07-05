import type { Product } from "./types";
import { CATEGORY_IMAGES, DEFAULT_IMAGE } from "./category-images";

export function parseImageUrls(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((u): u is string => typeof u === "string" && u.trim().length > 0);
  }
  return [];
}

export function getProductImages(
  product: Pick<Product, "image_url" | "image_urls" | "category_slug">
): string[] {
  const gallery = parseImageUrls(product.image_urls);
  if (gallery.length > 0) return gallery;
  if (product.image_url) return [product.image_url];
  if (product.category_slug && CATEGORY_IMAGES[product.category_slug]) {
    return [CATEGORY_IMAGES[product.category_slug]];
  }
  return [DEFAULT_IMAGE];
}

export function getPrimaryImageUrl(
  product: Pick<Product, "image_url" | "image_urls" | "category_slug">
): string {
  return getProductImages(product)[0];
}
