import type { InvoiceData } from "./invoice-pdf";

interface OrderRow {
  order_number: string;
  created_at: string;
  customer_name: string | null;
  customer_email: string | null;
  order_type: string;
  subtotal_net: number | string;
  tax_amount: number | string;
  total_gross: number | string;
  delivery_zip_code?: string | null;
  delivery_address?: unknown;
  delivery_date?: string | null;
}

interface OrderItemRow {
  product_name: string;
  product_sku: string;
  quantity: number | string;
  line_total_gross: number | string;
}

export function orderToInvoiceData(order: OrderRow, items: OrderItemRow[]): InvoiceData {
  const addressRaw =
    order.delivery_address && typeof order.delivery_address === "object"
      ? (order.delivery_address as { raw?: string }).raw
      : undefined;

  return {
    orderNumber: order.order_number,
    createdAt: order.created_at,
    customerName: order.customer_name ?? "",
    customerEmail: order.customer_email ?? "",
    orderType: order.order_type,
    subtotalNet: Number(order.subtotal_net),
    taxAmount: Number(order.tax_amount),
    totalGross: Number(order.total_gross),
    zipCode: order.delivery_zip_code,
    address: addressRaw,
    deliveryDate: order.delivery_date ?? undefined,
    items: items.map((i) => ({
      product_name: i.product_name,
      product_sku: i.product_sku,
      quantity: Number(i.quantity),
      line_total_gross: Number(i.line_total_gross),
    })),
  };
}
