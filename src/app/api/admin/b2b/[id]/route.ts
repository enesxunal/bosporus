import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendB2bStatusEmail } from "@/lib/email";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const { action } = (await request.json()) as { action: "approve" | "reject" };

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "DB error" }, { status: 503 });

  const { data: before } = await admin
    .from("profiles")
    .select("email, company_name, locale, role")
    .eq("id", id)
    .single();

  if (!before) return NextResponse.json({ error: "Profil nicht gefunden" }, { status: 404 });

  if (action === "approve") {
    const { data, error } = await admin
      .from("profiles")
      .update({ role: "b2b_approved", vat_verified: true })
      .eq("id", id)
      .eq("role", "b2b_pending")
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    if (before.email) {
      sendB2bStatusEmail({
        to: before.email,
        action: "approve",
        companyName: before.company_name ?? "Ihr Unternehmen",
        locale: (before.locale as "de" | "tr") ?? "de",
      }).catch((e) => console.error("B2B approve email:", e));
    }

    return NextResponse.json({ profile: data });
  }

  if (action === "reject") {
    const { error } = await admin
      .from("profiles")
      .update({ role: "b2c" })
      .eq("id", id)
      .eq("role", "b2b_pending");

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    if (before.email) {
      sendB2bStatusEmail({
        to: before.email,
        action: "reject",
        companyName: before.company_name ?? "Ihr Unternehmen",
        locale: (before.locale as "de" | "tr") ?? "de",
      }).catch((e) => console.error("B2B reject email:", e));
    }

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Ungültige Aktion" }, { status: 400 });
}
