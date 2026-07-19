import { COMPANY } from "./company";
import { sendWhatsAppToAdmins } from "./whatsapp";

/** Ödeme alındı ama sipariş yazılamadı — admin uyarısı (+ isteğe bağlı iade notu) */
export async function alertPaymentFulfillmentIssue(params: {
  provider: "stripe" | "paypal";
  reference: string;
  customerEmail?: string;
  customerName?: string;
  amountEur?: number;
  error: string;
  refunded?: boolean;
}): Promise<void> {
  const amount =
    params.amountEur != null ? `${params.amountEur.toFixed(2)} €` : "?";
  const refundLine = params.refunded
    ? "İade başlatıldı / Refund gestartet"
    : "İade YOK — manuel kontrol!";
  const text = [
    `⚠️ ÖDEME/SİPARİŞ SORUNU (${params.provider.toUpperCase()})`,
    `Ref: ${params.reference}`,
    `Tutar: ${amount}`,
    params.customerName ? `Müşteri: ${params.customerName}` : null,
    params.customerEmail ? `E-Mail: ${params.customerEmail}` : null,
    `Hata: ${params.error}`,
    refundLine,
  ]
    .filter(Boolean)
    .join("\n");

  await Promise.allSettled([
    sendWhatsAppToAdmins(text),
    sendAdminAlertEmail({
      subject: `[Bosporus] Ödeme sorunu — ${params.provider} ${params.reference}`,
      text,
    }),
  ]);
}

async function sendAdminAlertEmail(params: { subject: string; text: string }): Promise<void> {
  try {
    const { sendEmail } = await import("./email/smtp");
    const to = process.env.ADMIN_NOTIFY_EMAIL ?? COMPANY.email;
    await sendEmail({
      to,
      subject: params.subject,
      html: `<pre style="font-family:sans-serif;white-space:pre-wrap">${params.text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")}</pre>`,
      templateType: "campaign",
      referenceId: `pay-alert-${Date.now()}`,
    });
  } catch (e) {
    console.error("Admin payment alert email failed:", e);
  }
}
