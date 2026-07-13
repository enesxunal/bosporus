import productsData from "@/data/products.json";
import type { Product } from "./types";
import { createAdminClient } from "./supabase/admin";
import { clearProductsCache } from "./products-db";

const BATCH = 100;

type ExistingRow = {
  id: string;
  sku: string;
  image_url: string | null;
  image_urls: unknown;
  name_tr: string | null;
  description_de: string | null;
  description_tr: string | null;
};

/**
 * Sync catalog from products.json into Supabase.
 * Keeps existing DB row ids (avoids PK conflict) and preserves images / TR texts.
 */
export async function syncProductsFromJson(): Promise<{
  synced: number;
  errors: string[];
  deactivated?: number;
}> {
  const admin = createAdminClient();
  if (!admin) return { synced: 0, errors: ["Veritabanı bağlantısı yok"] };

  const products = productsData as Product[];
  const errors: string[] = [];
  let synced = 0;

  const existingBySku = new Map<string, ExistingRow>();
  const { count } = await admin.from("products").select("id", { count: "exact", head: true });
  const pageSize = 1000;
  const total = count ?? 0;
  for (let from = 0; from < total; from += pageSize) {
    const { data } = await admin
      .from("products")
      .select("id, sku, image_url, image_urls, name_tr, description_de, description_tr")
      .range(from, from + pageSize - 1);
    for (const row of data ?? []) {
      existingBySku.set(row.sku as string, {
        id: row.id as string,
        sku: row.sku as string,
        image_url: (row.image_url as string) ?? null,
        image_urls: row.image_urls,
        name_tr: (row.name_tr as string) ?? null,
        description_de: (row.description_de as string) ?? null,
        description_tr: (row.description_tr as string) ?? null,
      });
    }
  }

  for (let i = 0; i < products.length; i += BATCH) {
    const slice = products.slice(i, i + BATCH);
    const batch = slice.map((p) => {
      const prev = existingBySku.get(p.sku);
      const extra = p as Product & {
        description_de?: string | null;
        description_tr?: string | null;
      };
      return {
        // Keep DB id when SKU already exists — otherwise upsert fights the primary key
        id: prev?.id ?? p.id,
        sku: p.sku,
        barcode: p.barcode,
        name_de: p.name_de,
        name_tr: p.name_tr?.trim() || prev?.name_tr || null,
        description_de: extra.description_de?.trim() || prev?.description_de || null,
        description_tr: extra.description_tr?.trim() || prev?.description_tr || null,
        category_slug: p.category_slug,
        image_url: p.image_url || prev?.image_url || null,
        image_urls:
          (Array.isArray(p.image_urls) && p.image_urls.length > 0
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
      // Fallback: update one-by-one for clearer errors / partial progress
      for (const row of batch) {
        const { error: oneErr } = await admin.from("products").upsert(row, { onConflict: "sku" });
        if (oneErr) {
          errors.push(`${row.sku}: ${oneErr.message}`);
        } else {
          synced += 1;
        }
      }
    } else {
      synced += batch.length;
    }
  }

  clearProductsCache();

  const activeSkus = new Set(products.map((p) => p.sku));
  const { data: allDb } = await admin.from("products").select("sku, is_active");
  const toDisable = (allDb ?? [])
    .filter((r) => r.is_active && !activeSkus.has(r.sku as string))
    .map((r) => r.sku as string);

  if (toDisable.length > 0) {
    for (let i = 0; i < toDisable.length; i += BATCH) {
      const chunk = toDisable.slice(i, i + BATCH);
      const { error } = await admin
        .from("products")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .in("sku", chunk);
      if (error) errors.push(`Deactivate: ${error.message}`);
    }
  }

  return { synced, errors, deactivated: toDisable.length };
}
