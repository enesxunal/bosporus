import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isSupabaseAdminConfigured } from "@/lib/supabase/admin";

function getAnonClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

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

  const supabase = getAnonClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase nicht konfiguriert" }, { status: 503 });
  }

  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, role: "b2c" },
    },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    message: "Konto erstellt! Sie können sich jetzt anmelden.",
    userId: data.user?.id,
  });
}
