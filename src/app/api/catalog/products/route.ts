import { NextResponse } from "next/server";
import {
  getProductsAsync,
  countProductsAsync,
  fetchPromoProductsPage,
} from "@/lib/products-db";
import { isPromoActive } from "@/lib/pricing";
import { stripB2bPrice } from "@/lib/order-validation";
import { createClient } from "@/lib/supabase/server";
import type { Product } from "@/lib/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") ?? undefined;
  const search = searchParams.get("q") ?? undefined;
  const filter = searchParams.get("filter");
  const limit = Math.min(Number(searchParams.get("limit") ?? 48), 200);
  const offset = Number(searchParams.get("offset") ?? 0);

  let isB2bApproved = false;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      isB2bApproved = profile?.role === "b2b_approved";
    }
  } catch {
    // public catalog
  }

  const sanitize = (list: Product[]) =>
    isB2bApproved ? list : list.map(stripB2bPrice);

  if (filter === "aktion") {
    const fromDb = await fetchPromoProductsPage(offset + limit);
    const promos = (fromDb ?? []).filter((p) => isPromoActive(p));
    const sliced = promos.slice(offset, offset + limit);
    return NextResponse.json({
      products: sanitize(sliced),
      total: promos.length,
    });
  }

  const [products, total] = await Promise.all([
    getProductsAsync({ category, search, limit, offset, activeOnly: true }),
    countProductsAsync({ category, search, activeOnly: true }),
  ]);

  return NextResponse.json({ products: sanitize(products), total });
}
