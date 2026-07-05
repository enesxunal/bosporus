/** WhatsApp Business Cloud API (Meta) */

function isConfigured(): boolean {
  return Boolean(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
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

export async function sendWhatsAppText(to: string, body: string): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  if (!isConfigured()) {
    console.info("WhatsApp skipped: WHATSAPP_ACCESS_TOKEN / WHATSAPP_PHONE_NUMBER_ID not set");
    return { ok: false, skipped: true };
  }

  const normalized = normalizeWhatsAppPhone(to);
  if (!normalized) return { ok: false, error: "INVALID_PHONE" };

  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID!;
  const token = process.env.WHATSAPP_ACCESS_TOKEN!;

  try {
    const res = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: normalized,
        type: "text",
        text: { preview_url: false, body: body.slice(0, 4096) },
      }),
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

export async function sendWhatsAppToAdmins(body: string): Promise<void> {
  const admins = getAdminWhatsAppNumbers();
  if (admins.length === 0) {
    console.info("WhatsApp admin skipped: WHATSAPP_ADMIN_PHONES not set");
    return;
  }
  await Promise.all(admins.map((n) => sendWhatsAppText(n, body)));
}
