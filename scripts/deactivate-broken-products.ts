/**
 * Bozuk ürünleri (ör. name_de = "#") pasife alır.
 * Vercel build sırasında env anahtarları ile çalışır.
 */
import { createClient } from "@supabase/supabase-js";

const BROKEN_SKUS = ["item-558"];

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    console.warn("deactivate-broken-products: Supabase env yok, atlanıyor");
    return;
  }

  const admin = createClient(url, key, { auth: { persistSession: false } });
  const now = new Date().toISOString();

  const { data: bySku, error: e1 } = await admin
    .from("products")
    .update({ is_active: false, updated_at: now })
    .in("sku", BROKEN_SKUS)
    .select("sku, name_de, is_active");
  if (e1) console.warn("sku deactivate:", e1.message);
  else console.log("sku deactivated:", bySku);

  const { data: byName, error: e2 } = await admin
    .from("products")
    .update({ is_active: false, updated_at: now })
    .eq("name_de", "#")
    .eq("is_active", true)
    .select("sku, name_de, is_active");
  if (e2) console.warn("name deactivate:", e2.message);
  else if (byName?.length) console.log("name # deactivated:", byName);
}

main().catch((e) => {
  console.warn("deactivate-broken-products failed:", e);
});
