import { NextResponse } from "next/server";
import { authErrorMessage } from "@/lib/auth-errors";
import { createAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json(
      { error: "Supabase nicht konfiguriert. Bitte in Vercel verbinden." },
      { status: 503 }
    );
  }

  const { email, password, firstName, lastName } = await request.json();

  if (!email || !password) {
    return NextResponse.json({ error: "E-Mail und Passwort erforderlich" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Passwort mindestens 6 Zeichen" }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Supabase nicht konfiguriert" }, { status: 503 });
  }

  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();
  const normalizedEmail = String(email).trim().toLowerCase();

  const { data, error } = await admin.auth.admin.createUser({
    email: normalizedEmail,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, role: "b2c" },
  });

  if (error) {
    console.error("B2C register error:", error);
    return NextResponse.json({ error: authErrorMessage(error) }, { status: 400 });
  }

  if (data.user) {
    const { error: profileError } = await admin.from("profiles").upsert(
      {
        id: data.user.id,
        email: normalizedEmail,
        role: "b2c",
        first_name: firstName?.trim() || null,
        last_name: lastName?.trim() || null,
      },
      { onConflict: "id" }
    );

    if (profileError) {
      console.error("B2C profile upsert error:", profileError);
    }
  }

  return NextResponse.json({
    success: true,
    message: "Konto erstellt! Sie können sich jetzt anmelden.",
    userId: data.user?.id,
  });
}
