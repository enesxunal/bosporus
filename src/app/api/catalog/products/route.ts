import { NextResponse } from "next/server";
import { getProductsAsync, countProductsAsync } from "@/lib/products-db";
import { isPromoActive } from "@/lib/pricing";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") ?? undefined;
  const search = searchParams.get("q") ?? undefined;
  const filter = searchParams.get("filter");
  const limit = Math.min(Number(searchParams.get("limit") ?? 48), 200);
  const offset = Number(searchParams.get("offset") ?? 0);

  if (filter === "aktion") {
    const all = await getProductsAsync({ limit: 9999, activeOnly: true });
    const promos = all.filter((p) => isPromoActive(p));
    return NextResponse.json({
      products: promos.slice(offset, offset + limit),
      total: promos.length,
    });
  }

  const [products, total] = await Promise.all([
    getProductsAsync({ category, search, limit, offset, activeOnly: true }),
    countProductsAsync({ category, search, activeOnly: true }),
  ]);

  return NextResponse.json({ products, total });
}
