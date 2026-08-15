import { amountBucket } from "./b2b-funnel-shared";

type ClientFunnelAction =
  | { action: "view_item"; productId: string }
  | {
      action: "add_to_cart";
      productId: string;
      quantity: number;
      cartSubtotalBucket: ReturnType<typeof amountBucket>;
    }
  | { action: "quick_order"; linesAdded: number };

async function sendClientFunnelAction(action: ClientFunnelAction): Promise<void> {
  try {
    await fetch("/api/b2b/funnel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(action),
      keepalive: true,
    });
  } catch {
    // Analytics must never block shopping behavior.
  }
}

export function trackApprovedB2bView(productId: string): void {
  void sendClientFunnelAction({ action: "view_item", productId });
}

export function trackApprovedB2bAddToCart(params: {
  productId: string;
  quantity: number;
  cartSubtotal: number;
}): void {
  void sendClientFunnelAction({
    action: "add_to_cart",
    productId: params.productId,
    quantity: params.quantity,
    cartSubtotalBucket: amountBucket(params.cartSubtotal),
  });
}

export function trackQuickOrderUsed(linesAdded: number): void {
  void sendClientFunnelAction({ action: "quick_order", linesAdded });
}
