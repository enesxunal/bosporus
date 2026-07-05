import type { CartItem } from "@/lib/types";
import type { OrderStatus } from "@/lib/types";
import { sendEmail } from "./smtp";
import {
  templateOrderPlaced,
  templateOrderPreparing,
  templateOrderCompleted,
  templatePromotion,
  type OrderEmailData,
} from "./templates";

function cartToEmailItems(items: CartItem[]) {
  return items.map((i) => ({
    name: i.name,
    quantity: i.quantity,
    lineGross: Math.round(i.priceGross * i.quantity * 100) / 100,
  }));
}

export async function sendOrderPlacedEmail(params: {
  to: string;
  orderNumber: string;
  customerName: string;
  orderType: "delivery" | "click_collect";
  totalGross: number;
  items: CartItem[];
  locale?: "de" | "tr";
  zipCode?: string;
  address?: string;
  pickupDate?: string;
  pickupSlot?: string;
}) {
  const data: OrderEmailData = {
    ...params,
    items: cartToEmailItems(params.items),
  };
  const { subject, html } = templateOrderPlaced(data);
  return sendEmail({
    to: params.to,
    subject,
    html,
    templateType: "order_placed",
    referenceId: params.orderNumber,
  });
}

export async function sendOrderStatusEmail(params: {
  to: string;
  status: OrderStatus;
  orderNumber: string;
  customerName: string;
  orderType: "delivery" | "click_collect";
  totalGross: number;
  items?: { product_name: string; quantity: number; line_total_gross: number }[];
  locale?: "de" | "tr";
  zipCode?: string;
  address?: string;
  pickupDate?: string;
  pickupSlot?: string;
}) {
  const data: OrderEmailData = {
    orderNumber: params.orderNumber,
    customerName: params.customerName,
    orderType: params.orderType,
    totalGross: params.totalGross,
    locale: params.locale,
    zipCode: params.zipCode,
    address: params.address,
    pickupDate: params.pickupDate ?? undefined,
    pickupSlot: params.pickupSlot ?? undefined,
    items: (params.items ?? []).map((i) => ({
      name: i.product_name,
      quantity: Number(i.quantity),
      lineGross: Number(i.line_total_gross),
    })),
  };

  if (params.status === "preparing") {
    const { subject, html } = templateOrderPreparing(data);
    return sendEmail({ to: params.to, subject, html, templateType: "order_preparing", referenceId: params.orderNumber });
  }

  if (params.status === "delivered" || params.status === "ready") {
    const { subject, html } = templateOrderCompleted(data);
    return sendEmail({ to: params.to, subject, html, templateType: "order_completed", referenceId: params.orderNumber });
  }

  return { ok: false as const, skipped: true };
}

export async function sendCampaignEmail(params: {
  to: string;
  subject: string;
  headline: string;
  bodyHtml: string;
  locale?: "de" | "tr";
  campaignId: string;
}) {
  const { subject, html } = templatePromotion({
    locale: params.locale,
    headline: params.headline,
    bodyHtml: params.bodyHtml,
    ctaLabel: params.locale === "tr" ? "Kampanyaları gör" : "Angebote ansehen",
  });
  return sendEmail({
    to: params.to,
    subject: params.subject || subject,
    html,
    templateType: "campaign",
    referenceId: params.campaignId,
  });
}

// Backward compat for orders.ts
export { sendOrderPlacedEmail as sendOrderConfirmationEmail };
