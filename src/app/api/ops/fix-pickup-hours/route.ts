import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { clearDeliveryCache } from "@/lib/delivery-data";

/**
 * One-shot production maintenance: deactivate pickup slots before 08:00.
 * Protected by OPS_PICKUP_FIX_TOKEN. Remove after use.
 */
export async function POST(request: Request) {
  const expected = process.env.OPS_PICKUP_FIX_TOKEN;
  const got = request.headers.get("x-ops-token");
  if (!expected || !got || got !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Admin client unavailable" }, { status: 503 });
  }

  const { data: before, error: beforeErr } = await admin
    .from("pickup_slots")
    .select("id, weekday, start_time, end_time, is_active")
    .eq("is_active", true)
    .lt("start_time", "08:00:00")
    .order("weekday")
    .order("start_time");

  if (beforeErr) {
    return NextResponse.json({ error: beforeErr.message }, { status: 500 });
  }

  const { data: updated, error: updErr } = await admin
    .from("pickup_slots")
    .update({ is_active: false })
    .eq("is_active", true)
    .lt("start_time", "08:00:00")
    .select("id, weekday, start_time, end_time, is_active");

  if (updErr) {
    return NextResponse.json({ error: updErr.message, before }, { status: 500 });
  }

  clearDeliveryCache();

  const { data: activeAfter, error: afterErr } = await admin
    .from("pickup_slots")
    .select("id, weekday, start_time, end_time")
    .eq("is_active", true)
    .order("start_time");

  if (afterErr) {
    return NextResponse.json({ error: afterErr.message, updated }, { status: 500 });
  }

  const starts = (activeAfter ?? []).map((r) => String(r.start_time));
  const earlyAfter = (activeAfter ?? []).filter((r) => String(r.start_time) < "08:00:00");

  return NextResponse.json({
    ok: earlyAfter.length === 0,
    deactivatedCount: updated?.length ?? 0,
    before,
    updated,
    activeAfterCount: activeAfter?.length ?? 0,
    minStart: starts[0] ?? null,
    maxStart: starts.at(-1) ?? null,
    earlyAfterCount: earlyAfter.length,
  });
}

export async function GET(request: Request) {
  const expected = process.env.OPS_PICKUP_FIX_TOKEN;
  const got = request.headers.get("x-ops-token");
  if (!expected || !got || got !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "Admin client unavailable" }, { status: 503 });
  const { data, error } = await admin
    .from("pickup_slots")
    .select("id, weekday, start_time, end_time, is_active")
    .order("weekday")
    .order("start_time");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const active = (data ?? []).filter((r) => r.is_active);
  const early = active.filter((r) => String(r.start_time) < "08:00:00");
  return NextResponse.json({
    total: data?.length ?? 0,
    active: active.length,
    earlyActive: early.length,
    minActiveStart: active[0] ? String(active[0].start_time) : null,
    maxActiveStart: active.length ? String(active.at(-1)!.start_time) : null,
    early,
  });
}
