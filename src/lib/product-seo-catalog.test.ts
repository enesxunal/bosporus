import { describe, expect, it } from "vitest";
import { uniqueIndexableProducts } from "@/lib/product-seo-catalog";
import { PAYMENT_TEST_SKU } from "@/lib/payment-test-product";
import type { Product } from "@/lib/types";

function sample(sku: string, overrides: Partial<Product> = {}): Product {
  return {
    id: sku,
    sku,
    name_de: "Muster 1kg",
    is_active: true,
    price_b2c: 10,
    price_b2b: 9,
    category_slug: "lebensmittel",
    stock_status: "in_stock",
    ...overrides,
  } as Product;
}

describe("SEO live product sitemap eligibility", () => {
  it("includes each canonical active commercial product exactly once", () => {
    const all = [
      sample("yes"),
      sample("yes"),
      sample("inactive", { is_active: false }),
      sample("zero", { price_b2c: 0 }),
      sample("deposit", { category_slug: "pfand" }),
      sample("blank", { name_de: "#" }),
      sample(PAYMENT_TEST_SKU),
      sample("another"),
    ];
    expect(uniqueIndexableProducts(all).map((p) => p.sku)).toEqual(["yes", "another"]);
  });

  it("keeps a temporarily out-of-stock active product indexable", () => {
    expect(
      uniqueIndexableProducts([sample("sold-out", { stock_status: "out_of_stock" })])
        .map((p) => p.sku)
    ).toEqual(["sold-out"]);
  });
});
