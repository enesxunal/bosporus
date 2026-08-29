import type { MetadataRoute } from "next";
import { getCategories, getProductsSync } from "@/lib/products";
import { COMPANY } from "@/lib/company";
import { NON_SEO_CATEGORY_SLUGS } from "@/lib/category-seo";
import { getAllRatgeberSlugs } from "@/lib/ratgeber";
import { isCatalogHiddenSku } from "@/lib/payment-test-product";

const BASE = COMPANY.website.replace(/\/$/, "");

/** Sitemap yalnızca Almanca URL'ler — Türkçe arayüz noindex */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticPaths = [
    "",
    "/products",
    "/about",
    "/contact",
    "/grosshandel",
    "/delivery",
    "/ratgeber",
    "/impressum",
    "/datenschutz",
    "/agb",
    "/faq",
    "/widerruf",
  ];

  const entries: MetadataRoute.Sitemap = [];
  const products = getProductsSync({ activeOnly: true });
  const categories = getCategories();

  for (const path of staticPaths) {
    const basePriority = path === "" ? 1 : path === "/products" || path === "/ratgeber" ? 0.85 : 0.6;
    entries.push({
      url: `${BASE}${path}`,
      lastModified: now,
      changeFrequency: path === "" ? "daily" : "weekly",
      priority: basePriority,
    });
  }

  for (const slug of getAllRatgeberSlugs()) {
    entries.push({
      url: `${BASE}/ratgeber/${slug}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    });
  }

  for (const cat of categories) {
    if (NON_SEO_CATEGORY_SLUGS.has(cat.slug)) continue;
    entries.push({
      url: `${BASE}/products/${cat.slug}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    });
  }

  for (const product of products) {
    if (isCatalogHiddenSku(product.sku)) continue;
    entries.push({
      url: `${BASE}/product/${encodeURIComponent(product.sku)}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.5,
    });
  }

  return entries;
}
