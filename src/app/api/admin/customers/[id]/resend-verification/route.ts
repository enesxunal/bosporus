import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendAccountVerificationEmail } from "@/lib/auth-verification-email";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "DB error" }, { status: 503 });

  const { data: profile, error } = await admin
    .from("profiles")
    .select("id, email, role, first_name, last_name, company_name, locale")
    .eq("id", id)
    .single();

  if (error || !profile) {
    return NextResponse.json({ error: "Üye bulunamadı" }, { status: 404 });
  }

  // Zaten onaylıysa tekrar gönderme
  try {
    const { data: authUser } = await admin.auth.admin.getUserById(id);
    const u = authUser?.user;
    const confirmed = Boolean(u?.email_confirmed_at ?? (u as { confirmed_at?: string } | undefined)?.confirmed_at);
    if (confirmed) {
      return NextResponse.json({ error: "Bu üye e-postasını zaten onaylamış." }, { status: 400 });
    }
  } catch {
    // auth kontrolü başarısızsa yine de göndermeyi dene
  }

  const fullName =
    [profile.first_name, profile.last_name].filter(Boolean).join(" ") || profile.company_name || null;
  const locale = profile.locale === "tr" ? "tr" : "de";
  const variant = profile.role === "b2b_pending" || profile.role === "b2b_approved" ? "b2b" : "b2c";

  const result = await sendAccountVerificationEmail({
    email: profile.email,
    fullName,
    locale,
    variant,
    isResend: true,
  });

  if (!result.ok) {
    const status = result.code === "RATE_LIMIT" ? 429 : 400;
    return NextResponse.json({ error: result.error, code: result.code }, { status });
  }

  return NextResponse.json({ success: true });
}
