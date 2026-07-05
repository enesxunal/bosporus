import type { OrderStatus } from "./types";

interface OrderMsgBase {
  orderNumber: string;
  customerName: string;
  totalGross: number;
  orderType: "delivery" | "click_collect";
  locale?: "de" | "tr";
  itemCount?: number;
}

function euro(n: number): string {
  return `${n.toFixed(2).replace(".", ",")} €`;
}

function typeLabel(orderType: OrderMsgBase["orderType"], de: boolean): string {
  if (orderType === "delivery") return de ? "Lieferung" : "Teslimat";
  return de ? "Abholung" : "Gel-Al";
}

export function whatsappCustomerOrderPlaced(data: OrderMsgBase): string {
  const de = data.locale !== "tr";
  if (de) {
    return `✅ Bosporus – Bestellung eingegangen\n\nHallo ${data.customerName},\nIhre Bestellung *${data.orderNumber}* wurde erhalten.\nGesamt: *${euro(data.totalGross)}*\nArt: ${typeLabel(data.orderType, true)}\n\nWir melden uns bei Ihnen. Vielen Dank!`;
  }
  return `✅ Bosporus – Sipariş alındı\n\nMerhaba ${data.customerName},\n*${data.orderNumber}* numaralı siparişiniz alındı.\nToplam: *${euro(data.totalGross)}*\nTür: ${typeLabel(data.orderType, false)}\n\nTeşekkürler!`;
}

export function whatsappAdminOrderPlaced(data: OrderMsgBase & { customerEmail: string; customerPhone?: string | null }): string {
  const de = data.locale !== "tr";
  const phoneLine = data.customerPhone ? `\n📱 ${data.customerPhone}` : "";
  if (de) {
    return `🛒 *Neue Bestellung*\n\nNr: *${data.orderNumber}*\nKunde: ${data.customerName}\nE-Mail: ${data.customerEmail}${phoneLine}\nGesamt: *${euro(data.totalGross)}*\n${typeLabel(data.orderType, true)} · ${data.itemCount ?? "?"} Artikel`;
  }
  return `🛒 *Yeni sipariş*\n\nNo: *${data.orderNumber}*\nMüşteri: ${data.customerName}\nE-posta: ${data.customerEmail}${phoneLine}\nToplam: *${euro(data.totalGross)}*\n${typeLabel(data.orderType, false)} · ${data.itemCount ?? "?"} ürün`;
}

const STATUS_MSG: Partial<Record<OrderStatus, { de: string; tr: string }>> = {
  preparing: {
    de: "wird gerade vorbereitet",
    tr: "hazırlanıyor",
  },
  ready: {
    de: "ist abholbereit",
    tr: "gel-al için hazır",
  },
  out_for_delivery: {
    de: "ist unterwegs zu Ihnen",
    tr: "size doğru yola çıktı",
  },
  delivered: {
    de: "wurde zugestellt",
    tr: "teslim edildi",
  },
  cancelled: {
    de: "wurde storniert",
    tr: "iptal edildi",
  },
};

export function whatsappCustomerStatusUpdate(data: OrderMsgBase & { status: OrderStatus }): string | null {
  const msg = STATUS_MSG[data.status];
  if (!msg) return null;
  const de = data.locale !== "tr";
  if (de) {
    return `📦 Bosporus\n\nHallo ${data.customerName},\nIhre Bestellung *${data.orderNumber}* ${msg.de}.\nGesamt: ${euro(data.totalGross)}`;
  }
  return `📦 Bosporus\n\nMerhaba ${data.customerName},\n*${data.orderNumber}* numaralı siparişiniz ${msg.tr}.\nToplam: ${euro(data.totalGross)}`;
}

export function whatsappAdminStatusUpdate(data: OrderMsgBase & { status: OrderStatus }): string | null {
  const msg = STATUS_MSG[data.status];
  if (!msg) return null;
  return `📦 Status: *${data.status}*\nBestellung *${data.orderNumber}* · ${data.customerName} · ${euro(data.totalGross)}`;
}
