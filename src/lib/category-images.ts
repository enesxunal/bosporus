import type { Product } from "./types";

const DEFAULT_IMAGE = "/categories/lebensmittel.jpg";
const DEFAULT_BANNER = "/banners/banner-lebensmittel.jpg";

export { DEFAULT_IMAGE, DEFAULT_BANNER };

/**
 * Ana sayfa kategori kartları — public/categories/{slug}.jpg (1600×1200)
 */
export const CATEGORY_IMAGES: Record<string, string> = {
  obst: "/categories/obst.jpg",
  gemuese: "/categories/gemuese.jpg",
  gemuse: "/categories/gemuese.jpg",
  getraenke: "/categories/getraenke.jpg",
  getranke: "/categories/getraenke.jpg",
  alkohol: "/categories/alkohol.jpg",
  lebensmittel: "/categories/lebensmittel.jpg",
  "tk-tiefkuehl": "/categories/tk-tiefkuehl.jpg",
  "tk-tiefkuhl": "/categories/tk-tiefkuehl.jpg",
  konserven: "/categories/konserven.jpg",
  gewuerze: "/categories/gewuerze.jpg",
  gewurze: "/categories/gewuerze.jpg",
  saucen: "/categories/saucen.jpg",
  molkerei: "/categories/molkerei.jpg",
  asia: "/categories/asia.jpg",
  "snacks-suesswaren": "/categories/snacks-suesswaren.jpg",
  "snacks-susswaren": "/categories/snacks-suesswaren.jpg",
  "verpackung-reinigungsmittel-hygiene": "/categories/verpackung-reinigungsmittel-hygiene.jpg",
  oele: "/categories/oele.jpg",
  ole: "/categories/oele.jpg",
  kuehlschrankware: "/categories/kuehlschrankware.jpg",
  kuhlschrankware: "/categories/kuehlschrankware.jpg",
  grillkohle: "/categories/grillkohle.jpg",
  pfand: "/categories/pfand.jpg",
  "lieferung-fracht": "/categories/lieferung-fracht.jpg",
  transportkosten: "/categories/transportkosten.jpg",
  sonstiges: "/categories/sonstiges.jpg",
};

/** Kategori sayfası üst banner — public/banners/banner-{slug}.jpg (2400×800) */
export const CATEGORY_BANNERS: Record<string, string> = {
  obst: "/banners/banner-obst.jpg",
  gemuese: "/banners/banner-gemuese.jpg",
  gemuse: "/banners/banner-gemuese.jpg",
  getraenke: "/banners/banner-getraenke.jpg",
  getranke: "/banners/banner-getraenke.jpg",
  alkohol: "/banners/banner-alkohol.jpg",
  lebensmittel: "/banners/banner-lebensmittel.jpg",
  "tk-tiefkuehl": "/banners/banner-tk-tiefkuehl.jpg",
  "tk-tiefkuhl": "/banners/banner-tk-tiefkuehl.jpg",
  konserven: "/banners/banner-konserven.jpg",
  gewuerze: "/banners/banner-gewuerze.jpg",
  gewurze: "/banners/banner-gewuerze.jpg",
  saucen: "/banners/banner-saucen.jpg",
  molkerei: "/banners/banner-molkerei.jpg",
  asia: "/banners/banner-asia.jpg",
  "snacks-suesswaren": "/banners/banner-snacks-suesswaren.jpg",
  "snacks-susswaren": "/banners/banner-snacks-suesswaren.jpg",
  "verpackung-reinigungsmittel-hygiene": "/banners/banner-verpackung-reinigungsmittel-hygiene.jpg",
  grillkohle: "/banners/banner-grillkohle.jpg",
};

export function getProductImageUrl(product: Pick<Product, "image_url" | "image_urls" | "category_slug">): string {
  const gallery = Array.isArray(product.image_urls)
    ? product.image_urls.filter((u): u is string => typeof u === "string" && u.trim().length > 0)
    : [];
  if (gallery.length > 0) return gallery[0];
  if (product.image_url) return product.image_url;
  if (product.category_slug && CATEGORY_IMAGES[product.category_slug]) {
    return CATEGORY_IMAGES[product.category_slug];
  }
  return DEFAULT_IMAGE;
}

export function getCategoryImageUrl(slug: string): string {
  return CATEGORY_IMAGES[slug] ?? DEFAULT_IMAGE;
}

export function getCategoryBannerUrl(slug: string): string {
  return CATEGORY_BANNERS[slug] ?? CATEGORY_IMAGES[slug] ?? DEFAULT_BANNER;
}

/** Gerçek stok durumu — admin / veritabanından */
export function getAvailability(product: Product): "in_stock" | "limited" | "out_of_stock" {
  if (!product.is_active || (product.price_b2b <= 0 && product.price_b2c <= 0)) {
    return "out_of_stock";
  }
  const status = product.stock_status?.toLowerCase() ?? "in_stock";
  if (status === "out_of_stock" || status === "tükendi" || status === "nicht verfügbar") {
    return "out_of_stock";
  }
  if (status === "low_stock" || status === "limited" || status === "az stok") {
    return "limited";
  }
  return "in_stock";
}
