import type { MetadataRoute } from "next";
import { getCategories, getProductsSync } from "@/lib/products";
import { COMPANY } from "@/lib/company";

const BASE = COMPANY.website.replace(/\/$/, "");

/** Sitemap yalnızca Almanca URL’ler — Türkçe arayüz noindex */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticPaths = [
    "",
    "/products",
    "/about",
    "/contact",
    "/gewerbe",
    "/grosshandel",
    "/impressum",
    "/datenschutz",
    "/agb",
    "/faq",
    "/widerruf",
    "/order/track",
    "/login",
    "/register",
  ];

  const entries: MetadataRoute.Sitemap = [];
  const products = getProductsSync({ activeOnly: true });
  const categories = getCategories();

  for (const path of staticPaths) {
    const basePriority = path === "" ? 1 : path === "/products" ? 0.9 : 0.6;
    entries.push({
      url: `${BASE}${path}`,
      lastModified: now,
      changeFrequency: path === "" ? "daily" : "weekly",
      priority: basePriority,
    });
  }

  for (const cat of categories) {
    entries.push({
      url: `${BASE}/products/${cat.slug}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    });
  }

  for (const product of products) {
    entries.push({
      url: `${BASE}/product/${encodeURIComponent(product.sku)}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.5,
    });
  }

  return entries;
}
