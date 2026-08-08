import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "DB error" }, { status: 503 });

  // contact_person 014 migration ile gelir; uygulanmadıysa o kolon olmadan tekrar dener.
  const baseCols = "id, email, company_name, company_address, vat_id, vat_verified, created_at, phone";
  let rows: Record<string, unknown>[] | null = null;
  let error: { message: string } | null = null;

  {
    const r = await admin
      .from("profiles")
      .select(`${baseCols}, contact_person`)
      .eq("role", "b2b_pending")
      .order("created_at", { ascending: false });
    rows = r.data;
    error = r.error;
  }

  if (error && /contact_person/i.test(error.message)) {
    const r = await admin
      .from("profiles")
      .select(baseCols)
      .eq("role", "b2b_pending")
      .order("created_at", { ascending: false });
    rows = r.data;
    error = r.error;
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ profiles: rows });
}
