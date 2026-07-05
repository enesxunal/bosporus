import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { validateVatId } from "@/lib/vies";

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

  const body = await request.json();
  const { companyName, companyAddress, vatId, email, password } = body;

  if (!companyName || !companyAddress || !vatId || !email || !password) {
    return NextResponse.json({ error: "Alle Felder sind Pflicht" }, { status: 400 });
  }

  if (!/^DE\d{9}$/.test(vatId.replace(/\s/g, ""))) {
    return NextResponse.json(
      { error: "Nur deutsche USt-IdNr. (DE + 9 Ziffern)" },
      { status: 400 }
    );
  }

  const vies = await validateVatId(vatId);
  if (!vies.valid) {
    return NextResponse.json({ error: vies.error ?? "USt-IdNr. ungültig" }, { status: 400 });
  }

  const supabase = getAnonClient();
  const admin = createAdminClient();
  if (!supabase || !admin) {
    return NextResponse.json({ error: "Supabase nicht konfiguriert" }, { status: 503 });
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { company_name: companyName, role: "b2b_approved" },
    },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (data.user) {
    await admin
      .from("profiles")
      .update({
        role: "b2b_approved",
        company_name: companyName,
        company_address: companyAddress,
        vat_id: vatId.replace(/\s/g, "").toUpperCase(),
        vat_verified: true,
      })
      .eq("id", data.user.id);
  }

  return NextResponse.json({
    success: true,
    message: "Gewerbekonto erstellt! Sie können jetzt im Portal einkaufen.",
    viesName: vies.name,
  });
}
