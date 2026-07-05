import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendOrderStatusEmail } from "@/lib/email";
import type { OrderStatus } from "@/lib/types";

const EMAIL_STATUSES: OrderStatus[] = ["preparing", "ready", "delivered"];

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "DB error" }, { status: 503 });

  const { data: order, error } = await admin.from("orders").select("*").eq("id", id).single();
  if (error || !order) return NextResponse.json({ error: "Sipariş bulunamadı" }, { status: 404 });

  const [{ data: items }, profileRes] = await Promise.all([
    admin.from("order_items").select("*").eq("order_id", id).order("product_name"),
    order.user_id
      ? admin.from("profiles").select("id, email, role, company_name, first_name, last_name, phone").eq("id", order.user_id).single()
      : Promise.resolve({ data: null }),
  ]);

  return NextResponse.json({ order, items: items ?? [], profile: profileRes.data });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const { status } = (await request.json()) as { status: OrderStatus };

  if (!status) {
    return NextResponse.json({ error: "Status erforderlich" }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "DB error" }, { status: 503 });

  const { data: before } = await admin.from("orders").select("*").eq("id", id).single();
  if (!before) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });

  const { data: order, error } = await admin
    .from("orders")
    .update({ status })
    .eq("id", id)
    .select("*")
    .single();

  if (error || !order) {
    return NextResponse.json({ error: error?.message ?? "Update fehlgeschlagen" }, { status: 500 });
  }

  if (EMAIL_STATUSES.includes(status) && before.status !== status && order.customer_email) {
    const { data: items } = await admin
      .from("order_items")
      .select("product_name, quantity, line_total_gross")
      .eq("order_id", id);

    const addressRaw =
      order.delivery_address && typeof order.delivery_address === "object"
        ? (order.delivery_address as { raw?: string }).raw
        : undefined;

    sendOrderStatusEmail({
      to: order.customer_email,
      status,
      orderNumber: order.order_number,
      customerName: order.customer_name ?? "Kunde",
      orderType: order.order_type,
      totalGross: Number(order.total_gross),
      items: items ?? [],
      zipCode: order.delivery_zip_code ?? undefined,
      address: addressRaw,
      pickupDate: order.pickup_date ?? undefined,
      pickupSlot: order.pickup_slot_label ?? undefined,
    }).catch((e) => console.error("Status email error:", e));
  }

  return NextResponse.json({ order });
}
