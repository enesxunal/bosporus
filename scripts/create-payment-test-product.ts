/**
 * Creates (or upserts) the internal PAYMENT-TEST-1EUR product in Supabase.
 *
 * Usage (after deploy of payment-test helpers):
 *   npx tsx scripts/create-payment-test-product.ts
 *
 * Requires SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (or project admin env).
 * Does NOT run automatically — intentional for controlled production insert.
 */
import { createClient } from "@supabase/supabase-js";
import {
  PAYMENT_TEST_PRODUCT_SEED,
  PAYMENT_TEST_SKU,
} from "../src/lib/payment-test-product";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const admin = createClient(url, key, { auth: { persistSession: false } });
  const row = {
    ...PAYMENT_TEST_PRODUCT_SEED,
    updated_at: new Date().toISOString(),
  };

  const { data: existing } = await admin
    .from("products")
    .select("id, sku")
    .eq("sku", PAYMENT_TEST_SKU)
    .maybeSingle();

  if (existing) {
    const { error } = await admin.from("products").update(row).eq("sku", PAYMENT_TEST_SKU);
    if (error) throw error;
    console.log("Updated", PAYMENT_TEST_SKU, existing.id);
  } else {
    const { data, error } = await admin.from("products").insert(row).select("id, sku").single();
    if (error) throw error;
    console.log("Inserted", data.sku, data.id);
  }

  console.log("Direct URLs:");
  console.log(`  /de/product/${PAYMENT_TEST_SKU}`);
  console.log(`  /tr/product/${PAYMENT_TEST_SKU}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
