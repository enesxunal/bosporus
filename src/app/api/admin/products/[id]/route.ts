import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { clearProductsCache } from "@/lib/products-db";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "DB error" }, { status: 503 });

  const { data, error } = await admin.from("products").select("*").eq("id", id).single();
  if (error || !data) return NextResponse.json({ error: "Ürün bulunamadı" }, { status: 404 });

  return NextResponse.json({ product: data });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const body = await request.json();

  const allowed = [
    "name_de", "name_tr", "description_de", "description_tr",
    "price_b2c", "price_b2b", "promo_price",
    "promo_from", "promo_to", "is_active", "stock_status", "tax_rate",
    "barcode", "image_url", "image_urls", "category_slug",
  ] as const;

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }

  if (Array.isArray(body.image_urls)) {
    const urls = body.image_urls.filter((u: unknown) => typeof u === "string" && u.trim());
    updates.image_urls = urls;
    updates.image_url = urls[0] ?? body.image_url ?? null;
  }

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "DB error" }, { status: 503 });

  const { data, error } = await admin.from("products").update(updates).eq("id", id).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  clearProductsCache();
  return NextResponse.json({ product: data });
}
