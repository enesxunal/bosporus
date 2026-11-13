import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getProductsAsync } from "@/lib/products-db";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import type { Product } from "@/lib/types";

type RequestedLine = { sku: string; quantity: number };
const MAX_LINES = 100;

/** Strictly approved B2B-only bulk SKU lookup. No stock, prices, or products mutate. */
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("role, vat_verified").eq("id", user.id).maybeSingle();
  const approved = profile?.role === "admin" ||
    (profile?.role === "b2b_approved" && Boolean(profile.vat_verified));
  if (!approved) return NextResponse.json({ error: "B2B_APPROVAL_REQUIRED" }, { status: 403 });

  const limit = rateLimit(`bulk-lookup:${user.id}:${clientIp(request)}`, 25, 60_000);
  if (!limit.ok) return NextResponse.json({ error: "RATE_LIMIT" }, { status: 429 });

  let input: unknown;
  try { input = await request.json(); } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }
  const items = (input as { items?: unknown })?.items;
  if (!Array.isArray(items) || items.length === 0 || items.length > MAX_LINES) {
    return NextResponse.json({ error: "INVALID_LINES" }, { status: 400 });
  }
  const wanted = new Map<string, number>();
  for (const entry of items as RequestedLine[]) {
    const sku = typeof entry?.sku === "string" ? entry.sku.toLowerCase().trim() : "";
    const quantity = Number(entry?.quantity);
    if (!/^[a-z0-9][a-z0-9._-]{0,127}$/.test(sku) || !Number.isInteger(quantity) || quantity < 1 || quantity > 999 || wanted.has(sku)) {
      return NextResponse.json({ error: "INVALID_SKU_OR_QUANTITY" }, { status: 400 });
    }
    wanted.set(sku, quantity);
  }

  // Use the same active, priced catalog as the shop. No inactive ERP drafts.
  const all = await getProductsAsync({ activeOnly: true });
  const bySku = new Map(all.map((p) => [p.sku.toLowerCase(), p]));
  const found: { product: Product; quantity: number }[] = [];
  const missing: string[] = [];
  for (const [sku, quantity] of wanted) {
    const product = bySku.get(sku);
    if (!product || product.stock_status === "out_of_stock") {
      missing.push(sku);
    } else {
      found.push({ product, quantity });
    }
  }

  return NextResponse.json(
    { found, missing },
    { headers: { "Cache-Control": "private, no-store" } }
  );
}
