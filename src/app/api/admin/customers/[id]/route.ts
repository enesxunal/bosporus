import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "DB error" }, { status: 503 });

  const { data: profile, error } = await admin
    .from("profiles")
    .select("id, email, role, company_name, company_address, vat_id, vat_verified, first_name, last_name, phone, locale, created_at")
    .eq("id", id)
    .single();

  if (error || !profile) return NextResponse.json({ error: "Üye bulunamadı" }, { status: 404 });

  const [{ data: orders }, { data: addresses }] = await Promise.all([
    admin
      .from("orders")
      .select("id, order_number, status, total_gross, created_at, order_type, is_b2b")
      .eq("user_id", id)
      .order("created_at", { ascending: false }),
    admin.from("addresses").select("*").eq("user_id", id).order("is_default", { ascending: false }),
  ]);

  return NextResponse.json({ profile, orders: orders ?? [], addresses: addresses ?? [] });
}
