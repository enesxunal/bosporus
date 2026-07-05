import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email/smtp";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const ip = clientIp(request);
  const limited = rateLimit(`contact:${ip}`, 5, 60 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json({ error: "Zu viele Anfragen." }, { status: 429 });
  }

  const { name, email, phone, message, locale } = (await request.json()) as {
    name?: string;
    email?: string;
    phone?: string;
    message?: string;
    locale?: string;
  };

  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return NextResponse.json({ error: "Name, E-Mail und Nachricht erforderlich" }, { status: 400 });
  }

  const de = locale !== "tr";
  const subject = de
    ? `Kontaktanfrage von ${name.trim()}`
    : `İletişim mesajı – ${name.trim()}`;

  const html = `
    <p><strong>${de ? "Name" : "Ad"}:</strong> ${name.trim()}</p>
    <p><strong>E-Mail:</strong> ${email.trim()}</p>
    ${phone ? `<p><strong>${de ? "Telefon" : "Telefon"}:</strong> ${phone.trim()}</p>` : ""}
    <p><strong>${de ? "Nachricht" : "Mesaj"}:</strong></p>
    <p>${message.trim().replace(/\n/g, "<br>")}</p>
  `;

  const to = process.env.CONTACT_EMAIL ?? "info@bosporus-gmbh.com";
  const result = await sendEmail({
    to,
    subject,
    html,
    templateType: "campaign",
    referenceId: `contact-${Date.now()}`,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: de ? "E-Mail konnte nicht gesendet werden. SMTP prüfen." : "E-posta gönderilemedi. SMTP ayarlarını kontrol edin." },
      { status: 503 }
    );
  }

  return NextResponse.json({ success: true });
}
