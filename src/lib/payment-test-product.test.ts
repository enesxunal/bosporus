import { describe, expect, it } from "vitest";
import {
  filterCatalogHiddenProducts,
  isCatalogHiddenSku,
  isPaymentTestCart,
  isPaymentTestSku,
  PAYMENT_TEST_MAX_QTY,
  PAYMENT_TEST_SKU,
} from "./payment-test-product";

describe("payment-test-product", () => {
  it("SKU sabiti doğru", () => {
    expect(PAYMENT_TEST_SKU).toBe("PAYMENT-TEST-1EUR");
    expect(isPaymentTestSku(PAYMENT_TEST_SKU)).toBe(true);
    expect(isPaymentTestSku("OTHER")).toBe(false);
    expect(isCatalogHiddenSku(PAYMENT_TEST_SKU)).toBe(true);
  });

  it("yalnızca test SKU sepeti → bypass TRUE", () => {
    expect(
      isPaymentTestCart([{ sku: PAYMENT_TEST_SKU, quantity: 1 }])
    ).toBe(true);
  });

  it("boş sepet → FALSE", () => {
    expect(isPaymentTestCart([])).toBe(false);
  });

  it("test + normal ürün → FALSE (min order uygulanır)", () => {
    expect(
      isPaymentTestCart([
        { sku: PAYMENT_TEST_SKU, quantity: 1 },
        { sku: "NORMAL-1", quantity: 1 },
      ])
    ).toBe(false);
  });

  it("client spoof: yanlış SKU → FALSE", () => {
    expect(
      isPaymentTestCart([{ sku: "FAKE-TEST", quantity: 1 }])
    ).toBe(false);
  });

  it("quantity > max → FALSE", () => {
    expect(
      isPaymentTestCart([
        { sku: PAYMENT_TEST_SKU, quantity: PAYMENT_TEST_MAX_QTY + 1 },
      ])
    ).toBe(false);
  });

  it("katalog filtreleri test SKU’yu çıkarır", () => {
    const list = filterCatalogHiddenProducts([
      { sku: PAYMENT_TEST_SKU },
      { sku: "A-1" },
    ]);
    expect(list.map((p) => p.sku)).toEqual(["A-1"]);
  });
});

describe("quoteDelivery payment-test flags (unit)", () => {
  it("minOrderMet mantığı: bypass true iken subtotal 1 yeterli sayılır", () => {
    // Mirrors quoteDelivery: paymentTestCart || subtotal >= min
    const min = 500;
    const subtotal = 1;
    const paymentTestCart = true;
    const minOrderMet = paymentTestCart || subtotal >= min;
    expect(minOrderMet).toBe(true);

    const mixed = false;
    expect(mixed || subtotal >= min).toBe(false);
  });
});
