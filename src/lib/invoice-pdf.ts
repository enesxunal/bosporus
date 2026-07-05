import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export interface InvoiceData {
  orderNumber: string;
  createdAt: string;
  customerName: string;
  customerEmail: string;
  orderType: string;
  subtotalNet: number;
  taxAmount: number;
  totalGross: number;
  zipCode?: string | null;
  address?: string | null;
  items: {
    product_name: string;
    product_sku: string;
    quantity: number;
    line_total_gross: number;
  }[];
}

export function generateInvoicePdf(data: InvoiceData): Buffer {
  const doc = new jsPDF();
  const locale = "de";

  doc.setFontSize(18);
  doc.text("Bosporus GmbH", 14, 20);
  doc.setFontSize(11);
  doc.text("Von Hünefeld Straße 2, 50829 Köln", 14, 28);
  doc.text("info@bosporus-gmbh.com · +49 221 34098290", 14, 34);

  doc.setFontSize(14);
  doc.text(locale === "de" ? "Bestellung / Rechnung" : "Sipariş / Fatura", 14, 48);
  doc.setFontSize(10);
  doc.text(`Nr.: ${data.orderNumber}`, 14, 56);
  doc.text(`Datum: ${new Date(data.createdAt).toLocaleDateString("de-DE")}`, 14, 62);
  doc.text(`Kunde: ${data.customerName}`, 14, 68);
  doc.text(`E-Mail: ${data.customerEmail}`, 14, 74);

  if (data.orderType === "delivery" && (data.address || data.zipCode)) {
    doc.text(`Lieferung: ${data.address ?? ""} ${data.zipCode ?? ""}`, 14, 80);
  }

  autoTable(doc, {
    startY: 88,
    head: [["Artikel", "SKU", "Menge", "Gesamt €"]],
    body: data.items.map((i) => [
      i.product_name,
      i.product_sku,
      String(i.quantity),
      Number(i.line_total_gross).toFixed(2),
    ]),
  });

  const finalY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 120;
  doc.text(`Netto: ${Number(data.subtotalNet).toFixed(2)} €`, 14, finalY + 12);
  doc.text(`MwSt.: ${Number(data.taxAmount).toFixed(2)} €`, 14, finalY + 18);
  doc.setFontSize(12);
  doc.text(`Gesamt: ${Number(data.totalGross).toFixed(2)} €`, 14, finalY + 28);

  doc.setFontSize(8);
  doc.text("Zahlung bei Lieferung / Abholung. Kein Zahlungsdienstleister.", 14, finalY + 40);

  return Buffer.from(doc.output("arraybuffer"));
}

export function generateInvoicePdfBytes(data: InvoiceData): Uint8Array {
  return new Uint8Array(generateInvoicePdf(data));
}
