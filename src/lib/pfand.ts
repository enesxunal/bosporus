import type { CartItem, Product, UserProfile } from "@/lib/types";
import { isB2BApproved } from "@/lib/types";
import {
  getB2cGross,
  getB2cNet,
  getDisplayPrice,
  getWholesaleNet,
  isPromoActive,
  netToGross,
} from "@/lib/pricing";

export interface ProductPfandInfo {
  productId: string;
  sku: string;
  name: string;
  priceNet: number;
  priceGross: number;
  taxRate: number;
}

/** Katalogdaki pfand_sku alanını fiyat bilgisiyle doldurur */
export function enrichProductsWithPfand(products: Product[]): Product[] {
  const bySku = new Map(products.map((p) => [p.sku, p]));
  return products.map((p) => {
    if (!p.pfand_sku) return { ...p, pfand: null };
    const pf = bySku.get(p.pfand_sku);
    if (!pf) return { ...p, pfand: null };
    return {
      ...p,
      pfand: {
        productId: pf.id,
        sku: pf.sku,
        name_de: pf.name_de,
        name_tr: pf.name_tr,
        price_b2c: pf.price_b2c,
        price_b2b: pf.price_b2b,
        tax_rate: pf.tax_rate,
      },
    };
  });
}

export function resolvePfandForProduct(
  product: Product,
  lookup: Map<string, Product>,
  isB2b: boolean
): ProductPfandInfo | null {
  const sku = product.pfand_sku ?? product.pfand?.sku ?? null;
  if (!sku) return null;

  const pfProduct =
    lookup.get(sku) ??
    (product.pfand
      ? ({
          id: product.pfand.productId,
          sku: product.pfand.sku,
          name_de: product.pfand.name_de,
          price_b2c: product.pfand.price_b2c,
          price_b2b: product.pfand.price_b2b,
          tax_rate: product.pfand.tax_rate,
          is_active: true,
          stock_status: "in_stock",
          barcode: null,
          name_tr: product.pfand.name_tr,
          category_slug: "pfand",
          image_url: null,
          base_unit: "piece",
          promo_price: null,
          promo_from: null,
          promo_to: null,
          pfand_sku: null,
        } satisfies Product)
      : null);

  if (!pfProduct) return null;

  let priceNet: number;
  let priceGross: number;
  if (isB2b) {
    priceNet = getWholesaleNet(pfProduct);
    if (priceNet <= 0) return null;
    priceGross = netToGross(priceNet, pfProduct.tax_rate);
  } else {
    priceNet = getB2cNet(pfProduct, false);
    priceGross = getB2cGross(pfProduct, false);
    if (priceGross <= 0) return null;
  }

  return {
    productId: pfProduct.id,
    sku: pfProduct.sku,
    name: pfProduct.name_de,
    priceNet: Math.round(priceNet * 100) / 100,
    priceGross: Math.round(priceGross * 100) / 100,
    taxRate: pfProduct.tax_rate,
  };
}

export function cartUnitGross(item: CartItem): number {
  return Math.round((item.priceGross + (item.pfand?.priceGross ?? 0)) * 100) / 100;
}

export function cartLineTotalGross(item: CartItem): number {
  return Math.round(cartUnitGross(item) * item.quantity * 100) / 100;
}

export function buildCartItemFromProduct(
  product: Product,
  quantity: number,
  profile: UserProfile | null,
  localeName?: string
): CartItem {
  const isB2b = isB2BApproved(profile);
  const displayPrice = getDisplayPrice(product, profile);
  const promo = isPromoActive(product);

  let priceNet: number;
  let priceGross: number;
  if (isB2b) {
    priceNet = promo && product.promo_price != null ? product.promo_price : getWholesaleNet(product);
    priceGross = netToGross(priceNet, product.tax_rate);
  } else if (displayPrice.label === "brutto") {
    priceGross = displayPrice.amount;
    priceNet = getB2cNet(product, promo);
  } else {
    priceNet = displayPrice.amount;
    priceGross = netToGross(priceNet, product.tax_rate);
  }

  return {
    productId: product.id,
    sku: product.sku,
    name: localeName ?? product.name_de,
    quantity,
    unit: product.base_unit,
    priceNet: Math.round(priceNet * 100) / 100,
    priceGross: Math.round(priceGross * 100) / 100,
    taxRate: product.tax_rate,
    imageUrl: product.image_url,
    pfand: resolvePfandForProduct(product, new Map(), isB2b),
  };
}

export function isStandalonePfandProduct(product: Product): boolean {
  return product.category_slug === "pfand";
}

/** Sipariş satırlarına genişlet (ürün + pfand ayrı kalem) */
export function expandCartItemsForOrder(items: CartItem[]): CartItem[] {
  const out: CartItem[] = [];
  for (const item of items) {
    const { pfand, ...productLine } = item;
    out.push({ ...productLine, pfand: null });
    if (pfand) {
      out.push({
        productId: pfand.productId,
        sku: pfand.sku,
        name: pfand.name,
        quantity: item.quantity,
        unit: "piece",
        priceNet: pfand.priceNet,
        priceGross: pfand.priceGross,
        taxRate: pfand.taxRate,
        imageUrl: null,
        pfand: null,
      });
    }
  }
  return out;
}
