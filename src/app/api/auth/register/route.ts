import { NextResponse } from "next/server";
import { authErrorMessage } from "@/lib/auth-errors";
import { createAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { getSiteUrl } from "@/lib/site-url";
import { sendEmail } from "@/lib/email/smtp";

async function sendConfirmEmail(email: string, link: string) {
  const html = `
    <p>Guten Tag,</p>
    <p>Bitte bestätigen Sie Ihre E-Mail-Adresse für Ihr Bosporus-Konto:</p>
    <p><a href="${link}" style="display:inline-block;padding:12px 24px;background:#1D71B8;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold">E-Mail bestätigen</a></p>
    <p style="font-size:12px;color:#666">${link}</p>
  `;
  return sendEmail({
    to: email,
    subject: "E-Mail bestätigen – Bosporus",
    html,
    templateType: "campaign",
    referenceId: "register-verify",
  });
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

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Supabase nicht konfiguriert" }, { status: 503 });
  }

  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();
  const normalizedEmail = String(email).trim().toLowerCase();

  const { data, error } = await admin.auth.admin.createUser({
    email: normalizedEmail,
    password,
    email_confirm: false,
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

    const { data: linkData } = await admin.auth.admin.generateLink({
      type: "signup",
      email: normalizedEmail,
      password,
      options: { redirectTo: `${getSiteUrl()}/auth/callback?next=/login` },
    });

    if (linkData?.properties?.action_link) {
      sendConfirmEmail(normalizedEmail, linkData.properties.action_link).catch((e) =>
        console.error("Verify email send:", e)
      );
    }
  }

  return NextResponse.json({
    success: true,
    needsVerification: true,
    message: "Konto erstellt! Bitte bestätigen Sie Ihre E-Mail-Adresse (Link wurde gesendet).",
    userId: data.user?.id,
  });
}
