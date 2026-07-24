import { NextResponse } from "next/server";
import { getProductsAsync } from "@/lib/products-db";
import { isPromoActive } from "@/lib/pricing";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { stripAllPrices, stripB2bPrice } from "@/lib/order-validation";
import { B2B_ONLY_MODE } from "@/lib/shop-mode";
import type { Product } from "@/lib/types";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const exclude = searchParams.get("exclude") ?? undefined;
  const category = searchParams.get("category") ?? undefined;
  const recent = (searchParams.get("recent") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const limit = 8;
  const picked: Awaited<ReturnType<typeof getProductsAsync>> = [];
  const seen = new Set<string>();

  const add = (p: Awaited<ReturnType<typeof getProductsAsync>>[number]) => {
    if (p.sku === exclude || seen.has(p.id) || !p.is_active) return;
    seen.add(p.id);
    picked.push(p);
  };

  const all = await getProductsAsync({ limit: 9999, activeOnly: true });

  for (const sku of recent) {
    if (picked.length >= limit) break;
    const p = all.find((x) => x.sku === sku);
    if (p) add(p);
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const admin = createAdminClient();
      if (admin) {
        const { data: orderRows } = await admin
          .from("orders")
          .select("id")
          .eq("user_id", user.id);

        const orderIds = (orderRows ?? []).map((o) => o.id);
        if (orderIds.length > 0) {
          const { data: items } = await admin
            .from("order_items")
            .select("product_sku, quantity")
            .in("order_id", orderIds);

          const counts: Record<string, number> = {};
          for (const item of items ?? []) {
            if (item.product_sku) {
              counts[item.product_sku] = (counts[item.product_sku] ?? 0) + Number(item.quantity);
            }
          }

          const topSkus = Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .map(([sku]) => sku)
            .slice(0, 5);

          for (const sku of topSkus) {
            if (picked.length >= limit) break;
            const p = all.find((x) => x.sku === sku);
            if (p) add(p);
          }
        }
      }
    }
  } catch {
    /* guest */
  }

  if (category) {
    const sameCat = shuffle(all.filter((p) => p.category_slug === category));
    for (const p of sameCat) {
      if (picked.length >= limit) break;
      add(p);
    }
  }

  const promos = shuffle(all.filter((p) => isPromoActive(p)));
  for (const p of promos) {
    if (picked.length >= limit) break;
    add(p);
  }

  if (picked.length < limit) {
    for (const p of shuffle(all)) {
      if (picked.length >= limit) break;
      add(p);
    }
  }

  let isB2bApproved = false;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, vat_verified")
        .eq("id", user.id)
        .single();
      isB2bApproved =
        (profile?.role === "b2b_approved" && Boolean(profile.vat_verified)) ||
        profile?.role === "admin";
    }
  } catch {
    /* guest */
  }

  const list = picked.slice(0, limit) as Product[];
  const products = isB2bApproved
    ? list
    : B2B_ONLY_MODE
      ? list.map(stripAllPrices)
      : list.map(stripB2bPrice);

  return NextResponse.json({ products });
}
