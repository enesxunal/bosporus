import type { Product, UserProfile } from "./types";
import { isB2BApproved } from "./types";

/** Bireysel (B2C) fiyat = toptan liste × bu çarpan, sonra KDV */
export const B2C_MARKUP = 1.2;

export function getTaxMultiplier(taxRate: number): number {
  return 1 + taxRate / 100;
}

export function netToGross(net: number, taxRate: number): number {
  return Math.round(net * getTaxMultiplier(taxRate) * 100) / 100;
}

export function grossToNet(gross: number, taxRate: number): number {
  return Math.round((gross / getTaxMultiplier(taxRate)) * 100) / 100;
}

/** Toptan liste fiyatı (net). Sadece price_b2b — price_b2c bireysel brüttür, toptan değildir. */
export function getWholesaleNet(product: Product): number {
  if (product.price_b2b > 0) return product.price_b2b;
  return 0;
}

export function hasSellablePrice(product: Product): boolean {
  return getWholesaleNet(product) > 0 || product.price_b2c > 0;
}

/**
 * B2C net.
 * - Toptan (price_b2b) varsa: net × %20
 * - Yoksa (katalogda gizlenmişse): price_b2c zaten bireysel brüt → net’e çevir
 * - Kampanya: promo_price toptan net kabul edilir, × %20
 */
export function getB2cNet(product: Product, usePromo = false): number {
  if (usePromo && product.promo_price && product.promo_price > 0) {
    return Math.round(product.promo_price * B2C_MARKUP * 100) / 100;
  }
  if (product.price_b2b > 0) {
    return Math.round(product.price_b2b * B2C_MARKUP * 100) / 100;
  }
  if (product.price_b2c > 0) {
    return grossToNet(product.price_b2c, product.tax_rate);
  }
  return 0;
}

export function getB2cGross(product: Product, usePromo = false): number {
  if (usePromo && product.promo_price && product.promo_price > 0) {
    return netToGross(getB2cNet(product, true), product.tax_rate);
  }
  if (product.price_b2b > 0) {
    return netToGross(getB2cNet(product, false), product.tax_rate);
  }
  if (product.price_b2c > 0) {
    return Math.round(product.price_b2c * 100) / 100;
  }
  return 0;
}

export function isPromoActive(product: Product, now = new Date()): boolean {
  if (!product.promo_price || product.promo_price <= 0) return false;
  if (!product.promo_from || !product.promo_to) return false;
  const from = new Date(product.promo_from);
  const to = new Date(product.promo_to);
  to.setHours(23, 59, 59, 999);
  if (!(now >= from && now <= to)) return false;

  // promo_price toptan net ile karşılaştırılır (price_b2c brüt olduğu için kullanma)
  if (product.price_b2b > 0 && product.promo_price >= product.price_b2b - 0.01) {
    return false;
  }

  return true;
}

export interface DisplayPrice {
  label: "brutto" | "netto";
  amount: number;
  originalAmount?: number;
  isPromo: boolean;
  taxRate: number;
  showTaxNote: boolean;
}

export function getDisplayPrice(
  product: Product,
  profile: UserProfile | null
): DisplayPrice {
  const b2b = isB2BApproved(profile);
  const promo = isPromoActive(product);

  if (b2b) {
    const list = getWholesaleNet(product);
    const net = promo ? product.promo_price! : list;
    const original = promo && list > net ? list : undefined;
    return {
      label: "netto",
      amount: net,
      originalAmount: original,
      isPromo: Boolean(original),
      taxRate: product.tax_rate,
      showTaxNote: true,
    };
  }

  const gross = getB2cGross(product, promo);
  const regularGross = getB2cGross(product, false);
  const original = promo && regularGross > gross ? regularGross : undefined;

  return {
    label: "brutto",
    amount: gross,
    originalAmount: original,
    isPromo: Boolean(original),
    taxRate: product.tax_rate,
    showTaxNote: false,
  };
}

export function formatPrice(amount: number, locale: "de" | "tr" = "de"): string {
  return new Intl.NumberFormat(locale === "de" ? "de-DE" : "tr-TR", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

export function formatUnit(unit: string, locale: "de" | "tr"): string {
  const labels: Record<string, Record<"de" | "tr", string>> = {
    kg: { de: "kg", tr: "kg" },
    piece: { de: "Stück", tr: "Adet" },
    box: { de: "Kiste", tr: "Koli" },
    palette: { de: "Palette", tr: "Palet" },
  };
  return labels[unit]?.[locale] ?? unit;
}
