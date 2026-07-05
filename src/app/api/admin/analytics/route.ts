import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "DB error" }, { status: 503 });

  const days = 14;
  const since = new Date(Date.now() - days * 86400000).toISOString();

  const { data: orders } = await admin
    .from("orders")
    .select("id, created_at, total_gross, status")
    .gte("created_at", since)
    .order("created_at");

  const validOrderIds = (orders ?? []).filter((o) => o.status !== "cancelled").map((o) => o.id);

  const dailyMap = new Map<string, { total: number; count: number }>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    dailyMap.set(d.toISOString().slice(0, 10), { total: 0, count: 0 });
  }

  for (const o of orders ?? []) {
    if (o.status === "cancelled") continue;
    const key = (o.created_at as string).slice(0, 10);
    const entry = dailyMap.get(key);
    if (entry) {
      entry.total += Number(o.total_gross);
      entry.count += 1;
    }
  }

  const dailySales = [...dailyMap.entries()].map(([date, v]) => ({
    date,
    total: Math.round(v.total * 100) / 100,
    count: v.count,
  }));

  let topProducts: { name: string; sku: string; qty: number; revenue: number }[] = [];

  if (validOrderIds.length > 0) {
    const { data: items } = await admin
      .from("order_items")
      .select("product_name, product_sku, quantity, line_total_gross")
      .in("order_id", validOrderIds);

    const productMap = new Map<string, { name: string; sku: string; qty: number; revenue: number }>();
    for (const row of items ?? []) {
      const sku = row.product_sku as string;
      const existing = productMap.get(sku) ?? {
        name: row.product_name as string,
        sku,
        qty: 0,
        revenue: 0,
      };
      existing.qty += Number(row.quantity);
      existing.revenue += Number(row.line_total_gross);
      productMap.set(sku, existing);
    }

    topProducts = [...productMap.values()]
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 8)
      .map((p) => ({ ...p, revenue: Math.round(p.revenue * 100) / 100 }));
  }

  const weekTotal = dailySales.reduce((s, d) => s + d.total, 0);
  const weekOrders = dailySales.reduce((s, d) => s + d.count, 0);

  return NextResponse.json({
    dailySales,
    topProducts,
    weekTotal: Math.round(weekTotal * 100) / 100,
    weekOrders,
  });
}
