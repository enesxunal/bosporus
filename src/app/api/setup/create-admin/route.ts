import { NextResponse } from "next/server";
import { createAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const secret = request.headers.get("x-setup-key");
  const expected = process.env.ADMIN_SETUP_SECRET;

  if (!expected || secret !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: "Supabase nicht konfiguriert" }, { status: 503 });
  }

  const { email, password } = (await request.json()) as { email?: string; password?: string };
  if (!email?.trim() || !password || password.length < 8) {
    return NextResponse.json({ error: "E-Mail und Passwort (min. 8 Zeichen) erforderlich" }, { status: 400 });
  }

  const admin = createAdminClient()!;
  const normalizedEmail = email.trim().toLowerCase();

  const { data: list } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const existing = list?.users?.find((u) => u.email?.toLowerCase() === normalizedEmail);

  let userId: string;

  if (existing) {
    userId = existing.id;
    const { error } = await admin.auth.admin.updateUserById(userId, {
      password,
      email_confirm: true,
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true,
      user_metadata: { full_name: "Bosporus Admin", role: "admin" },
    });
    if (error || !data.user) {
      return NextResponse.json({ error: error?.message ?? "Create failed" }, { status: 500 });
    }
    userId = data.user.id;
  }

  const { error: profileError } = await admin.from("profiles").upsert(
    {
      id: userId,
      email: normalizedEmail,
      role: "admin",
      first_name: "Bosporus",
      last_name: "Admin",
    },
    { onConflict: "id" }
  );

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    email: normalizedEmail,
    message: "Admin erstellt. Jetzt unter /login anmelden → /admin",
  });
}
