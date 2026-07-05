import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const { orderNumber, email } = (await request.json()) as {
    orderNumber?: string;
    email?: string;
  };

  const num = orderNumber?.trim().toUpperCase();
  const mail = email?.trim().toLowerCase();

  if (!num || !mail) {
    return NextResponse.json({ error: "Sipariş numarası ve e-posta gerekli" }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "DB error" }, { status: 503 });

  const { data: order, error } = await admin
    .from("orders")
    .select(
      "id, order_number, status, order_type, total_gross, subtotal_net, tax_amount, created_at, customer_name, customer_email, delivery_zip_code, delivery_address, pickup_date, pickup_slot_label, is_b2b"
    )
    .eq("order_number", num)
    .ilike("customer_email", mail)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!order) {
    return NextResponse.json({ error: "Sipariş bulunamadı. Numara ve e-postayı kontrol edin." }, { status: 404 });
  }

  const { data: items } = await admin
    .from("order_items")
    .select("product_name, product_sku, quantity, line_total_gross")
    .eq("order_id", order.id)
    .order("product_name");

  return NextResponse.json({ order, items: items ?? [] });
}
