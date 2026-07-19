"use client";

import { useEffect, useRef } from "react";
import { trackBeginCheckout } from "@/lib/analytics";

/** Checkout sayfası açılınca begin_checkout */
export function BeginCheckoutTracker({ value }: { value?: number }) {
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    trackBeginCheckout(value);
  }, [value]);
  return null;
}
