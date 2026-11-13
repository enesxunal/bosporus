import type { MetadataRoute } from "next";
import { getCategories, getProducts } from "@/lib/products";
import { COMPANY } from "@/lib/company";
import { NON_SEO_CATEGORY_SLUGS } from "@/lib/category-seo";
import { getAllRatgeberSlugs } from "@/lib/ratgeber";
import { uniqueIndexableProducts } from "@/lib/product-seo-catalog";

const BASE = COMPANY.website.replace(/\/$/, "");

// Read the live product database, not the stale build-time products.json.
// The sitemap is generated at request time so active product changes are reflected.
export const dynamic = "force-dynamic";

/**
 * Include only canonical German pages that are allowed in Google Search.
 * Omit lastModified when the actual content update time is unknown; a new
 * Date() on every request is misleading to Googlebot.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = uniqueIndexableProducts(await getProducts({ activeOnly: true }));
  const categories = getCategories();
  const urls: MetadataRoute.Sitemap = [];
  const seen = new Set<string>();

  function add(path: string, priority: number) {
    const url = BASE + path;
    if (seen.has(url)) return;
    seen.add(url);
    urls.push({ url, priority });
  }

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

  for (const path of staticPaths) {
    add(path, path === "" ? 1 : path === "/products" || path === "/ratgeber" ? 0.85 : 0.6);
  }

  for (const slug of getAllRatgeberSlugs()) {
    add("/ratgeber/" + slug, 0.7);
  }

  for (const category of categories) {
    if (NON_SEO_CATEGORY_SLUGS.has(category.slug)) continue;
    add("/products/" + category.slug, 0.7);
  }

  for (const product of products) {
    add("/product/" + encodeURIComponent(product.sku), 0.5);
  }
  return urls;
}
