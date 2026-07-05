import productsData from "@/data/products.json";
import type { Product } from "./types";
import { createAdminClient } from "./supabase/admin";
import { clearProductsCache } from "./products-db";

const BATCH = 200;

export async function syncProductsFromJson(): Promise<{ synced: number; errors: string[] }> {
  const admin = createAdminClient();
  if (!admin) return { synced: 0, errors: ["Veritabanı bağlantısı yok"] };

  const products = productsData as Product[];
  const errors: string[] = [];
  let synced = 0;

  for (let i = 0; i < products.length; i += BATCH) {
    const batch = products.slice(i, i + BATCH).map((p) => ({
      id: p.id,
      sku: p.sku,
      barcode: p.barcode,
      name_de: p.name_de,
      name_tr: p.name_tr,
      category_slug: p.category_slug,
      image_url: p.image_url,
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
    }));

    const { error } = await admin.from("products").upsert(batch, { onConflict: "sku" });
    if (error) {
      errors.push(`Batch ${i}: ${error.message}`);
    } else {
      synced += batch.length;
    }
  }

  clearProductsCache();
  return { synced, errors };
}
