import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import {
  getWhatsAppStatus,
  sendWhatsAppText,
  sendWhatsAppTemplate,
  getOrderPlacedTemplateName,
  getWhatsAppTemplateLanguage,
  isWhatsAppConfigured,
} from "@/lib/whatsapp";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  return NextResponse.json(getWhatsAppStatus());
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  if (!isWhatsAppConfigured()) {
    return NextResponse.json(
      {
        error:
          "WhatsApp henüz bağlı değil. Vercel'e WHATSAPP_ACCESS_TOKEN ve WHATSAPP_PHONE_NUMBER_ID ekleyin.",
      },
      { status: 400 }
    );
  }

  const body = (await request.json().catch(() => ({}))) as {
    to?: string;
    mode?: "text" | "template";
  };

  const to = body.to?.trim();
  if (!to) {
    return NextResponse.json({ error: "Telefon numarası gerekli (+49...)" }, { status: 400 });
  }

  if (body.mode === "template") {
    const template = getOrderPlacedTemplateName();
    if (!template) {
      return NextResponse.json(
        {
          error:
            "Şablon adı yok. Vercel'e WHATSAPP_TEMPLATE_ORDER_PLACED ekleyin (Meta'da onaylı isim).",
        },
        { status: 400 }
      );
    }
    const result = await sendWhatsAppTemplate({
      to,
      templateName: template,
      languageCode: getWhatsAppTemplateLanguage("de"),
      bodyParams: ["Test Kunde", "BOS-TEST-001", "12,34 €", "Abholung"],
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.error ?? "Gönderilemedi", skipped: result.skipped }, { status: 500 });
    }
    return NextResponse.json({ ok: true, mode: "template", to });
  }

  const result = await sendWhatsAppText(
    to,
    "✅ Bosporus WhatsApp testi başarılı.\n\nSipariş bildirimleri bu kanaldan gidecek."
  );
  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? "Gönderilemedi", skipped: result.skipped }, { status: 500 });
  }
  return NextResponse.json({ ok: true, mode: "text", to });
}
