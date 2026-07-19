"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useCart } from "@/stores/cart";
import { trackPurchase } from "@/lib/analytics";

export function CheckoutSuccessClient({ sessionId }: { sessionId?: string }) {
  const t = useTranslations("checkout");
  const locale = useLocale() as "de" | "tr";
  const router = useRouter();
  const { clear } = useCart();
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!sessionId) return;

    fetch("/api/stripe/complete-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, locale }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.orderNumber) {
          setOrderNumber(data.orderNumber as string);
          trackPurchase(data.orderNumber as string);
          clear();
          router.replace(`/checkout/success?order=${encodeURIComponent(data.orderNumber)}`);
        } else {
          setError(true);
        }
      })
      .catch(() => setError(true));
  }, [sessionId, clear, router, locale]);

  if (!sessionId) return null;

  if (error) {
    return (
      <p className="text-sm text-amber-700 bg-amber-50 rounded-xl p-3 mb-4">
        {t("stripeSuccessPending")}
      </p>
    );
  }

  if (!orderNumber) {
    return (
      <p className="text-sm text-bosporus-muted mb-4 animate-pulse">
        {t("stripeConfirming")}
      </p>
    );
  }

  return null;
}
