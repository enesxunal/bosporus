import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { isSmtpConfigured, sendEmail } from "@/lib/email/smtp";

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  if (!isSmtpConfigured()) {
    return NextResponse.json(
      { error: "SMTP ayarlı değil (SMTP_HOST, SMTP_USER, SMTP_PASS)" },
      { status: 503 }
    );
  }

  const body = (await request.json().catch(() => ({}))) as { to?: string };
  const to = body.to?.trim() || process.env.ADMIN_NOTIFY_EMAIL || "info@bosporus-gmbh.com";

  const result = await sendEmail({
    to,
    subject: "Bosporus — SMTP test",
    html: `<p>Bu bir test e-postasıdır.</p><p>${new Date().toLocaleString("de-DE", { timeZone: "Europe/Berlin" })}</p>`,
    templateType: "campaign",
    referenceId: "admin-smtp-test",
  });

  if (result.ok) {
    return NextResponse.json({ ok: true, to });
  }

  return NextResponse.json(
    { error: "error" in result ? result.error : "Gönderilemedi" },
    { status: 500 }
  );
}
