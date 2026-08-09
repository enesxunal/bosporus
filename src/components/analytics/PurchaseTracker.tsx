"use client";

import { useEffect } from "react";
import { trackPurchase } from "@/lib/analytics";

/** Başarı sayfasında sipariş no görünce purchase olayını bir kez gönderir */
export function PurchaseTracker({ orderNumber }: { orderNumber?: string }) {
  useEffect(() => {
    if (!orderNumber) return;
    let cancelled = false;
    (async () => {
      let isPaymentTestOrder = false;
      try {
        const res = await fetch(
          `/api/orders/purchase-meta?order=${encodeURIComponent(orderNumber)}`
        );
        if (res.ok) {
          const data = (await res.json()) as { isPaymentTestOrder?: boolean };
          isPaymentTestOrder = Boolean(data.isPaymentTestOrder);
        }
      } catch {
        /* ignore — fall through to normal track with dedupe */
      }
      if (cancelled) return;
      trackPurchase(orderNumber, undefined, { isPaymentTestOrder });
    })();
    return () => {
      cancelled = true;
    };
  }, [orderNumber]);

  return null;
}
