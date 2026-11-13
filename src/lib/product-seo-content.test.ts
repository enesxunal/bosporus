import { describe, it, expect } from "vitest";
import products from "@/data/products.json";
import { VERIFIED_PRODUCT_CONTENT, getVerifiedProductContent } from "./product-seo-content";

describe("grounded product SEO content", () => {
  it("contains specific and nonduplicated facts for actual catalog products", () => {
    const bySku = new Map(products.map((p) => [p.sku, p]));
    const details = Object.entries(VERIFIED_PRODUCT_CONTENT);
    expect(details.length).toBeGreaterThanOrEqual(14);
    expect(new Set(details.map(([sku]) => sku)).size).toBe(details.length);
    for (const [sku, item] of details) {
      expect(bySku.has(sku)).toBe(true);
      expect(item.description.length).toBeLessThanOrEqual(160);
      expect(item.description.length).toBeGreaterThan(90);
      expect(item.detail.length).toBeGreaterThan(200);
      expect(item.detail).not.toMatch(/garantiert halal-zertifiziert/i);
      expect(getVerifiedProductContent(sku)).toEqual(item);
    }
  });
  it("does not invent content for unknown products", () => {
    expect(getVerifiedProductContent("fake-product")).toBeNull();
  });
});
