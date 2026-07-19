import { NextResponse } from "next/server";
import { authErrorMessage } from "@/lib/auth-errors";
import { createAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { sendAccountVerificationEmail } from "@/lib/auth-verification-email";

export async function POST(request: Request) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json(
      { error: "Supabase nicht konfiguriert. Bitte in Vercel verbinden." },
      { status: 503 }
    );
  }

  const { email, password, firstName, lastName, locale: bodyLocale } = await request.json();

  if (!email || !password) {
    return NextResponse.json({ error: "E-Mail und Passwort erforderlich" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Passwort mindestens 6 Zeichen" }, { status: 400 });
  }

  const locale: "de" | "tr" = bodyLocale === "tr" ? "tr" : "de";
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
    user_metadata: { full_name: fullName, role: "b2c", locale },
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
        locale,
      },
      { onConflict: "id" }
    );

    if (profileError) {
      console.error("B2C profile upsert error:", profileError);
    }

    const mail = await sendAccountVerificationEmail({
      email: normalizedEmail,
      password,
      fullName,
      locale,
      variant: "b2c",
    });
    if (!mail.ok) {
      console.error("B2C verify email failed:", mail.error);
      return NextResponse.json({
        success: true,
        needsVerification: true,
        emailSent: false,
        message:
          locale === "tr"
            ? "Hesap oluşturuldu ama doğrulama e-postası gönderilemedi. Lütfen daha sonra tekrar gönderin."
            : "Konto erstellt, aber die Bestätigungs-E-Mail konnte nicht gesendet werden. Bitte später erneut senden.",
        userId: data.user.id,
      });
    }

    void import("@/lib/whatsapp")
      .then(({ sendWhatsAppToAdmins }) =>
        import("@/lib/whatsapp-messages").then(({ whatsappAdminSignUp }) =>
          sendWhatsAppToAdmins(
            whatsappAdminSignUp({
              type: "b2c",
              email: normalizedEmail,
              name: fullName,
            })
          )
        )
      )
      .catch((e) => console.error("WhatsApp signup notify:", e));
  }

  return NextResponse.json({
    success: true,
    needsVerification: true,
    emailSent: true,
    message:
      locale === "tr"
        ? "Hesap oluşturuldu! Lütfen e-posta adresinizi doğrulayın (link gönderildi)."
        : "Konto erstellt! Bitte bestätigen Sie Ihre E-Mail-Adresse (Link wurde gesendet).",
    userId: data.user?.id,
  });
}
