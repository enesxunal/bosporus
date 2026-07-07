"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { CreditCard } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { CartItem } from "@/lib/types";

interface StripeCheckoutProps {
  disabled?: boolean;
  getPayload: () => {
    items: CartItem[];
    orderType: "delivery" | "click_collect";
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    zipCode?: string;
    address?: string;
    deliveryDate?: string;
    pickupDate?: string;
    pickupSlot?: string;
    locale: "de" | "tr";
  };
  onError: (message: string) => void;
}

export function StripeCheckout({ disabled, getPayload, onError }: StripeCheckoutProps) {
  const t = useTranslations("checkout");
  const [loading, setLoading] = useState(false);

  const startCheckout = async () => {
    const payload = getPayload();
    if (!payload.customerName.trim() || !payload.customerEmail.trim()) {
      onError(t("contactRequired"));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/stripe/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        onError(data.error ?? t("stripeError"));
        return;
      }
      if (data.url) {
        window.location.href = data.url as string;
        return;
      }
      onError(t("stripeError"));
    } catch {
      onError(t("stripeError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <Button
        type="button"
        onClick={startCheckout}
        loading={loading}
        disabled={disabled || loading}
        size="lg"
        fullWidth
        variant="outline"
        className="!border-[#635bff] !text-[#635bff] hover:!bg-[#635bff]/5"
      >
        <CreditCard className="w-5 h-5" />
        {t("payWithStripe")}
      </Button>
      <p className="text-xs text-center text-bosporus-muted">{t("stripeKlarnaHint")}</p>
    </div>
  );
}
