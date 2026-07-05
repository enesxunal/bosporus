import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "DB error" }, { status: 503 });

  const [orders, pending, campaigns, logs, products] = await Promise.all([
    admin.from("orders").select("id", { count: "exact", head: true }),
    admin.from("profiles").select("id", { count: "exact", head: true }).eq("role", "b2b_pending"),
    admin.from("email_campaigns").select("id", { count: "exact", head: true }),
    admin.from("email_logs").select("id", { count: "exact", head: true }),
    admin.from("products").select("id", { count: "exact", head: true }),
  ]);

  const { data: recentOrders } = await admin
    .from("orders")
    .select("status")
    .gte("created_at", new Date(Date.now() - 7 * 86400000).toISOString());

  const byStatus: Record<string, number> = {};
  for (const o of recentOrders ?? []) {
    byStatus[o.status] = (byStatus[o.status] ?? 0) + 1;
  }

  return NextResponse.json({
    totalOrders: orders.count ?? 0,
    pendingB2b: pending.count ?? 0,
    campaigns: campaigns.count ?? 0,
    emailsSent: logs.count ?? 0,
    totalProducts: products.count ?? 0,
    ordersByStatus: byStatus,
  });
}
