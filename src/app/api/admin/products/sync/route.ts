import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { replaceProductsFromJson, syncProductsFromJson } from "@/lib/products-sync";
import { syncCategoriesFromJson } from "@/lib/categories-sync";

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  let mode: "sync" | "replace" = "sync";
  try {
    const body = await request.json();
    if (body?.mode === "replace") mode = "replace";
  } catch {
    // empty body = sync
  }

  const cats = await syncCategoriesFromJson();

  if (mode === "replace") {
    const products = await replaceProductsFromJson();
    return NextResponse.json({
      mode: "replace",
      categories: cats,
      products,
      synced: products.synced,
      deleted: products.deleted,
      errors: [...cats.errors, ...products.errors],
    });
  }

  const products = await syncProductsFromJson();
  return NextResponse.json({
    mode: "sync",
    categories: cats,
    products,
    synced: products.synced,
    deactivated: products.deactivated ?? 0,
    errors: [...cats.errors, ...products.errors],
  });
}
