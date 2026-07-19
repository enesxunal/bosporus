"use client";

import { useEffect } from "react";
import { trackPurchase } from "@/lib/analytics";

/** Başarı sayfasında sipariş no görünce purchase olayını bir kez gönderir */
export function PurchaseTracker({ orderNumber }: { orderNumber?: string }) {
  useEffect(() => {
    if (!orderNumber) return;
    trackPurchase(orderNumber);
  }, [orderNumber]);

  return null;
}
