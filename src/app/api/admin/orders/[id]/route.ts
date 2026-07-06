import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyOrderStatusChange } from "@/lib/order-notifications";
import type { OrderStatus } from "@/lib/types";

const NOTIFY_STATUSES: OrderStatus[] = ["preparing", "ready", "out_for_delivery", "delivered", "cancelled"];

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

  if (NOTIFY_STATUSES.includes(status) && before.status !== status && order.customer_email) {
    const [{ data: items }, profileRes] = await Promise.all([
      admin.from("order_items").select("product_name, quantity, line_total_gross").eq("order_id", id),
      order.user_id
        ? admin.from("profiles").select("locale").eq("id", order.user_id).single()
        : Promise.resolve({ data: null }),
    ]);

    const addressRaw =
      order.delivery_address && typeof order.delivery_address === "object"
        ? (order.delivery_address as { raw?: string }).raw
        : undefined;

    const storedLocale = (order.delivery_address as { locale?: string } | null)?.locale;
    const profileLocale = profileRes.data?.locale;
    const locale: "de" | "tr" =
      profileLocale === "tr" || storedLocale === "tr" ? "tr" : "de";

    void notifyOrderStatusChange({
      status,
      customerEmail: order.customer_email,
      customerName: order.customer_name ?? "Kunde",
      customerPhone: order.customer_phone ?? undefined,
      orderNumber: order.order_number,
      orderType: order.order_type,
      totalGross: Number(order.total_gross),
      items: items ?? [],
      locale,
      zipCode: order.delivery_zip_code ?? undefined,
      address: addressRaw,
      pickupDate: order.pickup_date ?? undefined,
      pickupSlot: order.pickup_slot_label ?? undefined,
    }).catch((e) => console.error("Status notify error:", e));
  }

  return NextResponse.json({ order });
}
