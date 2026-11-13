import type { Product } from "@/lib/types";

export type CatalogSort = "name_asc" | "name_desc" | "price_asc" | "price_desc";

export function parseCatalogSort(value: string | null | undefined): CatalogSort {
  if (value === "name_desc" || value === "price_asc" || value === "price_desc") return value;
  return "name_asc";
}

/** German umlauts, Turkish dotted i, punctuation and word separators.
 * Do not alter the original product name, SKU or searchable barcode. */
export function normalizeCatalogText(value: string): string {
  return value
    .toLocaleLowerCase("de")
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .replace(/ı/g, "i").replace(/ł/g, "l")
    .normalize("NFKD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim().replace(/\s+/g, " ");
}

export function productSearchScore(product: Product, search: string): number {
  const term = normalizeCatalogText(search).slice(0, 120);
  if (!term) return 0;
  const sku = normalizeCatalogText(product.sku);
  const de = normalizeCatalogText(product.name_de);
  const tr = normalizeCatalogText(product.name_tr ?? "");
  const barcode = normalizeCatalogText(product.barcode ?? "");
  const compact = (s: string) => s.replace(/ /g, "");
  const compactTerm = compact(term);
  if ((barcode && barcode === term) || sku === term) return 100;
  if (compact(sku) === compactTerm) return 95;
  if (de === term || tr === term) return 90;
  if (de.startsWith(term) || tr.startsWith(term)) return 80;
  if (de.includes(term) || tr.includes(term)) return 70;
  if (sku.includes(term) || barcode.includes(term)) return 60;
  if (compact(de).includes(compactTerm) || compact(tr).includes(compactTerm)) return 55;
  // Customers often enter a/o/u instead of ae/oe/ue for umlauts.
  const loose = (text: string) => text.replace(/ae/g, "a").replace(/oe/g, "o").replace(/ue/g, "u");
  if (loose(de).includes(loose(term)) || loose(tr).includes(loose(term))) return 50;
  const words = term.split(" ").filter(Boolean);
  if (words.every((word) => de.includes(word) || tr.includes(word) || sku.includes(word))) return 40;
  return -1;
}

const collator = new Intl.Collator("de", { numeric: true, sensitivity: "base" });

export function searchAndSortProducts(
  products: Product[],
  search?: string,
  sort: CatalogSort = "name_asc"
): Product[] {
  const term = search?.trim();
  const ranked = term
    ? products.map((p) => ({ p, rank: productSearchScore(p, term) })).filter((x) => x.rank >= 0)
    : products.map((p) => ({ p, rank: 0 }));
  ranked.sort((a, b) => {
    if (term && a.rank !== b.rank) return b.rank - a.rank;
    if (sort === "price_asc" || sort === "price_desc") {
      const delta = Number(a.p.price_b2c) - Number(b.p.price_b2c);
      if (delta !== 0) return sort === "price_desc" ? -delta : delta;
    }
    const nameOrder = collator.compare(a.p.name_de, b.p.name_de);
    return sort === "name_desc" ? -nameOrder : nameOrder;
  });
  return ranked.map(({ p }) => p);
}
