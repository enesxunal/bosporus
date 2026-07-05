import type { MetadataRoute } from "next";
import { getCategories } from "@/lib/products";
import { COMPANY } from "@/lib/company";

const BASE = COMPANY.website.replace(/\/$/, "");

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const locales = ["de", "tr"] as const;

  const staticPaths = [
    "",
    "/products",
    "/about",
    "/contact",
    "/gewerbe",
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

  for (const locale of locales) {
    const prefix = locale === "de" ? "" : `/${locale}`;
    for (const path of staticPaths) {
      entries.push({
        url: `${BASE}${prefix}${path}`,
        lastModified: now,
        changeFrequency: path === "" ? "daily" : "weekly",
        priority: path === "" ? 1 : path === "/products" ? 0.9 : 0.6,
      });
    }

    for (const cat of getCategories()) {
      entries.push({
        url: `${BASE}${prefix}/products/${cat.slug}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
  }

  return entries;
}
