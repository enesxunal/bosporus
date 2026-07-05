/**
 * CSV → JSON import for Bosporus artikel.csv
 * Run: npm run import:products
 */
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { parse } from "csv-parse/sync";
import { randomUUID } from "crypto";

const ROOT = join(__dirname, "..");
const CSV_PATH = join(ROOT, "artikel.csv");
const OUT_DIR = join(ROOT, "src", "data");

const CATEGORY_LABELS: Record<string, { de: string; tr: string }> = {
  Pfand: { de: "Pfand", tr: "Depozito" },
  "Lieferung/Fracht": { de: "Lieferung", tr: "Teslimat" },
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
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
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

function parseNum(v: string): number {
  const n = parseFloat(v.replace(",", "."));
  return isNaN(n) ? 0 : n;
}

function guessUnit(name: string): "kg" | "piece" | "box" | "palette" {
  const lower = name.toLowerCase();
  if (lower.includes("palette") || lower.includes("paletten")) return "palette";
  if (
    lower.includes("kiste") ||
    lower.includes("karton") ||
    lower.includes("pack")
  )
    return "box";
  if (lower.includes("kg") || lower.includes(" je kg")) return "kg";
  return "piece";
}

function main() {
  const raw = readFileSync(CSV_PATH, "latin1");
  const rows = parse(raw, {
    delimiter: ";",
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
  }) as CsvRow[];

  const categoryMap = new Map<string, { id: string; slug: string; name_de: string; name_tr: string; count: number }>();
  const usedSkus = new Set<string>();
  const products: object[] = [];

  for (const row of rows) {
    const name = row.Artikeltext1?.trim();
    if (!name) continue;

    const group = row.Artikelgruppe?.trim() || "Sonstiges";
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

    const taxRate = parseNum(row.Steuersatz) || 19;
    const priceB2c = parseNum(row.VKPreis);
    const priceB2b = Math.round((priceB2c / (1 + taxRate / 100)) * 100) / 100;
    const promoNet = parseNum(row.AktionNetto);
    const promoFrom = parseGermanDate(row.AktionVon);
    const promoTo = parseGermanDate(row.AktionBis);

    let sku = slugify(name).slice(0, 60) || `item-${products.length}`;
    let suffix = 1;
    while (usedSkus.has(sku)) {
      sku = `${slugify(name).slice(0, 55)}-${suffix++}`;
    }
    usedSkus.add(sku);

    products.push({
      id: randomUUID(),
      sku,
      barcode: null,
      name_de: name,
      name_tr: null,
      category_slug: catSlug,
      image_url: null,
      base_unit: guessUnit(name),
      tax_rate: taxRate,
      price_b2c: priceB2c,
      price_b2b: priceB2b,
      promo_price: promoNet > 0 ? promoNet : null,
      promo_from: promoFrom,
      promo_to: promoTo,
      is_active: priceB2c > 0 || priceB2b > 0,
      stock_status: "in_stock",
    });
  }

  const categories = Array.from(categoryMap.values())
    .map(({ count, ...cat }) => ({ ...cat, product_count: count }))
    .sort((a, b) => b.product_count! - a.product_count!);

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(join(OUT_DIR, "products.json"), JSON.stringify(products, null, 2));
  writeFileSync(join(OUT_DIR, "categories.json"), JSON.stringify(categories, null, 2));

  console.log(`✓ ${products.length} ürün, ${categories.length} kategori içe aktarıldı`);
  console.log(`  → src/data/products.json`);
  console.log(`  → src/data/categories.json`);
}

interface CsvRow {
  Artikeltext1: string;
  Artikelgruppe: string;
  Steuersatz: string;
  VKPreis: string;
  Mindesthaltbarkeit: string;
  AktionNetto: string;
  AktionVon: string;
  AktionBis: string;
}

main();
