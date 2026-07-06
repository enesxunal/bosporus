import nodemailer from "nodemailer";
import type { EmailTemplateType } from "./templates";
import { createAdminClient } from "@/lib/supabase/admin";
import { COMPANY } from "@/lib/company";

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
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
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  if (!host || !user || !pass) return null;

  const port = Number(process.env.SMTP_PORT ?? 587);
  const secure = process.env.SMTP_SECURE === "true" || port === 465;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    requireTLS: !secure,
    auth: { user, pass },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  });
}

/** Gönderen adresi SMTP kullanıcısı ile aynı domain olmalı (IONOS / spam filtreleri). */
function getFromAddress(): string {
  const user = process.env.SMTP_USER?.trim();
  if (user) return `${COMPANY.tradeName} <${user}>`;
  return (
    process.env.SMTP_FROM?.trim() ??
    process.env.ORDER_EMAIL_FROM?.trim() ??
    `${COMPANY.legalName} <${COMPANY.email}>`
  );
}

function htmlToPlainText(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/tr>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<a[^>]+href="([^"]+)"[^>]*>([^<]*)<\/a>/gi, "$2 ($1)")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
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

  const from = getFromAddress();
  const replyTo = process.env.SMTP_REPLY_TO?.trim() ?? COMPANY.email;
  const text = params.text ?? htmlToPlainText(params.html);
  const domain = (process.env.SMTP_USER?.split("@")[1] ?? "bosporus-gmbh.com").trim();

  try {
    await transporter.sendMail({
      from,
      replyTo,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text,
      headers: {
        "X-Entity-Ref-ID": params.referenceId ?? params.templateType,
        "Auto-Submitted": params.templateType === "campaign" ? "auto-generated" : "no",
      },
      messageId: `<${params.referenceId ?? Date.now()}.${params.to.replace(/@.*/, "")}@${domain}>`,
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
    await new Promise((r) => setTimeout(r, 200));
  }

  return { sent, failed, skipped };
}
