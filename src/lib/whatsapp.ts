/** WhatsApp Business Cloud API (Meta) */

function isConfigured(): boolean {
  return Boolean(process.env.WHATSAPP_ACCESS_TOKEN?.trim() && process.env.WHATSAPP_PHONE_NUMBER_ID?.trim());
}

export function isWhatsAppConfigured(): boolean {
  return isConfigured();
}

/** +49 221... → 4922134098290 */
export function normalizeWhatsAppPhone(raw: string): string | null {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("0") && digits.length >= 10) digits = `49${digits.slice(1)}`;
  if (digits.length < 10) return null;
  return digits;
}

export function getAdminWhatsAppNumbers(): string[] {
  const raw = process.env.WHATSAPP_ADMIN_PHONES ?? "";
  return raw
    .split(",")
    .map((p) => normalizeWhatsAppPhone(p.trim()))
    .filter((p): p is string => Boolean(p));
}

type SendResult = { ok: boolean; skipped?: boolean; error?: string };

async function postWhatsAppMessage(payload: Record<string, unknown>): Promise<SendResult> {
  if (!isConfigured()) {
    console.info("WhatsApp skipped: WHATSAPP_ACCESS_TOKEN / WHATSAPP_PHONE_NUMBER_ID not set");
    return { ok: false, skipped: true };
  }

  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID!.trim();
  const token = process.env.WHATSAPP_ACCESS_TOKEN!.trim();

  try {
    const res = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("WhatsApp API error:", err);
      return { ok: false, error: err };
    }
    return { ok: true };
  } catch (e) {
    console.error("WhatsApp send failed:", e);
    return { ok: false, error: String(e) };
  }
}

export async function sendWhatsAppText(to: string, body: string): Promise<SendResult> {
  const normalized = normalizeWhatsAppPhone(to);
  if (!normalized) return { ok: false, error: "INVALID_PHONE" };

  return postWhatsAppMessage({
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: normalized,
    type: "text",
    text: { preview_url: false, body: body.slice(0, 4096) },
  });
}

/** Onaylı Meta şablonu — müşteriye ilk mesaj / sipariş bildirimi için zorunlu */
export async function sendWhatsAppTemplate(params: {
  to: string;
  templateName: string;
  languageCode: string;
  bodyParams?: string[];
}): Promise<SendResult> {
  const normalized = normalizeWhatsAppPhone(params.to);
  if (!normalized) return { ok: false, error: "INVALID_PHONE" };
  if (!params.templateName.trim()) return { ok: false, error: "NO_TEMPLATE" };

  const components =
    params.bodyParams && params.bodyParams.length > 0
      ? [
          {
            type: "body",
            parameters: params.bodyParams.map((text) => ({
              type: "text",
              text: String(text).slice(0, 1024) || "-",
            })),
          },
        ]
      : undefined;

  return postWhatsAppMessage({
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: normalized,
    type: "template",
    template: {
      name: params.templateName.trim(),
      language: { code: params.languageCode.trim() || "de" },
      ...(components ? { components } : {}),
    },
  });
}

export function getOrderPlacedTemplateName(): string | null {
  return process.env.WHATSAPP_TEMPLATE_ORDER_PLACED?.trim() || null;
}

export function getOrderStatusTemplateName(): string | null {
  return process.env.WHATSAPP_TEMPLATE_ORDER_STATUS?.trim() || null;
}

export function getB2bApprovedTemplateName(): string | null {
  return process.env.WHATSAPP_TEMPLATE_B2B_APPROVED?.trim() || null;
}

export function getWhatsAppTemplateLanguage(locale?: "de" | "tr"): string {
  if (locale === "tr") {
    return process.env.WHATSAPP_TEMPLATE_LANG_TR?.trim() || "tr";
  }
  return process.env.WHATSAPP_TEMPLATE_LANG_DE?.trim() || "de";
}

/**
 * Müşteriye sipariş mesajı: şablon varsa şablon, yoksa serbest metin (Meta 24s kuralı nedeniyle
 * şablon önerilir).
 */
export async function sendWhatsAppCustomerNotify(params: {
  to: string;
  locale?: "de" | "tr";
  fallbackText: string;
  templateName?: string | null;
  bodyParams?: string[];
}): Promise<SendResult> {
  const template = params.templateName?.trim();
  if (template) {
    const result = await sendWhatsAppTemplate({
      to: params.to,
      templateName: template,
      languageCode: getWhatsAppTemplateLanguage(params.locale),
      bodyParams: params.bodyParams,
    });
    if (result.ok || result.skipped) return result;
    console.warn("WhatsApp template failed, trying text fallback:", result.error);
  }
  return sendWhatsAppText(params.to, params.fallbackText);
}

export async function sendWhatsAppToAdmins(body: string): Promise<void> {
  const admins = getAdminWhatsAppNumbers();
  if (admins.length === 0) {
    console.info("WhatsApp admin skipped: WHATSAPP_ADMIN_PHONES not set");
    return;
  }
  await Promise.all(admins.map((n) => sendWhatsAppText(n, body)));
}

export function getWhatsAppStatus(): {
  configured: boolean;
  adminCount: number;
  orderTemplate: string | null;
  statusTemplate: string | null;
} {
  return {
    configured: isConfigured(),
    adminCount: getAdminWhatsAppNumbers().length,
    orderTemplate: getOrderPlacedTemplateName(),
    statusTemplate: getOrderStatusTemplateName(),
  };
}
