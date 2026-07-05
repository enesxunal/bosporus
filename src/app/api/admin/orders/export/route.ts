import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

function csvEscape(value: string | number | null | undefined): string {
  const s = String(value ?? "");
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") ?? "";
  const q = searchParams.get("q")?.trim() ?? "";

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "DB error" }, { status: 503 });

  let query = admin
    .from("orders")
    .select(
      "order_number, status, customer_name, customer_email, order_type, subtotal_net, tax_amount, total_gross, delivery_zip_code, is_b2b, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(5000);

  if (status) query = query.eq("status", status);
  if (q) {
    query = query.or(
      `order_number.ilike.%${q}%,customer_name.ilike.%${q}%,customer_email.ilike.%${q}%`
    );
  }

  const { data: orders, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const header = [
    "order_number",
    "created_at",
    "status",
    "customer_name",
    "customer_email",
    "order_type",
    "subtotal_net",
    "tax_amount",
    "total_gross",
    "delivery_zip_code",
    "is_b2b",
  ].join(",");

  const rows = (orders ?? []).map((o) =>
    [
      csvEscape(o.order_number),
      csvEscape(o.created_at),
      csvEscape(o.status),
      csvEscape(o.customer_name),
      csvEscape(o.customer_email),
      csvEscape(o.order_type),
      csvEscape(o.subtotal_net),
      csvEscape(o.tax_amount),
      csvEscape(o.total_gross),
      csvEscape(o.delivery_zip_code),
      csvEscape(o.is_b2b ? "yes" : "no"),
    ].join(",")
  );

  const csv = [header, ...rows].join("\n");
  const filename = `bosporus-orders-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
