import type { Product, UserProfile } from "./types";
import { isB2BApproved } from "./types";

export function getTaxMultiplier(taxRate: number): number {
  return 1 + taxRate / 100;
}

export function netToGross(net: number, taxRate: number): number {
  return Math.round(net * getTaxMultiplier(taxRate) * 100) / 100;
}

export function grossToNet(gross: number, taxRate: number): number {
  return Math.round((gross / getTaxMultiplier(taxRate)) * 100) / 100;
}

export function isPromoActive(product: Product, now = new Date()): boolean {
  if (!product.promo_price || product.promo_price <= 0) return false;
  if (!product.promo_from || !product.promo_to) return false;
  const from = new Date(product.promo_from);
  const to = new Date(product.promo_to);
  to.setHours(23, 59, 59, 999);
  if (!(now >= from && now <= to)) return false;

  // Promo must actually be cheaper than the regular price
  const promoGross = netToGross(product.promo_price, product.tax_rate);
  if (product.price_b2c > 0 && promoGross >= product.price_b2c - 0.01) return false;
  if (product.price_b2b > 0 && product.promo_price >= product.price_b2b - 0.01) return false;

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
    const net = promo ? product.promo_price! : product.price_b2b;
    const original = promo && product.price_b2b > net ? product.price_b2b : undefined;
    return {
      label: "netto",
      amount: net,
      originalAmount: original,
      isPromo: Boolean(original),
      taxRate: product.tax_rate,
      showTaxNote: true,
    };
  }

  const gross = promo
    ? netToGross(product.promo_price!, product.tax_rate)
    : product.price_b2c;
  const original =
    promo && product.price_b2c > gross ? product.price_b2c : undefined;

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
