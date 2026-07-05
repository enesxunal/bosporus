import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1).replace(/^"|"$/g, "")];
    })
);

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;

async function main() {
  console.log("Baglanti:", url ? `VAR (${new URL(url).hostname})` : "YOK");
  if (!url || !key) {
    console.log("Anahtarlar eksik!");
    process.exit(1);
  }

  const sb = createClient(url, key);
  for (const t of ["profiles", "products", "orders", "order_items", "categories"]) {
    const { error } = await sb.from(t).select("*", { count: "exact", head: true });
    console.log(`  ${t}:`, error ? `❌ ${error.code} — migration gerekli` : "✅ tablo var");
  }
}

main();
