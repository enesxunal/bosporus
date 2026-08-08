import { NextResponse } from "next/server";
import { authErrorMessage } from "@/lib/auth-errors";
import { createAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { validateVatId } from "@/lib/vies";
import { sendAccountVerificationEmail } from "@/lib/auth-verification-email";

export async function POST(request: Request) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json(
      { error: "Supabase nicht konfiguriert. Bitte in Vercel verbinden." },
      { status: 503 }
    );
  }

  const body = await request.json();
  const { companyName, companyAddress, vatId, email, password, phone, contactPerson, locale: bodyLocale } = body;
  const locale: "de" | "tr" = bodyLocale === "tr" ? "tr" : "de";

  if (!companyName || !companyAddress || !vatId || !email || !password || !phone || !contactPerson) {
    return NextResponse.json({ error: "Alle Felder sind Pflicht" }, { status: 400 });
  }

  // Telefon: uluslararası formatlara izin ver (+, boşluk, parantez, tire), harf reddet
  const normalizedPhone = String(phone).trim().replace(/\s+/g, " ");
  const phoneDigits = normalizedPhone.replace(/\D/g, "");
  if (/[A-Za-zÀ-ÿ]/.test(normalizedPhone) || phoneDigits.length < 7 || phoneDigits.length > 20) {
    return NextResponse.json(
      { error: locale === "tr" ? "Lütfen geçerli bir telefon numarası girin." : "Bitte geben Sie eine gültige Telefonnummer ein." },
      { status: 400 }
    );
  }

  const normalizedContactPerson = String(contactPerson).trim();
  if (normalizedContactPerson.length < 2 || normalizedContactPerson.length > 120) {
    return NextResponse.json(
      { error: locale === "tr" ? "Lütfen yetkili kişiyi girin." : "Bitte geben Sie den Ansprechpartner an." },
      { status: 400 }
    );
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
    email_confirm: false,
    user_metadata: {
      company_name: companyName,
      role: "b2b_pending",
      phone: normalizedPhone,
      contact_person: normalizedContactPerson,
    },
  });

  if (error) {
    console.error("B2B register error:", error);
    return NextResponse.json({ error: authErrorMessage(error) }, { status: 400 });
  }

  if (data.user) {
    // phone kolonu mevcut (004). contact_person 014 migration ile gelir; henüz
    // uygulanmadıysa upsert'i contact_person olmadan tekrar dener (canlıyı bozmaz).
    const baseProfile = {
      id: data.user.id,
      email: normalizedEmail,
      role: "b2b_pending",
      company_name: companyName,
      company_address: companyAddress,
      vat_id: normalizedVatId,
      vat_verified: true,
      locale,
      phone: normalizedPhone,
    };

    let profileError = (
      await admin.from("profiles").upsert(
        { ...baseProfile, contact_person: normalizedContactPerson },
        { onConflict: "id" }
      )
    ).error;

    if (profileError && /contact_person/i.test(profileError.message)) {
      profileError = (await admin.from("profiles").upsert(baseProfile, { onConflict: "id" })).error;
    }

    if (profileError) {
      console.error("B2B profile upsert error:", profileError);
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    const mail = await sendAccountVerificationEmail({
      email: normalizedEmail,
      password,
      fullName: companyName,
      locale,
      variant: "b2b",
    });
    if (!mail.ok) {
      console.error("B2B verify email failed:", mail.error);
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
              type: "b2b",
              email: normalizedEmail,
              companyName,
              phone: normalizedPhone,
              contactPerson: normalizedContactPerson,
            })
          )
        )
      )
      .catch((e) => console.error("WhatsApp B2B signup notify:", e));
  }

  return NextResponse.json({
    success: true,
    needsVerification: true,
    emailSent: true,
    message:
      locale === "tr"
        ? "Kurumsal başvuru alındı! Lütfen e-postanızı doğrulayın. Verilerinizi kontrol edip hesabınızı açacağız."
        : "Gewerbeanfrage eingegangen! Bitte bestätigen Sie Ihre E-Mail. Wir prüfen Ihre Daten und schalten Ihr Konto frei.",
    viesName: vies.name,
  });
}
