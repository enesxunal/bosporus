import type { OrderStatus } from "./types";

/** Sipariş durumu çeviri anahtarları — admin + account ortak */
export const ORDER_STATUS_KEYS: Record<OrderStatus, string> = {
  pending: "statusPending",
  paid: "statusPaid",
  preparing: "statusPreparing",
  ready: "statusReady",
  out_for_delivery: "statusDelivery",
  delivered: "statusDelivered",
  cancelled: "statusCancelled",
};

export function orderStatusLabel(
  status: OrderStatus,
  t: (key: string) => string
): string {
  return t(ORDER_STATUS_KEYS[status] ?? "statusPending");
}
