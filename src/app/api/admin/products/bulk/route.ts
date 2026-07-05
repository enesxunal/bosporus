import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

interface BulkBody {
  productIds?: string[];
  categorySlug?: string;
  priceB2cPercent?: number;
  priceB2bPercent?: number;
  isActive?: boolean;
  stockStatus?: string;
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const body = (await request.json()) as BulkBody;
  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "DB error" }, { status: 503 });

  let query = admin.from("products").select("id, price_b2c, price_b2b");

  if (body.productIds?.length) {
    query = query.in("id", body.productIds);
  } else if (body.categorySlug) {
    query = query.eq("category_slug", body.categorySlug);
  } else {
    return NextResponse.json({ error: "productIds or categorySlug required" }, { status: 400 });
  }

  const hasPriceChange =
    typeof body.priceB2cPercent === "number" || typeof body.priceB2bPercent === "number";
  const hasOther =
    body.isActive !== undefined || body.stockStatus !== undefined;

  if (!hasPriceChange && !hasOther) {
    return NextResponse.json({ error: "No updates specified" }, { status: 400 });
  }

  const { data: products, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!products?.length) return NextResponse.json({ updated: 0 });

  let updated = 0;
  for (const p of products) {
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (typeof body.priceB2cPercent === "number") {
      patch.price_b2c = Math.max(0, Math.round(Number(p.price_b2c) * (1 + body.priceB2cPercent / 100) * 100) / 100);
    }
    if (typeof body.priceB2bPercent === "number") {
      patch.price_b2b = Math.max(0, Math.round(Number(p.price_b2b) * (1 + body.priceB2bPercent / 100) * 100) / 100);
    }
    if (body.isActive !== undefined) patch.is_active = body.isActive;
    if (body.stockStatus) patch.stock_status = body.stockStatus;

    const { error: upErr } = await admin.from("products").update(patch).eq("id", p.id);
    if (!upErr) updated++;
  }

  return NextResponse.json({ updated, total: products.length });
}
