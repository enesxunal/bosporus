import { describe, expect, it } from "vitest";
import { PAYMENT_TEST_SKU } from "@/lib/payment-test-product";
import { getCategorySeo, NON_SEO_CATEGORY_SLUGS } from "@/lib/category-seo";
import { getAllRatgeberSlugs, getRatgeberArticle } from "@/lib/ratgeber";
import {
  absoluteUrl,
  breadcrumbJsonLd,
  faqJsonLd,
  HOME_FAQ,
  productMetadata,
  siteGraphJsonLd,
} from "@/lib/seo";
import type { Product } from "@/lib/types";

const mockProduct = (overrides: Partial<Product> = {}): Product =>
  ({
    id: "1",
    sku: "test-sku",
    barcode: null,
    name_de: "Test Produkt 500g",
    name_tr: null,
    category_slug: "lebensmittel",
    category_name_de: "Lebensmittel",
    base_unit: "piece",
    tax_rate: 7,
    price_b2c: 10,
    price_b2b: 8,
    promo_price: null,
    promo_from: null,
    promo_to: null,
    is_active: true,
    stock_status: "in_stock",
    ...overrides,
  }) as Product;

describe("seo helpers", () => {
  it("absoluteUrl uses production base", () => {
    const url = absoluteUrl("/products/lebensmittel");
    expect(url).toMatch(/^https:\/\//);
    expect(url).toContain("/products/lebensmittel");
  });

  it("siteGraphJsonLd contains Organization, LocalBusiness and WebSite", () => {
    const graph = siteGraphJsonLd();
    expect(graph["@graph"]).toHaveLength(3);
    const types = (graph["@graph"] as { "@type": string | string[] }[]).map((n) => n["@type"]);
    expect(types[0]).toBe("Organization");
    expect(types[1]).toEqual(["LocalBusiness", "WholesaleStore"]);
    expect(types[2]).toBe("WebSite");
  });

  it("breadcrumbJsonLd maps items with positions", () => {
    const ld = breadcrumbJsonLd([
      { name: "Startseite", href: "/" },
      { name: "Getränke", href: "/products/getraenke" },
      { name: "Ayfit Ayran" },
    ]);
    expect(ld.itemListElement).toHaveLength(3);
    expect(ld.itemListElement[0].position).toBe(1);
    expect(ld.itemListElement[2].name).toBe("Ayfit Ayran");
  });

  it("faqJsonLd matches visible FAQ count", () => {
    const ld = faqJsonLd(HOME_FAQ);
    expect(ld?.mainEntity).toHaveLength(HOME_FAQ.length);
  });

  it("payment test SKU gets noindex metadata", () => {
    const meta = productMetadata(mockProduct({ sku: PAYMENT_TEST_SKU }), "de");
    expect(meta.robots).toMatchObject({ index: false, follow: false });
  });

  it("regular product gets indexable DE canonical", () => {
    const meta = productMetadata(mockProduct(), "de");
    expect(meta.robots).toMatchObject({ index: true, follow: true });
    expect(meta.alternates?.canonical).toContain("/product/test-sku");
    expect(meta.title).toContain("Test Produkt");
  });

  it("priority product override description for Ayfit", () => {
    const meta = productMetadata(
      mockProduct({ sku: "ayfit-ayran-250ml", name_de: "AYFIT Ayran 250ml" }),
      "de"
    );
    const desc = meta.description as string;
    expect(desc.toLowerCase()).toContain("ayfit");
    expect(desc.toLowerCase()).toContain("großhandel");
  });

  it("category SEO has unique title for lebensmittel", () => {
    const seo = getCategorySeo({
      id: "1",
      slug: "lebensmittel",
      name_de: "Lebensmittel",
      name_tr: null,
      product_count: 239,
      sort_order: 1,
    });
    expect(seo.title).toContain("Lebensmittel Großhandel Köln");
    expect(seo.h1).toContain("Lebensmittel");
  });

  it("ratgeber slugs resolve to articles", () => {
    const slugs = getAllRatgeberSlugs();
    expect(slugs.length).toBeGreaterThanOrEqual(5);
    for (const slug of slugs) {
      expect(getRatgeberArticle(slug)).toBeDefined();
    }
  });

  it("non-SEO categories excluded from sitemap helper set", () => {
    expect(NON_SEO_CATEGORY_SLUGS.has("pfand")).toBe(true);
    expect(NON_SEO_CATEGORY_SLUGS.has("lebensmittel")).toBe(false);
  });
});
