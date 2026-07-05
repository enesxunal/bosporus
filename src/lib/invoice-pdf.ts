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

const BRAND = {
  navy: [0, 45, 91] as [number, number, number],
  blue: [29, 113, 184] as [number, number, number],
  yellow: [255, 240, 0] as [number, number, number],
  gray50: [247, 248, 250] as [number, number, number],
  gray200: [221, 225, 232] as [number, number, number],
  gray600: [92, 101, 115] as [number, number, number],
  gray800: [26, 31, 46] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatEuro(value: number): string {
  return `${value.toFixed(2).replace(".", ",")} €`;
}

export function generateInvoicePdf(data: InvoiceData): Buffer {
  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 14;

  // — Header band
  doc.setFillColor(...BRAND.navy);
  doc.rect(0, 0, pageW, 38, "F");
  doc.setFillColor(...BRAND.yellow);
  doc.rect(0, 38, pageW, 2.5, "F");

  doc.setTextColor(...BRAND.yellow);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text(COMPANY.tradeName.toUpperCase(), margin, 16);

  doc.setTextColor(...BRAND.white);
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.text(COMPANY.legalName, margin, 23);
  doc.text(companyAddressLine(), margin, 28);
  doc.text(`Tel: ${COMPANY.phone}  ·  ${COMPANY.email}`, margin, 33);

  // — Document info box (top right)
  const boxX = pageW - margin - 62;
  doc.setFillColor(...BRAND.white);
  doc.setDrawColor(...BRAND.blue);
  doc.setLineWidth(0.4);
  doc.roundedRect(boxX, 8, 62, 26, 2, 2, "FD");

  doc.setTextColor(...BRAND.navy);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("RECHNUNG", boxX + 31, 16, { align: "center" });

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...BRAND.gray800);
  doc.text(`Nr. ${data.orderNumber}`, boxX + 4, 22);
  doc.text(`Datum: ${formatDate(data.createdAt)}`, boxX + 4, 27);
  doc.text(
    data.orderType === "delivery" ? "Lieferung" : "Abholung",
    boxX + 4,
    32
  );

  // — Customer block
  let y = 50;
  doc.setFillColor(...BRAND.gray50);
  doc.setDrawColor(...BRAND.gray200);
  doc.roundedRect(margin, y, pageW - margin * 2, 28, 2, 2, "FD");

  doc.setFontSize(7.5);
  doc.setTextColor(...BRAND.gray600);
  doc.setFont("helvetica", "bold");
  doc.text("RECHNUNGSADRESSE / KUNDE", margin + 5, y + 7);

  doc.setFontSize(10);
  doc.setTextColor(...BRAND.gray800);
  doc.setFont("helvetica", "bold");
  doc.text(data.customerName || "—", margin + 5, y + 14);

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.text(data.customerEmail, margin + 5, y + 20);

  if (data.orderType === "delivery") {
    const deliveryLine = [data.address, data.zipCode].filter(Boolean).join(" · ");
    if (deliveryLine) doc.text(`Lieferung: ${deliveryLine}`, margin + 5, y + 25);
    else y -= 5;
    if (data.deliveryDate) {
      doc.text(`Lieferdatum: ${formatDate(data.deliveryDate)}`, pageW / 2, y + 25);
    }
  } else {
    doc.text("Abholung im Geschäft · Zahlung bei Abholung", margin + 5, y + 25);
  }

  y += 36;

  // — Line items table
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [["Artikel", "Art.-Nr.", "Menge", "Gesamt"]],
    body: data.items.map((i) => [
      i.product_name,
      i.product_sku,
      String(i.quantity),
      formatEuro(Number(i.line_total_gross)),
    ]),
    headStyles: {
      fillColor: BRAND.navy,
      textColor: BRAND.white,
      fontStyle: "bold",
      fontSize: 9,
      cellPadding: 4,
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: BRAND.gray800,
      cellPadding: 3.5,
    },
    alternateRowStyles: {
      fillColor: BRAND.gray50,
    },
    columnStyles: {
      0: { cellWidth: "auto" },
      1: { cellWidth: 28 },
      2: { halign: "center", cellWidth: 18 },
      3: { halign: "right", cellWidth: 28 },
    },
    theme: "plain",
  });

  const finalY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y + 40;

  // — Totals box
  const totalsW = 72;
  const totalsX = pageW - margin - totalsW;
  const totalsY = finalY + 8;
  const totalsH = 32;

  doc.setFillColor(...BRAND.gray50);
  doc.setDrawColor(...BRAND.blue);
  doc.setLineWidth(0.5);
  doc.roundedRect(totalsX, totalsY, totalsW, totalsH, 2, 2, "FD");

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...BRAND.gray800);

  const labelX = totalsX + 5;
  const valueX = totalsX + totalsW - 5;

  doc.text("Netto", labelX, totalsY + 9);
  doc.text(formatEuro(Number(data.subtotalNet)), valueX, totalsY + 9, { align: "right" });

  doc.text("MwSt.", labelX, totalsY + 16);
  doc.text(formatEuro(Number(data.taxAmount)), valueX, totalsY + 16, { align: "right" });

  doc.setDrawColor(...BRAND.navy);
  doc.setLineWidth(0.3);
  doc.line(totalsX + 4, totalsY + 20, totalsX + totalsW - 4, totalsY + 20);

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...BRAND.navy);
  doc.text("Gesamt", labelX, totalsY + 28);
  doc.text(formatEuro(Number(data.totalGross)), valueX, totalsY + 28, { align: "right" });

  // — Payment note
  const noteY = totalsY + totalsH + 10;
  doc.setFillColor(...BRAND.blue);
  doc.setDrawColor(...BRAND.blue);
  doc.roundedRect(margin, noteY, pageW - margin * 2, 12, 2, 2, "F");

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...BRAND.white);
  doc.text("Zahlung bei Lieferung / Abholung  ·  Bar oder EC-Karte vor Ort", margin + 5, noteY + 7.5);

  // — Footer
  const footerY = doc.internal.pageSize.getHeight() - 22;
  doc.setFillColor(...BRAND.navy);
  doc.rect(0, footerY - 4, pageW, 26, "F");
  doc.setFillColor(...BRAND.yellow);
  doc.rect(0, footerY - 4, pageW, 1.2, "F");

  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...BRAND.white);
  doc.text(
    `${COMPANY.legalName}  ·  ${companyAddressLine()}  ·  ${COMPANY.country}`,
    pageW / 2,
    footerY + 2,
    { align: "center" }
  );
  doc.text(
    `USt-IdNr.: ${COMPANY.vatId}  ·  Steuernr.: ${COMPANY.taxNumber}  ·  ${COMPANY.registerCourt}, ${COMPANY.registerNumber}`,
    pageW / 2,
    footerY + 7,
    { align: "center" }
  );
  doc.setTextColor(...BRAND.yellow);
  doc.text(COMPANY.website.replace("https://", ""), pageW / 2, footerY + 12, { align: "center" });

  return Buffer.from(doc.output("arraybuffer"));
}

export function generateInvoicePdfBytes(data: InvoiceData): Uint8Array {
  return new Uint8Array(generateInvoicePdf(data));
}
