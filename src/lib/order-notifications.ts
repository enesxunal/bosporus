import type { CartItem } from "./types";
import type { OrderStatus } from "./types";
import { COMPANY } from "./company";
import { sendOrderPlacedEmail, sendOrderStatusEmail } from "./email";
import { sendWhatsAppText, sendWhatsAppToAdmins } from "./whatsapp";
import {
  whatsappCustomerOrderPlaced,
  whatsappAdminOrderPlaced,
  whatsappCustomerStatusUpdate,
  whatsappAdminStatusUpdate,
} from "./whatsapp-messages";

export interface NotifyOrderPlacedParams {
  customerEmail: string;
  customerName: string;
  customerPhone?: string | null;
  orderNumber: string;
  orderType: "delivery" | "click_collect";
  totalGross: number;
  items: CartItem[];
  locale?: "de" | "tr";
  zipCode?: string;
  address?: string;
  pickupDate?: string;
  pickupSlot?: string;
}

export async function notifyOrderPlaced(params: NotifyOrderPlacedParams): Promise<void> {
  const itemCount = params.items.reduce((s, i) => s + i.quantity, 0);
  const base = {
    orderNumber: params.orderNumber,
    customerName: params.customerName,
    totalGross: params.totalGross,
    orderType: params.orderType,
    locale: params.locale,
    itemCount,
  };

  await Promise.allSettled([
    sendOrderPlacedEmail({
      to: params.customerEmail,
      orderNumber: params.orderNumber,
      customerName: params.customerName,
      orderType: params.orderType,
      totalGross: params.totalGross,
      items: params.items,
      locale: params.locale,
      zipCode: params.zipCode,
      address: params.address,
      pickupDate: params.pickupDate,
      pickupSlot: params.pickupSlot,
    }),
    sendOrderAdminNotifyEmail(params),
    sendWhatsAppToAdmins(
      whatsappAdminOrderPlaced({
        ...base,
        customerEmail: params.customerEmail,
        customerPhone: params.customerPhone,
      })
    ),
    params.customerPhone
      ? sendWhatsAppText(params.customerPhone, whatsappCustomerOrderPlaced(base))
      : Promise.resolve(),
  ]);
}

async function sendOrderAdminNotifyEmail(params: NotifyOrderPlacedParams): Promise<void> {
  const { templateOrderAdminNotify } = await import("./email/templates");
  const { sendEmail } = await import("./email/smtp");

  const items = params.items.map((i) => ({
    name: i.name,
    quantity: i.quantity,
    lineGross: Math.round(i.priceGross * i.quantity * 100) / 100,
  }));

  const { subject, html } = templateOrderAdminNotify({
    orderNumber: params.orderNumber,
    customerName: params.customerName,
    customerEmail: params.customerEmail,
    customerPhone: params.customerPhone,
    orderType: params.orderType,
    totalGross: params.totalGross,
    items,
    locale: params.locale,
    zipCode: params.zipCode,
    address: params.address,
    pickupDate: params.pickupDate,
    pickupSlot: params.pickupSlot,
  });

  const adminEmail = process.env.ADMIN_NOTIFY_EMAIL ?? COMPANY.email;

  await sendEmail({
    to: adminEmail,
    subject,
    html,
    templateType: "order_placed",
    referenceId: `admin-${params.orderNumber}`,
  });
}

export async function notifyOrderStatusChange(params: {
  status: OrderStatus;
  customerEmail: string;
  customerName: string;
  customerPhone?: string | null;
  orderNumber: string;
  orderType: "delivery" | "click_collect";
  totalGross: number;
  locale?: "de" | "tr";
  zipCode?: string;
  address?: string;
  pickupDate?: string;
  pickupSlot?: string;
  items?: { product_name: string; quantity: number; line_total_gross: number }[];
}): Promise<void> {
  const base = {
    orderNumber: params.orderNumber,
    customerName: params.customerName,
    totalGross: params.totalGross,
    orderType: params.orderType,
    locale: params.locale,
  };

  const customerWa = whatsappCustomerStatusUpdate({ ...base, status: params.status });
  const adminWa = whatsappAdminStatusUpdate({ ...base, status: params.status });

  await Promise.allSettled([
    sendOrderStatusEmail({
      to: params.customerEmail,
      status: params.status,
      orderNumber: params.orderNumber,
      customerName: params.customerName,
      orderType: params.orderType,
      totalGross: params.totalGross,
      items: params.items,
      locale: params.locale,
      zipCode: params.zipCode,
      address: params.address,
      pickupDate: params.pickupDate,
      pickupSlot: params.pickupSlot,
    }),
    customerWa && params.customerPhone
      ? sendWhatsAppText(params.customerPhone, customerWa)
      : Promise.resolve(),
    adminWa ? sendWhatsAppToAdmins(adminWa) : Promise.resolve(),
  ]);
}
