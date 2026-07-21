import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as { email?: string };
  const newEmail = body.email?.trim().toLowerCase() ?? "";

  if (!EMAIL_RE.test(newEmail)) {
    return NextResponse.json({ error: "Geçersiz e-posta adresi." }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "DB error" }, { status: 503 });

  // Aynı e-posta başka bir üyede kayıtlı mı?
  const { data: existing } = await admin
    .from("profiles")
    .select("id")
    .ilike("email", newEmail)
    .neq("id", id)
    .maybeSingle();
  if (existing) {
    return NextResponse.json({ error: "Bu e-posta başka bir üyeye ait." }, { status: 409 });
  }

  // auth.users e-postasını güncelle (onaysız olarak işaretle ki tekrar onaylasın)
  const { error: authErr } = await admin.auth.admin.updateUserById(id, {
    email: newEmail,
    email_confirm: false,
  });
  if (authErr) {
    return NextResponse.json({ error: authErr.message }, { status: 400 });
  }

  // profiles tablosunu da güncelle
  const { error: profErr } = await admin.from("profiles").update({ email: newEmail }).eq("id", id);
  if (profErr) {
    return NextResponse.json({ error: profErr.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, email: newEmail });
}
