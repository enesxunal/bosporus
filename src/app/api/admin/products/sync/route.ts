import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { syncProductsFromJson } from "@/lib/products-sync";
import { syncCategoriesFromJson } from "@/lib/categories-sync";

export async function POST() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const cats = await syncCategoriesFromJson();
  const products = await syncProductsFromJson();

  return NextResponse.json({
    categories: cats,
    products,
    synced: products.synced,
    deactivated: products.deactivated ?? 0,
    errors: [...cats.errors, ...products.errors],
  });
}
