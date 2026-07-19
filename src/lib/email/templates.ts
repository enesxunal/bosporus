import { COMPANY, companyAddressLine } from "@/lib/company";
import { getSiteUrl } from "@/lib/site-url";

function emailSiteUrl(): string {
  return getSiteUrl().replace(/\/$/, "");
}

export type EmailTemplateType =
  | "order_placed"
  | "order_preparing"
  | "order_completed"
  | "campaign";

export type EmailAudience = "all" | "b2c" | "b2b" | "b2b_approved";

export interface EmailLayoutParams {
  locale?: "de" | "tr";
  title: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaUrl?: string;
}

export function emailLayout({ locale = "de", title, bodyHtml, ctaLabel, ctaUrl }: EmailLayoutParams): string {
  const de = locale !== "tr";
  const ctaBlock =
    ctaLabel && ctaUrl
      ? `<p style="margin:28px 0"><a href="${ctaUrl}" style="display:inline-block;padding:14px 28px;background:#1D71B8;color:#fff;text-decoration:none;font-weight:bold;border-radius:10px">${ctaLabel}</a></p>`
      : "";

  return `<!DOCTYPE html>
<html lang="${de ? "de" : "tr"}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#f7f8fa;font-family:Arial,Helvetica,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f8fa;padding:24px 12px">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.06)">
        <tr><td style="background:#1D71B8;padding:24px 28px">
          <h1 style="margin:0;color:#fff;font-size:20px;font-weight:800">${COMPANY.legalName}</h1>
          <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:13px">${de ? "Lebensmittel-Großhandel Köln" : "Köln Gıda Toptan"}</p>
        </td></tr>
        <tr><td style="padding:28px;color:#1a1f2e;font-size:15px;line-height:1.6">
          <h2 style="margin:0 0 16px;font-size:20px;color:#1D71B8">${title}</h2>
          ${bodyHtml}
          ${ctaBlock}
        </td></tr>
        <tr><td style="padding:20px 28px;background:#f7f8fa;border-top:1px solid #eef0f3;font-size:12px;color:#5c6573;line-height:1.5">
          ${COMPANY.legalName} · ${companyAddressLine()}<br>
          Tel: ${COMPANY.phone} · <a href="mailto:${COMPANY.email}" style="color:#1D71B8">${COMPANY.email}</a><br>
          USt-IdNr.: ${COMPANY.vatId} · ${COMPANY.registerCourt}, ${COMPANY.registerNumber}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function formatEuro(amount: number): string {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(amount);
}

export interface OrderEmailData {
  orderNumber: string;
  customerName: string;
  orderType: "delivery" | "click_collect";
  totalGross: number;
  items: { name: string; quantity: number; lineGross: number }[];
  locale?: "de" | "tr";
  zipCode?: string;
  address?: string;
  pickupDate?: string;
  pickupSlot?: string;
}

function itemsTable(items: OrderEmailData["items"], de: boolean): string {
  const rows = items
    .map(
      (i) =>
        `<tr>
          <td style="padding:10px 8px;border-bottom:1px solid #eef0f3">${i.name}</td>
          <td style="padding:10px 8px;border-bottom:1px solid #eef0f3;text-align:center">${i.quantity}</td>
          <td style="padding:10px 8px;border-bottom:1px solid #eef0f3;text-align:right;font-weight:600">${formatEuro(i.lineGross)}</td>
        </tr>`
    )
    .join("");
  return `<table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;font-size:14px">
    <thead><tr style="background:#f7f8fa">
      <th style="padding:10px 8px;text-align:left">${de ? "Artikel" : "Ürün"}</th>
      <th style="padding:10px 8px;text-align:center">${de ? "Menge" : "Adet"}</th>
      <th style="padding:10px 8px;text-align:right">${de ? "Preis" : "Fiyat"}</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
}

function deliveryInfo(data: OrderEmailData, de: boolean): string {
  if (data.orderType === "delivery") {
    return `<p><strong>${de ? "Lieferadresse" : "Teslimat"}:</strong><br>${data.address ?? ""}<br>${data.zipCode ?? ""} Köln</p>`;
  }
  return `<p><strong>${de ? "Abholung" : "Gel-Al"}:</strong><br>${data.pickupDate ?? ""} · ${data.pickupSlot ?? ""}<br>Von Hünefeld Straße 2, 50829 Köln</p>`;
}

export function templateOrderPlaced(data: OrderEmailData): { subject: string; html: string } {
  const de = data.locale !== "tr";
  const subject = de
    ? `Bestellung eingegangen – ${data.orderNumber}`
    : `Siparişiniz alındı – ${data.orderNumber}`;
  const bodyHtml = `
    <p>${de ? "Hallo" : "Merhaba"} <strong>${data.customerName}</strong>,</p>
    <p>${de ? "vielen Dank! Wir haben Ihre Bestellung erhalten und bearbeiten sie in Kürze." : "teşekkürler! Siparişinizi aldık, kısa sürede işleme alacağız."}</p>
    <p style="background:#e8f2fa;padding:12px 16px;border-radius:10px"><strong>${de ? "Bestellnummer" : "Sipariş no"}:</strong> ${data.orderNumber}</p>
    ${deliveryInfo(data, de)}
    ${itemsTable(data.items, de)}
    <p style="font-size:18px;font-weight:800;color:#1D71B8">${de ? "Gesamt" : "Toplam"}: ${formatEuro(data.totalGross)}</p>
    <p style="color:#5c6573;font-size:13px">${de ? "Zahlung online erhalten." : "Ödeme online alındı."}</p>`;
  return {
    subject,
    html: emailLayout({
      locale: data.locale,
      title: de ? "Bestellung eingegangen" : "Sipariş alındı",
      bodyHtml,
      ctaLabel: de ? "Bestellung verfolgen" : "Siparişi takip et",
      ctaUrl: `${emailSiteUrl()}/order/track?order=${encodeURIComponent(data.orderNumber)}`,
    }),
  };
}

export function templateOrderAdminNotify(data: OrderEmailData & { customerEmail: string; customerPhone?: string | null }): { subject: string; html: string } {
  const de = data.locale !== "tr";
  const subject = de
    ? `[Neu] Bestellung ${data.orderNumber} – ${formatEuro(data.totalGross)}`
    : `[Yeni] Sipariş ${data.orderNumber} – ${formatEuro(data.totalGross)}`;
  const bodyHtml = `
    <p>${de ? "Neue Bestellung im Shop:" : "Mağazada yeni sipariş:"}</p>
    <p style="background:#e8f2fa;padding:12px 16px;border-radius:10px">
      <strong>${de ? "Bestellnummer" : "Sipariş no"}:</strong> ${data.orderNumber}<br>
      <strong>${de ? "Kunde" : "Müşteri"}:</strong> ${data.customerName}<br>
      <strong>E-Mail:</strong> ${data.customerEmail}<br>
      ${data.customerPhone ? `<strong>${de ? "Telefon" : "Telefon"}:</strong> ${data.customerPhone}<br>` : ""}
      <strong>${de ? "Gesamt" : "Toplam"}:</strong> ${formatEuro(data.totalGross)}
    </p>
    ${deliveryInfo(data, de)}
    ${itemsTable(data.items, de)}`;
  return {
    subject,
    html: emailLayout({
      locale: data.locale,
      title: de ? "Neue Bestellung" : "Yeni sipariş",
      bodyHtml,
      ctaLabel: de ? "Im Admin öffnen" : "Admin panelde aç",
      ctaUrl: `${emailSiteUrl()}/admin/orders`,
    }),
  };
}

export function templateOrderOutForDelivery(data: OrderEmailData): { subject: string; html: string } {
  const de = data.locale !== "tr";
  const subject = de ? `Bestellung unterwegs – ${data.orderNumber}` : `Sipariş yola çıktı – ${data.orderNumber}`;
  const bodyHtml = `
    <p>${de ? "Hallo" : "Merhaba"} <strong>${data.customerName}</strong>,</p>
    <p>${de ? "Ihre Bestellung" : "Siparişiniz"} <strong>${data.orderNumber}</strong> ${de ? "ist unterwegs." : "yola çıktı."}</p>
    ${deliveryInfo(data, de)}`;
  return {
    subject,
    html: emailLayout({ locale: data.locale, title: de ? "Unterwegs" : "Yolda", bodyHtml }),
  };
}

export function templateOrderCancelled(data: OrderEmailData): { subject: string; html: string } {
  const de = data.locale !== "tr";
  const subject = de ? `Bestellung storniert – ${data.orderNumber}` : `Sipariş iptal – ${data.orderNumber}`;
  const bodyHtml = `
    <p>${de ? "Hallo" : "Merhaba"} <strong>${data.customerName}</strong>,</p>
    <p>${de ? "Ihre Bestellung" : "Siparişiniz"} <strong>${data.orderNumber}</strong> ${de ? "wurde storniert." : "iptal edildi."}</p>
    <p>${de ? "Fragen?" : "Sorularınız için"} ${COMPANY.email} · ${COMPANY.phone}</p>`;
  return {
    subject,
    html: emailLayout({ locale: data.locale, title: de ? "Storniert" : "İptal", bodyHtml }),
  };
}

export function templateOrderPreparing(data: OrderEmailData): { subject: string; html: string } {
  const de = data.locale !== "tr";
  const subject = de
    ? `Ihre Bestellung wird vorbereitet – ${data.orderNumber}`
    : `Siparişiniz hazırlanıyor – ${data.orderNumber}`;
  const bodyHtml = `
    <p>${de ? "Hallo" : "Merhaba"} <strong>${data.customerName}</strong>,</p>
    <p>${de ? "gute Nachrichten! Ihre Bestellung" : "iyi haber! Siparişiniz"} <strong>${data.orderNumber}</strong> ${de ? "wird gerade für Sie vorbereitet." : "şu an hazırlanıyor."}</p>
    ${deliveryInfo(data, de)}
    <p>${de ? "Wir melden uns, sobald Ihre Bestellung bereit ist." : "Hazır olduğunda sizi bilgilendireceğiz."}</p>`;
  return {
    subject,
    html: emailLayout({
      locale: data.locale,
      title: de ? "Bestellung in Vorbereitung" : "Sipariş hazırlanıyor",
      bodyHtml,
    }),
  };
}

export function templateOrderCompleted(data: OrderEmailData): { subject: string; html: string } {
  const de = data.locale !== "tr";
  const isPickup = data.orderType === "click_collect";
  const subject = de
    ? isPickup
      ? `Bestellung abholbereit – ${data.orderNumber}`
      : `Bestellung zugestellt – ${data.orderNumber}`
    : isPickup
      ? `Sipariş alınmaya hazır – ${data.orderNumber}`
      : `Sipariş teslim edildi – ${data.orderNumber}`;
  const bodyHtml = `
    <p>${de ? "Hallo" : "Merhaba"} <strong>${data.customerName}</strong>,</p>
    <p>${isPickup
      ? de
        ? `Ihre Bestellung <strong>${data.orderNumber}</strong> ist abholbereit!`
        : `<strong>${data.orderNumber}</strong> numaralı siparişiniz gel-al için hazır!`
      : de
        ? `Ihre Bestellung <strong>${data.orderNumber}</strong> wurde erfolgreich zugestellt.`
        : `<strong>${data.orderNumber}</strong> numaralı siparişiniz teslim edildi.`}</p>
    ${isPickup ? `<p>${de ? "Adresse: Von Hünefeld Straße 2, 50829 Köln" : "Adres: Von Hünefeld Straße 2, 50829 Köln"}</p>` : ""}
    <p>${de ? "Vielen Dank für Ihren Einkauf bei Bosporus!" : "Bosporus'u tercih ettiğiniz için teşekkürler!"}</p>`;
  return {
    subject,
    html: emailLayout({
      locale: data.locale,
      title: de ? (isPickup ? "Abholbereit" : "Zugestellt") : isPickup ? "Gel-Al hazır" : "Teslim edildi",
      bodyHtml,
    }),
  };
}

export function templateB2bApproved(params: {
  companyName: string;
  locale?: "de" | "tr";
}): { subject: string; html: string } {
  const de = params.locale !== "tr";
  const subject = de
    ? "Gewerbekonto freigeschaltet – Sie können sich anmelden"
    : "Kurumsal hesabınız onaylandı – Giriş yapabilirsiniz";
  const bodyHtml = `
    <p>${de ? "Guten Tag" : "Merhaba"},</p>
    <p>${de
      ? `Ihr Gewerbekonto für <strong>${params.companyName}</strong> wurde freigeschaltet.`
      : `<strong>${params.companyName}</strong> için kurumsal hesabınız onaylanmıştır.`}</p>
    <p>${de
      ? "Sie können sich jetzt anmelden und zu Nettopreisen (B2B) bestellen."
      : "Artık giriş yapabilir ve toptan (B2B) fiyatlarla sipariş verebilirsiniz."}</p>
    <p style="color:#5c6573;font-size:14px">${de
      ? "Nutzen Sie die E-Mail-Adresse und das Passwort Ihrer Registrierung."
      : "Kayıt sırasında kullandığınız e-posta ve şifre ile giriş yapın."}</p>`;
  return {
    subject,
    html: emailLayout({
      locale: params.locale,
      title: de ? "Konto freigeschaltet" : "Hesabınız onaylandı",
      bodyHtml,
      ctaLabel: de ? "Jetzt anmelden" : "Giriş yap",
      ctaUrl: `${emailSiteUrl()}/login`,
    }),
  };
}

export function templateB2bRejected(params: {
  companyName: string;
  locale?: "de" | "tr";
}): { subject: string; html: string } {
  const de = params.locale !== "tr";
  const subject = de ? "Gewerbeanfrage – Bosporus" : "Kurumsal başvuru – Bosporus";
  const bodyHtml = `
    <p>${de ? "Guten Tag" : "Merhaba"},</p>
    <p>${de
      ? `Ihre Gewerbeanfrage für <strong>${params.companyName}</strong> konnte leider nicht freigeschaltet werden. Bei Fragen erreichen Sie uns unter info@bosporus-gmbh.com oder +49 221 34098290.`
      : `<strong>${params.companyName}</strong> için kurumsal başvurunuz onaylanamadı. Sorularınız için info@bosporus-gmbh.com veya +49 221 34098290.`}</p>`;
  return {
    subject,
    html: emailLayout({
      locale: params.locale,
      title: de ? "Anfrage nicht freigeschaltet" : "Başvuru onaylanmadı",
      bodyHtml,
    }),
  };
}

export function templatePromotion(params: {
  locale?: "de" | "tr";
  headline: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaUrl?: string;
}): { subject: string; html: string } {
  return {
    subject: params.headline,
    html: emailLayout({
      locale: params.locale,
      title: params.headline,
      bodyHtml: params.bodyHtml,
      ctaLabel: params.ctaLabel,
      ctaUrl: params.ctaUrl ?? `${emailSiteUrl()}/products?filter=aktion`,
    }),
  };
}

/** Kayıt / e-posta onay maili (kurumsal şablon) */
export function templateEmailVerify(params: {
  link: string;
  locale?: "de" | "tr";
  fullName?: string | null;
  variant?: "b2c" | "b2b";
}): { subject: string; html: string } {
  const de = params.locale !== "tr";
  const name = params.fullName?.trim();
  const greet = name
    ? de
      ? `Guten Tag ${name},`
      : `Merhaba ${name},`
    : de
      ? "Guten Tag,"
      : "Merhaba,";

  const isB2b = params.variant === "b2b";
  const subject = isB2b
    ? de
      ? "E-Mail bestätigen – Bosporus Gewerbekonto"
      : "E-postanızı onaylayın – Bosporus kurumsal hesap"
    : de
      ? "E-Mail bestätigen – Ihr Bosporus-Konto"
      : "E-postanızı onaylayın – Bosporus hesabınız";

  const title = de ? "E-Mail-Adresse bestätigen" : "E-posta adresinizi onaylayın";

  const bodyHtml = `
    <p>${greet}</p>
    <p>${
      de
        ? isB2b
          ? "vielen Dank für Ihre Gewerbeanmeldung bei Bosporus. Bitte bestätigen Sie Ihre E-Mail-Adresse, damit wir Ihren Antrag prüfen können."
          : "willkommen bei Bosporus. Bitte bestätigen Sie Ihre E-Mail-Adresse, um Ihr Kundenkonto zu aktivieren."
        : isB2b
          ? "Bosporus kurumsal başvurunuz için teşekkürler. Başvurunuzu inceleyebilmemiz için lütfen e-posta adresinizi onaylayın."
          : "Bosporus’a hoş geldiniz. Hesabınızı etkinleştirmek için lütfen e-posta adresinizi onaylayın."
    }</p>
    <p style="color:#5c6573;font-size:13px">${
      de
        ? "Der Link ist aus Sicherheitsgründen nur begrenzte Zeit gültig."
        : "Güvenlik nedeniyle link sınırlı süre geçerlidir."
    }</p>
    <p style="font-size:12px;color:#8a93a3;margin-top:24px;word-break:break-all">${
      de ? "Button funktioniert nicht? Link öffnen:" : "Buton çalışmazsa şu linki açın:"
    }<br>${params.link}</p>`;

  return {
    subject,
    html: emailLayout({
      locale: params.locale,
      title,
      bodyHtml,
      ctaLabel: de ? "E-Mail jetzt bestätigen" : "E-postayı şimdi onayla",
      ctaUrl: params.link,
    }),
  };
}
