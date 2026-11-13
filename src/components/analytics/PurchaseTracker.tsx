"use client";

import { useEffect } from "react";
import { trackPurchase } from "@/lib/analytics";

/** Başarı sayfasında sipariş no görünce purchase olayını bir kez gönderir */
export function PurchaseTracker({ orderNumber }: { orderNumber?: string }) {
  useEffect(() => {
    if (!orderNumber) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/orders/purchase-meta?order=${encodeURIComponent(orderNumber)}`
        );
        if (!res.ok) return;
        const data = (await res.json()) as {
          verified?: boolean;
          isPaymentTestOrder?: boolean;
        };
        if (cancelled || data.verified !== true) return;
        trackPurchase(orderNumber, undefined, {
          isPaymentTestOrder: Boolean(data.isPaymentTestOrder),
        });
      } catch {
        // Do not send a purchase event if the order cannot be verified.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orderNumber]);

  return null;
}
