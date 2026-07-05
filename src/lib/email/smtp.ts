import nodemailer from "nodemailer";
import type { EmailTemplateType } from "./templates";
import { createAdminClient } from "@/lib/supabase/admin";

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  templateType: EmailTemplateType;
  referenceId?: string;
}

export function isSmtpConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS
  );
}

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;

  const port = Number(process.env.SMTP_PORT ?? 587);
  const secure = process.env.SMTP_SECURE === "true";

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
}

function getFromAddress(): string {
  return (
    process.env.SMTP_FROM ??
    process.env.ORDER_EMAIL_FROM ??
    "Bosporus GmbH <info@bosporus-gmbh.com>"
  );
}

async function logEmail(
  params: SendEmailParams & { status: "sent" | "failed" | "skipped"; error?: string }
) {
  const admin = createAdminClient();
  if (!admin) return;
  await admin.from("email_logs").insert({
    recipient_email: params.to,
    template_type: params.templateType,
    subject: params.subject,
    status: params.status,
    reference_id: params.referenceId ?? null,
    error_message: params.error ?? null,
  });
}

export async function sendEmail(params: SendEmailParams) {
  const transporter = getTransporter();
  if (!transporter) {
    console.info(`Email skipped (${params.templateType}): SMTP not configured`);
    await logEmail({ ...params, status: "skipped", error: "SMTP not configured" });
    return { ok: false as const, skipped: true };
  }

  try {
    await transporter.sendMail({
      from: getFromAddress(),
      replyTo: process.env.SMTP_REPLY_TO ?? "info@bosporus-gmbh.com",
      to: params.to,
      subject: params.subject,
      html: params.html,
    });
    await logEmail({ ...params, status: "sent" });
    return { ok: true as const };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`Email failed (${params.templateType}):`, message);
    await logEmail({ ...params, status: "failed", error: message });
    return { ok: false as const, skipped: false, error: message };
  }
}

export async function sendBulkEmails(
  emails: SendEmailParams[]
): Promise<{ sent: number; failed: number; skipped: number }> {
  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const email of emails) {
    const result = await sendEmail(email);
    if (result.ok) sent++;
    else if ("skipped" in result && result.skipped) skipped++;
    else failed++;
    // Kleine Pause gegen SMTP-Rate-Limits
    await new Promise((r) => setTimeout(r, 200));
  }

  return { sent, failed, skipped };
}
