/**
 * Temporary internal payment-test product helpers.
 * Bypass applies only when EVERY cart line resolves server-side to PAYMENT_TEST_SKU.
 * Never trust a client `isTest` flag.
 */

export const PAYMENT_TEST_SKU = "PAYMENT-TEST-1EUR";

/** Max quantity for the test SKU (server + cart). */
export const PAYMENT_TEST_MAX_QTY = 1;

export type PaymentTestLine = {
  sku: string;
  quantity: number;
};

export function isPaymentTestSku(sku: string | null | undefined): boolean {
  return Boolean(sku && sku.trim() === PAYMENT_TEST_SKU);
}

/** Products that must never appear in public discovery surfaces. */
export function isCatalogHiddenSku(sku: string | null | undefined): boolean {
  return isPaymentTestSku(sku);
}

export function filterCatalogHiddenProducts<T extends { sku: string }>(
  products: T[]
): T[] {
  return products.filter((p) => !isCatalogHiddenSku(p.sku));
}

/**
 * TRUE only when:
 * - cart has ≥ 1 line
 * - every line SKU is PAYMENT_TEST_SKU (use server-resolved SKUs)
 * - every line quantity is within PAYMENT_TEST_MAX_QTY
 *
 * Mixed cart (test + normal) → FALSE (normal 500 € min applies).
 */
export function isPaymentTestCart(items: PaymentTestLine[]): boolean {
  if (!items.length) return false;
  return items.every(
    (item) =>
      isPaymentTestSku(item.sku) &&
      Number.isFinite(item.quantity) &&
      item.quantity > 0 &&
      item.quantity <= PAYMENT_TEST_MAX_QTY
  );
}

export function paymentTestQtyError(sku: string): string {
  return `PAYMENT_TEST_QTY:${sku}`;
}

/** Seed / admin create payload for production insert (not auto-run). */
export const PAYMENT_TEST_PRODUCT_SEED = {
  sku: PAYMENT_TEST_SKU,
  name_de: "Zahlungstest 1 EUR",
  name_tr: "Ödeme Testi 1 EUR",
  description_de:
    "Nur für interne Zahlungstests. Kein regulärer Verkaufsartikel.",
  description_tr:
    "Yalnızca dahili ödeme testi içindir. Normal satış ürünü değildir.",
  category_slug: "sonstiges",
  base_unit: "piece" as const,
  tax_rate: 0,
  price_b2c: 1,
  price_b2b: 1,
  is_active: true,
  stock_status: "in_stock",
} as const;
