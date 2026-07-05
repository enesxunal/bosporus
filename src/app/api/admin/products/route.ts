import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { clearProductsCache } from "@/lib/products-db";

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const limit = Math.min(Number(searchParams.get("limit") ?? 50), 200);
  const offset = Number(searchParams.get("offset") ?? 0);
  const active = searchParams.get("active");

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "DB error" }, { status: 503 });

  let query = admin
    .from("products")
    .select("id, sku, name_de, name_tr, category_slug, price_b2c, price_b2b, promo_price, is_active, stock_status, updated_at", { count: "exact" })
    .order("name_de")
    .range(offset, offset + limit - 1);

  if (active === "true") query = query.eq("is_active", true);
  if (active === "false") query = query.eq("is_active", false);
  if (q) {
    query = query.or(`name_de.ilike.%${q}%,sku.ilike.%${q}%,barcode.ilike.%${q}%`);
  }

  const { data, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ products: data, total: count ?? 0 });
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const body = await request.json();
  const nameDe = String(body.name_de ?? "").trim();
  if (!nameDe) return NextResponse.json({ error: "name_de gerekli" }, { status: 400 });

  const sku =
    String(body.sku ?? "").trim() ||
    `MAN-${Date.now().toString(36).toUpperCase()}`;

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "DB error" }, { status: 503 });

  const imageUrls = Array.isArray(body.image_urls)
    ? body.image_urls.filter((u: unknown) => typeof u === "string" && u.trim())
    : [];

  const { data, error } = await admin
    .from("products")
    .insert({
      sku,
      barcode: body.barcode?.trim() || null,
      name_de: nameDe,
      name_tr: body.name_tr?.trim() || null,
      description_de: body.description_de?.trim() || null,
      description_tr: body.description_tr?.trim() || null,
      category_slug: body.category_slug || null,
      price_b2c: Number(body.price_b2c ?? 0),
      price_b2b: Number(body.price_b2b ?? 0),
      promo_price: body.promo_price != null ? Number(body.promo_price) : null,
      promo_from: body.promo_from || null,
      promo_to: body.promo_to || null,
      tax_rate: Number(body.tax_rate ?? 19),
      is_active: body.is_active !== false,
      stock_status: body.stock_status ?? "in_stock",
      image_url: imageUrls[0] ?? body.image_url ?? null,
      image_urls: imageUrls.length ? imageUrls : null,
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  clearProductsCache();
  return NextResponse.json({ product: data }, { status: 201 });
}
