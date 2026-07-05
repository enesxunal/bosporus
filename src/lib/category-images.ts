import type { Product } from "./types";

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&h=450&fit=crop";

/** Category → Unsplash food imagery for MVP placeholders */
export const CATEGORY_IMAGES: Record<string, string> = {
  obst: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=600&h=450&fit=crop",
  gemuese: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&h=450&fit=crop",
  getraenke: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=600&h=450&fit=crop",
  alkohol: "https://images.unsplash.com/photo-1510812431400-a5d4f1b90c99?w=600&h=450&fit=crop",
  lebensmittel: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=450&fit=crop",
  "tk-tiefkuehl": "https://images.unsplash.com/photo-1574484284002-952d92456975?w=600&h=450&fit=crop",
  konserven: "https://images.unsplash.com/photo-1604909052743-94e838986e24?w=600&h=450&fit=crop",
  gewuerze: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&h=450&fit=crop",
  saucen: "https://images.unsplash.com/photo-1625944525533-473f1a3d54e7?w=600&h=450&fit=crop",
  molkerei: "https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=600&h=450&fit=crop",
  asia: "https://images.unsplash.com/photo-1617093727343-374698b1b08d?w=600&h=450&fit=crop",
  "snacks-suesswaren": "https://images.unsplash.com/photo-1599490659213-e854d3d7d089?w=600&h=450&fit=crop",
  "verpackung-reinigungsmittel-hygiene": "https://images.unsplash.com/photo-1563453563092-f2fd4d49f0fb?w=600&h=450&fit=crop",
  oele: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&h=450&fit=crop",
  kuehlschrankware: "https://images.unsplash.com/photo-1563636619-e91425da1793?w=600&h=450&fit=crop",
  grillkohle: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&h=450&fit=crop",
  pfand: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&h=450&fit=crop",
  "lieferung-fracht": "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=600&h=450&fit=crop",
};

export function getProductImageUrl(product: Pick<Product, "image_url" | "category_slug">): string {
  if (product.image_url) return product.image_url;
  if (product.category_slug && CATEGORY_IMAGES[product.category_slug]) {
    return CATEGORY_IMAGES[product.category_slug];
  }
  return DEFAULT_IMAGE;
}

export function getCategoryImageUrl(slug: string): string {
  return CATEGORY_IMAGES[slug] ?? DEFAULT_IMAGE;
}

/** Mock availability for Metro-style B2B rows */
export function getAvailability(product: Product): "in_stock" | "limited" | "out_of_stock" {
  if (!product.is_active || product.price_b2c <= 0) return "out_of_stock";
  const hash = product.sku.charCodeAt(0) % 10;
  if (hash === 0) return "limited";
  return "in_stock";
}
