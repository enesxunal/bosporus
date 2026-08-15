import { isAmountBucket, type AmountBucket } from "./b2b-funnel-shared";

export type ClientFunnelAction =
  | { action: "view_item"; productId: string }
  | {
      action: "add_to_cart";
      productId: string;
      quantity: number;
      cartSubtotalBucket: AmountBucket;
    }
  | { action: "quick_order"; linesAdded: number };

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function parseClientFunnelAction(input: unknown): ClientFunnelAction | null {
  if (!input || typeof input !== "object") return null;
  const body = input as Record<string, unknown>;

  if (body.action === "view_item") {
    if (typeof body.productId !== "string" || !UUID_PATTERN.test(body.productId)) return null;
    return { action: "view_item", productId: body.productId };
  }

  if (body.action === "add_to_cart") {
    const quantity = Math.floor(Number(body.quantity));
    if (
      typeof body.productId !== "string" ||
      !UUID_PATTERN.test(body.productId) ||
      !Number.isFinite(quantity) ||
      quantity < 1 ||
      quantity > 999 ||
      !isAmountBucket(body.cartSubtotalBucket)
    ) {
      return null;
    }
    return {
      action: "add_to_cart",
      productId: body.productId,
      quantity,
      cartSubtotalBucket: body.cartSubtotalBucket,
    };
  }

  if (body.action === "quick_order") {
    const linesAdded = Math.floor(Number(body.linesAdded));
    if (!Number.isFinite(linesAdded) || linesAdded < 1 || linesAdded > 100) return null;
    return { action: "quick_order", linesAdded };
  }

  return null;
}
