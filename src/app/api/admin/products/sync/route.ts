import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { syncProductsFromJson } from "@/lib/products-sync";

export async function POST() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const result = await syncProductsFromJson();
  return NextResponse.json(result);
}
