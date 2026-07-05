import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "DB error" }, { status: 503 });

  let query = admin
    .from("profiles")
    .select("id, email, role, company_name, first_name, last_name, phone, created_at")
    .neq("role", "admin")
    .order("created_at", { ascending: false })
    .limit(100);

  if (q) {
    query = query.or(`email.ilike.%${q}%,company_name.ilike.%${q}%,first_name.ilike.%${q}%,last_name.ilike.%${q}%`);
  }

  const { data: profiles, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const ids = (profiles ?? []).map((p) => p.id);
  let orderCounts: Record<string, number> = {};

  if (ids.length > 0) {
    const { data: orders } = await admin.from("orders").select("user_id").in("user_id", ids);
    for (const o of orders ?? []) {
      if (o.user_id) orderCounts[o.user_id] = (orderCounts[o.user_id] ?? 0) + 1;
    }
  }

  const customers = (profiles ?? []).map((p) => ({
    ...p,
    order_count: orderCounts[p.id] ?? 0,
    display_name: [p.first_name, p.last_name].filter(Boolean).join(" ") || p.company_name || p.email.split("@")[0],
  }));

  return NextResponse.json({ customers });
}
