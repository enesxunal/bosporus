import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { COMPANY, companyAddressLine } from "./company";

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
  deliveryDate?: string | null;
  items: {
    product_name: string;
    product_sku: string;
    quantity: number;
    line_total_gross: number;
  }[];
}

export function generateInvoicePdf(data: InvoiceData): Buffer {
  const doc = new jsPDF();

  doc.setFontSize(14);
  doc.text(COMPANY.legalName, 14, 20);
  doc.setFontSize(9);
  doc.text(companyAddressLine(), 14, 27);
  doc.text(`${COMPANY.country} · Tel: ${COMPANY.phone}`, 14, 32);
  doc.text(`E-Mail: ${COMPANY.email}`, 14, 37);
  doc.text(`USt-IdNr.: ${COMPANY.vatId}`, 14, 42);
  doc.text(`Steuernummer: ${COMPANY.taxNumber}`, 14, 47);
  doc.text(`${COMPANY.registerCourt}, ${COMPANY.registerNumber}`, 14, 52);

  doc.setFontSize(13);
  doc.text("Rechnung / Bestellung", 14, 64);
  doc.setFontSize(10);
  doc.text(`Nr.: ${data.orderNumber}`, 14, 72);
  doc.text(`Datum: ${new Date(data.createdAt).toLocaleDateString("de-DE")}`, 14, 78);
  doc.text(`Kunde: ${data.customerName}`, 14, 84);
  doc.text(`E-Mail: ${data.customerEmail}`, 14, 90);

  if (data.orderType === "delivery") {
    doc.text(`Lieferung: ${data.address ?? ""} · ${data.zipCode ?? ""}`, 14, 96);
    if (data.deliveryDate) doc.text(`Lieferdatum: ${data.deliveryDate}`, 14, 102);
  }

  autoTable(doc, {
    startY: data.orderType === "delivery" && data.deliveryDate ? 108 : 98,
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
  doc.text("Zahlung bei Lieferung / Abholung.", 14, finalY + 38);
  doc.text(`${COMPANY.legalName} · ${companyAddressLine()}`, 14, finalY + 44);

  return Buffer.from(doc.output("arraybuffer"));
}

export function generateInvoicePdfBytes(data: InvoiceData): Uint8Array {
  return new Uint8Array(generateInvoicePdf(data));
}
