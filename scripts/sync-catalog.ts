/**
 * Sync products.json + categories.json → Supabase
 * Usage: npx tsx scripts/sync-catalog.ts
 * Loads env from .env.local or Vercel pull.
 */
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { createClient } from "@supabase/supabase-js";

const ROOT = join(__dirname, "..");

function loadEnv() {
  const paths = [join(ROOT, ".env.local"), join(ROOT, ".env")];
  for (const p of paths) {
    if (!existsSync(p)) continue;
    for (const line of readFileSync(p, "utf8").split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const i = t.indexOf("=");
      if (i < 0) continue;
      const k = t.slice(0, i).trim();
      let v = t.slice(i + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      if (!process.env[k]) process.env[k] = v;
    }
  }
}

loadEnv();

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    console.error("Supabase URL / SERVICE_ROLE_KEY eksik (.env.local)");
    process.exit(1);
  }

  const admin = createClient(url, key, { auth: { persistSession: false } });
  const products = JSON.parse(readFileSync(join(ROOT, "src/data/products.json"), "utf8"));
  const categories = JSON.parse(readFileSync(join(ROOT, "src/data/categories.json"), "utf8"));

  console.log(`Kategoriler: ${categories.length}`);
  const catBatch = categories.map((c: { id: string; slug: string; name_de: string; name_tr: string; sort_order?: number }, i: number) => ({
    id: c.id,
    slug: c.slug,
    name_de: c.name_de,
    name_tr: c.name_tr,
    sort_order: c.sort_order ?? i,
  }));
  const { error: catErr } = await admin.from("categories").upsert(catBatch, { onConflict: "slug" });
  if (catErr) {
    console.error("Kategori hatası:", catErr.message);
    process.exit(1);
  }
  console.log("✓ kategoriler OK");

  // Preserve existing images / TR content
  const { data: existingRows } = await admin
    .from("products")
    .select("sku, image_url, image_urls, name_tr, description_de, description_tr");
  const existingBySku = new Map((existingRows ?? []).map((r) => [r.sku as string, r]));

  const BATCH = 200;
  let synced = 0;
  for (let i = 0; i < products.length; i += BATCH) {
    const batch = products.slice(i, i + BATCH).map((p: Record<string, unknown>) => {
      const prev = existingBySku.get(p.sku as string) as Record<string, unknown> | undefined;
      return {
        id: p.id,
        sku: p.sku,
        barcode: p.barcode ?? null,
        name_de: p.name_de,
        name_tr: (p.name_tr as string)?.trim() || prev?.name_tr || null,
        description_de: (p.description_de as string)?.trim() || prev?.description_de || null,
        description_tr: (p.description_tr as string)?.trim() || prev?.description_tr || null,
        category_slug: p.category_slug,
        image_url: p.image_url || prev?.image_url || null,
        image_urls:
          (Array.isArray(p.image_urls) && (p.image_urls as string[]).length > 0
            ? p.image_urls
            : null) ??
          prev?.image_urls ??
          null,
        base_unit: p.base_unit,
        tax_rate: p.tax_rate,
        price_b2c: p.price_b2c,
        price_b2b: p.price_b2b,
        promo_price: p.promo_price,
        promo_from: p.promo_from,
        promo_to: p.promo_to,
        is_active: p.is_active,
        stock_status: p.stock_status,
        updated_at: new Date().toISOString(),
      };
    });

    const { error } = await admin.from("products").upsert(batch, { onConflict: "sku" });
    if (error) {
      console.error(`Batch ${i} hata:`, error.message);
      process.exit(1);
    }
    synced += batch.length;
    console.log(`  … ${synced}/${products.length}`);
  }

  console.log(`✓ ${synced} ürün senkronize edildi`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
