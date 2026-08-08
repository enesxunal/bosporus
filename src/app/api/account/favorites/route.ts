import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { isUniqueViolation, parseFavoriteProductId } from "@/lib/favorites";
import { enrichProductsWithPfand } from "@/lib/pfand";
import type { Product } from "@/lib/types";

export async function GET(request: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const includeDetails = new URL(request.url).searchParams.get("details") === "1";

  if (!includeDetails) {
    const { data, error } = await auth.supabase
      .from("product_favorites")
      .select("product_id")
      .eq("user_id", auth.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: "LOAD_FAILED" }, { status: 500 });
    }

    return NextResponse.json({
      productIds: (data ?? []).map((r) => r.product_id as string),
    });
  }

  const { data, error } = await auth.supabase
    .from("product_favorites")
    .select("product_id, created_at, product:products(*)")
    .eq("user_id", auth.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "LOAD_FAILED" }, { status: 500 });
  }

  const productIds: string[] = [];
  const rawProducts: Product[] = [];

  for (const row of data ?? []) {
    const pid = row.product_id as string;
    productIds.push(pid);
    const p = row.product as Product | Product[] | null;
    const product = Array.isArray(p) ? p[0] : p;
    if (product && product.is_active !== false) {
      rawProducts.push(product);
    }
  }

  const products = enrichProductsWithPfand(rawProducts);

  return NextResponse.json({ productIds, products });
}

export async function POST(request: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 });
  }

  const parsed = parseFavoriteProductId(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: parsed.status });
  }

  const { data: product, error: productError } = await auth.supabase
    .from("products")
    .select("id")
    .eq("id", parsed.productId)
    .maybeSingle();

  if (productError) {
    return NextResponse.json({ error: "LOOKUP_FAILED" }, { status: 500 });
  }
  if (!product) {
    return NextResponse.json({ error: "PRODUCT_NOT_FOUND" }, { status: 404 });
  }

  const { error } = await auth.supabase.from("product_favorites").insert({
    user_id: auth.user.id,
    product_id: parsed.productId,
  });

  if (error && !isUniqueViolation(error)) {
    return NextResponse.json({ error: "SAVE_FAILED" }, { status: 500 });
  }

  // Duplicate → idempotent 200
  return NextResponse.json({ ok: true, productId: parsed.productId });
}
