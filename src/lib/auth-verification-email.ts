import { createAdminClient } from "@/lib/supabase/admin";
import { getSiteUrl } from "@/lib/site-url";
import { sendEmail } from "@/lib/email/smtp";
import { templateEmailVerify } from "@/lib/email/templates";

const recentVerifySends = new Map<string, number>();
const RESEND_COOLDOWN_MS = 60_000;

export async function sendAccountVerificationEmail(params: {
  email: string;
  password?: string;
  fullName?: string | null;
  locale?: "de" | "tr";
  variant?: "b2c" | "b2b";
  /** true = yeniden gönder (cooldown uygulanır) */
  isResend?: boolean;
}): Promise<{ ok: true } | { ok: false; error: string; code?: string }> {
  const admin = createAdminClient();
  if (!admin) return { ok: false, error: "DB nicht konfiguriert", code: "NO_DB" };

  const email = params.email.trim().toLowerCase();
  const locale = params.locale ?? "de";
  const variant = params.variant ?? "b2c";

  if (params.isResend) {
    const last = recentVerifySends.get(email) ?? 0;
    if (Date.now() - last < RESEND_COOLDOWN_MS) {
      return { ok: false, error: "Bitte warten Sie eine Minute.", code: "RATE_LIMIT" };
    }
  }

  const redirectTo = `${getSiteUrl()}/auth/callback?next=${encodeURIComponent(
    locale === "tr" ? "/tr/login" : "/login"
  )}`;

  // Mevcut kullanıcı için magiclink; kayıt anında signup + şifre
  const linkResult = params.password
    ? await admin.auth.admin.generateLink({
        type: "signup",
        email,
        password: params.password,
        options: { redirectTo },
      })
    : await admin.auth.admin.generateLink({
        type: "magiclink",
        email,
        options: { redirectTo },
      });

  const actionLink = linkResult.data?.properties?.action_link;
  if (linkResult.error || !actionLink) {
    return {
      ok: false,
      error: linkResult.error?.message ?? "Link konnte nicht erstellt werden",
      code: "LINK_FAILED",
    };
  }

  const { subject, html } = templateEmailVerify({
    link: actionLink,
    fullName: params.fullName,
    locale,
    variant,
  });

  const result = await sendEmail({
    to: email,
    subject,
    html,
    templateType: "campaign",
    referenceId: `verify-${variant}-${Date.now()}`,
  });

  if (!result.ok) {
    return {
      ok: false,
      error: "error" in result && result.error ? result.error : "E-Mail konnte nicht gesendet werden",
      code: "SMTP_FAILED",
    };
  }

  recentVerifySends.set(email, Date.now());
  return { ok: true };
}
