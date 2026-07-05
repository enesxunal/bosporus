import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";

export async function GET() {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const { data: orders, error } = await auth.supabase
    .from("orders")
    .select(
      "id, order_number, order_type, status, total_gross, created_at, delivery_zip_code, delivery_address, pickup_date, pickup_slot_label, customer_name"
    )
    .eq("user_id", auth.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const orderIds = (orders ?? []).map((o) => o.id);
  let itemsByOrder: Record<string, unknown[]> = {};

  if (orderIds.length > 0) {
    const { data: items } = await auth.supabase
      .from("order_items")
      .select("order_id, product_name, product_sku, quantity, line_total_gross")
      .in("order_id", orderIds);

    itemsByOrder = (items ?? []).reduce<Record<string, unknown[]>>((acc, item) => {
      const oid = item.order_id as string;
      if (!acc[oid]) acc[oid] = [];
      acc[oid].push(item);
      return acc;
    }, {});
  }

  const result = (orders ?? []).map((order) => ({
    ...order,
    items: itemsByOrder[order.id] ?? [],
  }));

  return NextResponse.json({ orders: result });
}
