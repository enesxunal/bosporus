/**
 * CSV → JSON import for Bosporus artikel.csv
 * Supports:
 *   - New: Artikeltext1;Gruppe;MwSt;vkNetto;vkBrutto
 *   - Old: Artikeltext1;Artikelgruppe;Steuersatz;VKPreis;...
 *
 * Run: npm run import:products
 *
 * Existing products.json SKUs keep the same id / image / name_tr when possible.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { parse } from "csv-parse/sync";
import { randomUUID } from "crypto";

const ROOT = join(__dirname, "..");
const CSV_PATH = join(ROOT, "artikel.csv");
const OUT_DIR = join(ROOT, "src", "data");
const PRODUCTS_PATH = join(OUT_DIR, "products.json");

const CATEGORY_LABELS: Record<string, { de: string; tr: string }> = {
  Pfand: { de: "Pfand", tr: "Depozito" },
  "Lieferung/Fracht": { de: "Lieferung", tr: "Teslimat" },
  Transportkosten: { de: "Transportkosten", tr: "Nakliye" },
  Obst: { de: "Obst", tr: "Meyve" },
  Gemüse: { de: "Gemüse", tr: "Sebze" },
  Getränke: { de: "Getränke", tr: "İçecekler" },
  Alkohol: { de: "Alkohol", tr: "Alkol" },
  Lebensmittel: { de: "Lebensmittel", tr: "Gıda" },
  "TK Tiefkühl": { de: "Tiefkühl", tr: "Donmuş" },
  Konserven: { de: "Konserven", tr: "Konserve" },
  Gewürze: { de: "Gewürze", tr: "Baharat" },
  Saucen: { de: "Saucen", tr: "Soslar" },
  Molkerei: { de: "Molkerei", tr: "Süt Ürünleri" },
  Asia: { de: "Asiatische Küche", tr: "Asya Mutfağı" },
  "Snacks & Süßwaren": { de: "Snacks & Süßwaren", tr: "Atıştırmalık" },
  "Verpackung/Reinigungsmittel/Hygiene": {
    de: "Verpackung & Hygiene",
    tr: "Ambalaj & Hijyen",
  },
  Öle: { de: "Öle", tr: "Yağlar" },
  Kühlschrankware: { de: "Kühlware", tr: "Soğuk Ürünler" },
  Grillkohle: { de: "Grillkohle", tr: "Mangal Kömürü" },
  Sonstiges: { de: "Sonstiges", tr: "Diğer" },
};

interface ExistingProduct {
  id: string;
  sku: string;
  barcode: string | null;
  name_de: string;
  name_tr: string | null;
  category_slug: string;
  image_url: string | null;
  image_urls?: string[] | null;
  description_de?: string | null;
  description_tr?: string | null;
  base_unit: string;
  tax_rate: number;
  price_b2c: number;
  price_b2b: number;
  promo_price: number | null;
  promo_from: string | null;
  promo_to: string | null;
  is_active: boolean;
  stock_status: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function parseGermanDate(d: string): string | null {
  if (!d?.trim()) return null;
  const parts = d.split(".");
  if (parts.length !== 3) return null;
  const [day, month, year] = parts;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function parseNum(v: string | undefined): number {
  if (!v?.trim()) return 0;
  const n = parseFloat(v.replace(",", ".").replace(/[^\d.-]/g, ""));
  return isNaN(n) ? 0 : n;
}

function guessUnit(name: string): "kg" | "piece" | "box" | "palette" {
  const lower = name.toLowerCase();
  if (lower.includes("palette") || lower.includes("paletten")) return "palette";
  if (lower.includes("kiste") || lower.includes("karton") || lower.includes("pack"))
    return "box";
  if (lower.includes("kg") || lower.includes(" je kg")) return "kg";
  return "piece";
}

function loadExisting(): {
  bySku: Map<string, ExistingProduct>;
  byName: Map<string, ExistingProduct>;
} {
  const bySku = new Map<string, ExistingProduct>();
  const byName = new Map<string, ExistingProduct>();
  if (!existsSync(PRODUCTS_PATH)) return { bySku, byName };
  try {
    const list = JSON.parse(readFileSync(PRODUCTS_PATH, "utf8")) as ExistingProduct[];
    for (const p of list) {
      bySku.set(p.sku, p);
      byName.set(p.name_de.trim().toLowerCase(), p);
    }
  } catch {
    // ignore
  }
  return { bySku, byName };
}

function main() {
  // Windows-1252 export: € is byte 0x80 — map after latin1 read
  const raw = readFileSync(CSV_PATH, "latin1").replace(/\x80/g, "€");
  const rows = parse(raw, {
    delimiter: ";",
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
    bom: true,
  }) as Record<string, string>[];

  const { bySku, byName } = loadExisting();
  const categoryMap = new Map<
    string,
    { id: string; slug: string; name_de: string; name_tr: string; count: number }
  >();
  const usedSkus = new Set<string>();
  const products: object[] = [];

  let reused = 0;
  let created = 0;

  for (const row of rows) {
    const name = (row.Artikeltext1 ?? "").trim();
    if (!name) continue;

    const group =
      (row.Gruppe ?? row.Artikelgruppe ?? "").trim() || "Sonstiges";
    const catSlug = slugify(group) || "sonstiges";
    if (!categoryMap.has(catSlug)) {
      const labels = CATEGORY_LABELS[group] ?? { de: group, tr: group };
      categoryMap.set(catSlug, {
        id: randomUUID(),
        slug: catSlug,
        name_de: labels.de,
        name_tr: labels.tr,
        count: 0,
      });
    }
    categoryMap.get(catSlug)!.count++;

    const taxRate = parseNum(row.MwSt ?? row.Steuersatz) || 19;

    // New format: vkBrutto (B2C) + vkNetto (B2B)
    // Old format: VKPreis (B2C), B2B derived from net
    let priceB2c = parseNum(row.vkBrutto ?? row.VKPreis);
    let priceB2b = parseNum(row.vkNetto);
    if (!priceB2b && priceB2c > 0) {
      priceB2b = Math.round((priceB2c / (1 + taxRate / 100)) * 100) / 100;
    }
    if (!priceB2c && priceB2b > 0) {
      priceB2c = Math.round(priceB2b * (1 + taxRate / 100) * 100) / 100;
    }

    const promoNet = parseNum(row.AktionNetto);
    const promoFrom = parseGermanDate(row.AktionVon ?? "");
    const promoTo = parseGermanDate(row.AktionBis ?? "");

    let sku = slugify(name).slice(0, 60) || `item-${products.length}`;
    let suffix = 1;
    while (usedSkus.has(sku)) {
      sku = `${slugify(name).slice(0, 55)}-${suffix++}`;
    }
    usedSkus.add(sku);

    const existing = bySku.get(sku) ?? byName.get(name.toLowerCase());
    if (existing) reused++;
    else created++;

    products.push({
      id: existing?.id ?? randomUUID(),
      sku: existing?.sku ?? sku,
      barcode: existing?.barcode ?? null,
      name_de: name,
      name_tr: existing?.name_tr ?? null,
      description_de: existing?.description_de ?? null,
      description_tr: existing?.description_tr ?? null,
      category_slug: catSlug,
      image_url: existing?.image_url ?? null,
      image_urls: existing?.image_urls?.length ? existing.image_urls : [],
      base_unit: existing?.base_unit ?? guessUnit(name),
      tax_rate: taxRate,
      price_b2c: priceB2c,
      price_b2b: priceB2b,
      promo_price: promoNet > 0 ? promoNet : null,
      promo_from: promoFrom,
      promo_to: promoTo,
      is_active: priceB2c > 0 || priceB2b > 0,
      stock_status: existing?.stock_status ?? "in_stock",
    });
  }

  const categories = Array.from(categoryMap.values())
    .map(({ count, ...cat }) => ({ ...cat, product_count: count }))
    .sort((a, b) => b.product_count! - a.product_count!);

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(PRODUCTS_PATH, JSON.stringify(products, null, 2));
  writeFileSync(join(OUT_DIR, "categories.json"), JSON.stringify(categories, null, 2));

  console.log(`✓ ${products.length} ürün, ${categories.length} kategori`);
  console.log(`  yeniden kullanılan: ${reused}, yeni: ${created}`);
  console.log(`  → src/data/products.json`);
  console.log(`  → src/data/categories.json`);
}

main();
