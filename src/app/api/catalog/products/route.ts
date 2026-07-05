import { NextResponse } from "next/server";
import { getProductsAsync } from "@/lib/products-db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") ?? undefined;
  const search = searchParams.get("q") ?? undefined;
  const limit = Math.min(Number(searchParams.get("limit") ?? 80), 200);
  const offset = Number(searchParams.get("offset") ?? 0);

  const products = await getProductsAsync({ category, search, limit, offset, activeOnly: true });
  return NextResponse.json({ products });
}
