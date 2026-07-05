import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSiteUrl } from "@/lib/site-url";
import { sendEmail } from "@/lib/email/smtp";

async function sendConfirmEmail(email: string, link: string, locale: "de" | "tr") {
  const de = locale !== "tr";
  const subject = de ? "E-Mail bestätigen – Bosporus" : "E-postanızı onaylayın – Bosporus";
  const html = `
    <p>${de ? "Guten Tag," : "Merhaba,"}</p>
    <p>${de ? "Bitte bestätigen Sie Ihre E-Mail-Adresse:" : "Lütfen e-posta adresinizi onaylayın:"}</p>
    <p><a href="${link}" style="display:inline-block;padding:12px 24px;background:#1D71B8;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold">${de ? "E-Mail bestätigen" : "E-postayı onayla"}</a></p>
    <p style="font-size:12px;color:#666">${de ? "Falls der Link nicht funktioniert:" : "Link çalışmazsa:"} ${link}</p>
  `;
  return sendEmail({ to: email, subject, html, templateType: "campaign", referenceId: "email-verify" });
}

export async function POST(request: Request) {
  const { email, locale } = (await request.json()) as { email?: string; locale?: "de" | "tr" };
  if (!email?.trim()) return NextResponse.json({ error: "E-Mail erforderlich" }, { status: 400 });

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "DB nicht konfiguriert" }, { status: 503 });

  const normalized = email.trim().toLowerCase();
  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: normalized,
    options: { redirectTo: `${getSiteUrl()}/auth/callback?next=/login` },
  });

  if (error || !data.properties?.action_link) {
    return NextResponse.json({ error: error?.message ?? "Link konnte nicht erstellt werden" }, { status: 400 });
  }

  await sendConfirmEmail(normalized, data.properties.action_link, locale ?? "de");
  return NextResponse.json({ success: true });
}
