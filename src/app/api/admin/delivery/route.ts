import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { clearDeliveryCache } from "@/lib/delivery-data";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "DB error" }, { status: 503 });

  const [{ data: zones }, { data: slots }] = await Promise.all([
    admin.from("delivery_zones").select("*").order("sort_order"),
    admin.from("pickup_slots").select("*").order("weekday").order("start_time"),
  ]);

  return NextResponse.json({ zones: zones ?? [], slots: slots ?? [] });
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const body = await request.json();
  const type = body.type as "zone" | "slot";

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "DB error" }, { status: 503 });

  if (type === "zone") {
    const { data, error } = await admin
      .from("delivery_zones")
      .insert({
        name_de: body.name_de,
        name_tr: body.name_tr ?? body.name_de,
        zip_prefixes: body.zip_prefixes ?? [],
        min_order_amount: Number(body.min_order_amount ?? 0),
        delivery_days: body.delivery_days ?? [1, 2, 3, 4, 5, 6],
        sort_order: Number(body.sort_order ?? 0),
      })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    clearDeliveryCache();
    return NextResponse.json({ zone: data });
  }

  if (type === "slot") {
    const { data, error } = await admin
      .from("pickup_slots")
      .insert({
        weekday: Number(body.weekday),
        start_time: body.start_time,
        end_time: body.end_time,
        max_orders: Number(body.max_orders ?? 10),
        is_active: body.is_active !== false,
      })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    clearDeliveryCache();
    return NextResponse.json({ slot: data });
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const body = await request.json();
  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "DB error" }, { status: 503 });

  if (body.type === "zone" && body.id) {
    const { data, error } = await admin
      .from("delivery_zones")
      .update({
        name_de: body.name_de,
        name_tr: body.name_tr,
        zip_prefixes: body.zip_prefixes,
        min_order_amount: body.min_order_amount,
        delivery_days: body.delivery_days,
        sort_order: body.sort_order,
      })
      .eq("id", body.id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    clearDeliveryCache();
    return NextResponse.json({ zone: data });
  }

  if (body.type === "slot" && body.id) {
    const { data, error } = await admin
      .from("pickup_slots")
      .update({
        weekday: body.weekday,
        start_time: body.start_time,
        end_time: body.end_time,
        max_orders: body.max_orders,
        is_active: body.is_active,
      })
      .eq("id", body.id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    clearDeliveryCache();
    return NextResponse.json({ slot: data });
  }

  return NextResponse.json({ error: "Invalid" }, { status: 400 });
}

export async function DELETE(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const id = searchParams.get("id");
  if (!type || !id) return NextResponse.json({ error: "type and id required" }, { status: 400 });

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "DB error" }, { status: 503 });

  const table = type === "zone" ? "delivery_zones" : "pickup_slots";
  const { error } = await admin.from(table).delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  clearDeliveryCache();
  return NextResponse.json({ success: true });
}
