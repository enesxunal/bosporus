import type { Product } from "@/lib/types";
import { isCatalogHiddenSku } from "@/lib/payment-test-product";

/**
 * A canonical product sitemap must use actual published product identities.
 * Deduping by SKU also prevents duplicate <loc> entries in the XML feed.
 */
export function uniqueIndexableProducts(products: Product[]): Product[] {
  const skus = new Set<string>();
  return products.filter((product) => {
    if (
      !product.sku ||
      !product.is_active ||
      !(product.price_b2c > 0) ||
      !product.name_de?.trim() ||
      product.name_de.trim() === "#" ||
      product.category_slug === "pfand" ||
      isCatalogHiddenSku(product.sku) ||
      skus.has(product.sku)
    ) {
      return false;
    }
    skus.add(product.sku);
    return true;
  });
}
