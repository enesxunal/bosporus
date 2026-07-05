import { NextResponse } from "next/server";
import { authErrorMessage } from "@/lib/auth-errors";
import { createAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { validateVatId } from "@/lib/vies";

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

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Supabase nicht konfiguriert" }, { status: 503 });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const normalizedVatId = vatId.replace(/\s/g, "").toUpperCase();

  const { data, error } = await admin.auth.admin.createUser({
    email: normalizedEmail,
    password,
    email_confirm: true,
    user_metadata: { company_name: companyName, role: "b2b_pending" },
  });

  if (error) {
    console.error("B2B register error:", error);
    return NextResponse.json({ error: authErrorMessage(error) }, { status: 400 });
  }

  if (data.user) {
    const { error: profileError } = await admin.from("profiles").upsert(
      {
        id: data.user.id,
        email: normalizedEmail,
        role: "b2b_pending",
        company_name: companyName,
        company_address: companyAddress,
        vat_id: normalizedVatId,
        vat_verified: true,
      },
      { onConflict: "id" }
    );

    if (profileError) {
      console.error("B2B profile upsert error:", profileError);
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }
  }

  return NextResponse.json({
    success: true,
    message:
      "Gewerbeanfrage eingegangen! Wir prüfen Ihre Daten und schalten Ihr Konto frei. Sie erhalten eine E-Mail.",
    viesName: vies.name,
  });
}
