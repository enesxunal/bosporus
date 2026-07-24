import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { B2B_ONLY_MODE } from "@/lib/shop-mode";

/** Mevcut B2C hesabını toptancı başvurusuna çevirir */
export async function POST(request: Request) {
  if (!B2B_ONLY_MODE) {
    return NextResponse.json({ error: "Not available" }, { status: 400 });
  }

  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const body = (await request.json().catch(() => ({}))) as {
    companyName?: string;
    companyAddress?: string;
    vatId?: string;
  };

  const companyName = body.companyName?.trim() ?? "";
  const companyAddress = body.companyAddress?.trim() ?? "";
  const vatId = body.vatId?.trim().toUpperCase() ?? "";

  if (!companyName || !companyAddress || !vatId) {
    return NextResponse.json({ error: "Firmenangaben erforderlich" }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "DB error" }, { status: 503 });

  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", auth.user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "Profil nicht gefunden" }, { status: 404 });
  }

  if (profile.role === "b2b_approved" || profile.role === "b2b_pending") {
    return NextResponse.json({ error: "Bereits Gewerbekonto" }, { status: 400 });
  }

  if (profile.role === "admin") {
    return NextResponse.json({ error: "Admin" }, { status: 400 });
  }

  const { error } = await admin
    .from("profiles")
    .update({
      role: "b2b_pending",
      company_name: companyName,
      company_address: companyAddress,
      vat_id: vatId,
      vat_verified: false,
    })
    .eq("id", auth.user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
