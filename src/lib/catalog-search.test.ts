import { describe, it, expect } from "vitest";
import { productSearchScore, searchAndSortProducts, parseCatalogSort } from "./catalog-search";
import type { Product } from "./types";

const item = (name_de: string, sku: string, price_b2c: number, barcode?: string): Product =>
  ({ name_de, sku, price_b2c, barcode: barcode ?? null, name_tr: null }) as Product;
const products = [
  item("Körfez Joghurt 3,8% 5kg", "korfez-joghurt-3-8-5kg", 13.2, "123456789"),
  item("Gülcan Käse 500g", "gulcan-kaese-500g", 6),
  item("Coca Cola 0,33l 24er Kiste", "coca-cola-0-33l-24er-kiste", 18.9),
  item("Milram Gouda 48% 15kg", "milram-gouda-48-15kg", 42),
];

describe("catalog search and sorting", () => {
  it("matches umlauts, accents and punctuation", () => {
    expect(productSearchScore(products[0], "Koerfez Joghurt")).toBeGreaterThan(0);
    expect(productSearchScore(products[1], "Gulcan Kase")).toBeGreaterThan(0);
    expect(productSearchScore(products[2], "coca-cola 0.33")).toBeGreaterThan(0);
  });
  it("matches barcode / SKU and ranks them before partial names", () => {
    expect(productSearchScore(products[0], "123456789")).toBe(100);
    expect(searchAndSortProducts(products, "milram-gouda-48-15kg")[0].sku)
      .toBe("milram-gouda-48-15kg");
  });
  it("matches separated words regardless of their order", () => {
    expect(searchAndSortProducts(products, "15kg milram").map((p) => p.sku))
      .toEqual(["milram-gouda-48-15kg"]);
  });
  it("supports accurate price and name ordering", () => {
    expect(searchAndSortProducts(products, undefined, "price_asc")[0].price_b2c).toBe(6);
    expect(searchAndSortProducts(products, undefined, "price_desc")[0].price_b2c).toBe(42);
    expect(searchAndSortProducts(products, undefined, "name_desc")[0].sku).toBe("milram-gouda-48-15kg");
    expect(parseCatalogSort("DROP TABLE")).toBe("name_asc");
  });
});
