import type { CartItem } from "./types";
import { createAdminClient } from "./supabase/admin";

export interface CreateOrderInput {
  items: CartItem[];
  orderType: "delivery" | "click_collect";
  customerEmail: string;
  customerName: string;
  customerPhone?: string | null;
  userId?: string | null;
  isB2b?: boolean;
  zipCode?: string;
  address?: string;
  deliveryDate?: string;
  pickupDate?: string;
  pickupSlot?: string;
  pickupSlotId?: string | null;
  notes?: string;
  locale?: "de" | "tr";
}

function generateOrderNumber(): string {
  const d = new Date();
  const date = d.toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `BOS-${date}-${rand}`;
}

export async function createOrder(input: CreateOrderInput) {
  const admin = createAdminClient();
  if (!admin) {
    return { ok: false as const, error: "SUPABASE_NOT_CONFIGURED" };
  }

  let subtotalNet = 0;
  let taxAmount = 0;
  let totalGross = 0;

  for (const item of input.items) {
    const lineNet = item.priceNet * item.quantity;
    const lineGross = item.priceGross * item.quantity;
    subtotalNet += lineNet;
    taxAmount += lineGross - lineNet;
    totalGross += lineGross;
  }

  subtotalNet = Math.round(subtotalNet * 100) / 100;
  taxAmount = Math.round(taxAmount * 100) / 100;
  totalGross = Math.round(totalGross * 100) / 100;

  const orderNumber = generateOrderNumber();

  const { data: order, error: orderError } = await admin
    .from("orders")
    .insert({
      order_number: orderNumber,
      user_id: input.userId ?? null,
      order_type: input.orderType,
      status: "pending",
      is_b2b: input.isB2b ?? false,
      subtotal_net: subtotalNet,
      tax_amount: taxAmount,
      total_gross: totalGross,
      customer_email: input.customerEmail,
      customer_name: input.customerName,
      customer_phone: input.customerPhone?.trim() || null,
      delivery_zip_code: input.zipCode ?? null,
      delivery_date: input.orderType === "delivery" ? input.deliveryDate ?? null : null,
      delivery_address:
        input.address || input.locale || input.deliveryDate
          ? {
              ...(input.address ? { raw: input.address, street: input.address } : {}),
              ...(input.deliveryDate ? { deliveryDate: input.deliveryDate } : {}),
              ...(input.locale ? { locale: input.locale } : {}),
            }
          : null,
      pickup_date: input.pickupDate ?? null,
      pickup_slot_id: input.pickupSlotId ?? null,
      pickup_slot_label: input.pickupSlot ?? null,
      notes: input.notes ?? null,
    })
    .select("id, order_number")
    .single();

  if (orderError || !order) {
    console.error("Order insert error:", orderError);
    return { ok: false as const, error: orderError?.message ?? "ORDER_FAILED" };
  }

  const productIds = [...new Set(input.items.map((i) => i.productId).filter(Boolean))];
  let validProductIds = new Set<string>();
  if (productIds.length > 0) {
    const { data: existing } = await admin.from("products").select("id").in("id", productIds);
    validProductIds = new Set((existing ?? []).map((p) => p.id));
  }

  const orderItems = input.items.map((item) => ({
    order_id: order.id,
    product_id: validProductIds.has(item.productId) ? item.productId : null,
    product_name: item.name,
    product_sku: item.sku,
    quantity: item.quantity,
    unit_price_net: item.priceNet,
    tax_rate: item.taxRate,
    line_total_gross: Math.round(item.priceGross * item.quantity * 100) / 100,
  }));

  const { error: itemsError } = await admin.from("order_items").insert(orderItems);

  if (itemsError) {
    console.error("Order items error:", itemsError);
    await admin.from("orders").delete().eq("id", order.id);
    return { ok: false as const, error: itemsError.message };
  }

  const { notifyOrderPlaced } = await import("./order-notifications");
  await notifyOrderPlaced({
    customerEmail: input.customerEmail,
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    orderNumber: order.order_number,
    orderType: input.orderType,
    totalGross,
    items: input.items,
    locale: input.locale ?? "de",
    zipCode: input.zipCode,
    address: input.address,
    pickupDate: input.pickupDate,
    pickupSlot: input.pickupSlot,
  }).catch((err) => console.error("Order notify error:", err));

  return {
    ok: true as const,
    orderNumber: order.order_number,
    orderId: order.id,
    totalGross,
  };
}
